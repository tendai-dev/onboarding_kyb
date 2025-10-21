using Microsoft.Extensions.Logging;
using Npgsql;
using StackExchange.Redis;

namespace ComplianceRefresh;

/// <summary>
/// Compliance refresh background job
/// Refreshes KYC/KYB checks based on risk tier and regulatory cadence
/// </summary>
public class ComplianceRefreshWorker
{
    private readonly ILogger<ComplianceRefreshWorker> _logger;
    private readonly IConnectionMultiplexer _redis;
    private readonly string _postgresConnection;
    private readonly string _lockKey;
    private readonly int _batchSize;
    private readonly bool _dryRun;

    public ComplianceRefreshWorker(
        ILogger<ComplianceRefreshWorker> logger,
        IConnectionMultiplexer redis,
        IConfiguration configuration)
    {
        _logger = logger;
        _redis = redis;
        _postgresConnection = configuration.GetConnectionString("PostgreSQL")!;
        _lockKey = configuration["DISTRIBUTED_LOCK_KEY"] ?? "job:compliance-refresh";
        _batchSize = int.Parse(configuration["BATCH_SIZE"] ?? "100");
        _dryRun = bool.Parse(configuration["DRY_RUN"] ?? "false");
    }

    public async Task<int> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Starting compliance refresh job (batch size: {BatchSize}, dry run: {DryRun})",
            _batchSize, _dryRun);

        // Acquire distributed lock
        var db = _redis.GetDatabase();
        var lockValue = Guid.NewGuid().ToString();
        
        var lockAcquired = await db.StringSetAsync(
            _lockKey,
            lockValue,
            TimeSpan.FromHours(2),
            When.NotExists);

        if (!lockAcquired)
        {
            _logger.LogWarning("Another instance is already running this job, exiting");
            return 0;
        }

        try
        {
            return await ProcessRefreshesAsync(cancellationToken);
        }
        finally
        {
            // Release lock (only if we still own it)
            var script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end";
            
            await db.ScriptEvaluateAsync(script, new RedisKey[] { _lockKey }, new RedisValue[] { lockValue });
            
            _logger.LogInformation("Released distributed lock");
        }
    }

    private async Task<int> ProcessRefreshesAsync(CancellationToken cancellationToken)
    {
        await using var connection = new NpgsqlConnection(_postgresConnection);
        await connection.OpenAsync(cancellationToken);

        // Find cases requiring refresh based on risk tier
        var sql = @"
            SELECT 
                id, 
                case_number, 
                risk_tier, 
                last_kyc_refresh_at,
                CASE 
                    WHEN risk_tier = 'high' THEN 90
                    WHEN risk_tier = 'medium' THEN 180
                    ELSE 365
                END as refresh_interval_days
            FROM onboarding.onboarding_cases
            WHERE status = 'Approved'
                AND (
                    last_kyc_refresh_at IS NULL
                    OR last_kyc_refresh_at < CURRENT_DATE - INTERVAL '1 day' * 
                        CASE 
                            WHEN risk_tier = 'high' THEN 90
                            WHEN risk_tier = 'medium' THEN 180
                            ELSE 365
                        END
                )
            ORDER BY 
                CASE risk_tier
                    WHEN 'high' THEN 1
                    WHEN 'medium' THEN 2
                    ELSE 3
                END,
                last_kyc_refresh_at NULLS FIRST
            LIMIT @BatchSize";

        await using var command = new NpgsqlCommand(sql, connection);
        command.Parameters.AddWithValue("@BatchSize", _batchSize);

        var casesToRefresh = new List<RefreshCase>();
        
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                casesToRefresh.Add(new RefreshCase
                {
                    Id = reader.GetGuid(0),
                    CaseNumber = reader.GetString(1),
                    RiskTier = reader.GetString(2),
                    LastRefreshAt = reader.IsDBNull(3) ? null : reader.GetDateTime(3),
                    RefreshIntervalDays = reader.GetInt32(4)
                });
            }
        }

        _logger.LogInformation("Found {Count} cases requiring compliance refresh", casesToRefresh.Count);

        if (_dryRun)
        {
            foreach (var c in casesToRefresh)
            {
                _logger.LogInformation(
                    "[DRY RUN] Would refresh case {CaseNumber} (risk: {RiskTier}, last refresh: {LastRefresh})",
                    c.CaseNumber, c.RiskTier, c.LastRefreshAt?.ToString("yyyy-MM-dd") ?? "never");
            }
            return casesToRefresh.Count;
        }

        // Process refreshes
        var processed = 0;
        foreach (var caseToRefresh in casesToRefresh)
        {
            try
            {
                await TriggerComplianceRefreshAsync(connection, caseToRefresh, cancellationToken);
                processed++;
                
                _logger.LogInformation(
                    "Triggered refresh for case {CaseNumber} ({Processed}/{Total})",
                    caseToRefresh.CaseNumber, processed, casesToRefresh.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to refresh case {CaseNumber}",
                    caseToRefresh.CaseNumber);
                // Continue with next case
            }
        }

        _logger.LogInformation("Compliance refresh job completed: {Processed} cases processed", processed);
        return processed;
    }

    private async Task TriggerComplianceRefreshAsync(
        NpgsqlConnection connection,
        RefreshCase refreshCase,
        CancellationToken cancellationToken)
    {
        // Create refresh request event
        var eventSql = @"
            INSERT INTO onboarding.outbox_events 
                (id, aggregate_id, aggregate_type, event_type, payload, occurred_at)
            VALUES 
                (@Id, @AggregateId, @AggregateType, @EventType, @Payload::jsonb, @OccurredAt)";

        await using var command = new NpgsqlCommand(eventSql, connection);
        command.Parameters.AddWithValue("@Id", Guid.NewGuid());
        command.Parameters.AddWithValue("@AggregateId", refreshCase.Id);
        command.Parameters.AddWithValue("@AggregateType", "OnboardingCase");
        command.Parameters.AddWithValue("@EventType", "ComplianceRefreshTriggered");
        command.Parameters.AddWithValue("@Payload", System.Text.Json.JsonSerializer.Serialize(new
        {
            case_id = refreshCase.Id,
            case_number = refreshCase.CaseNumber,
            risk_tier = refreshCase.RiskTier,
            triggered_by = "compliance-refresh-job",
            triggered_at = DateTime.UtcNow
        }));
        command.Parameters.AddWithValue("@OccurredAt", DateTime.UtcNow);

        await command.ExecuteNonQueryAsync(cancellationToken);

        // Update last refresh timestamp
        var updateSql = @"
            UPDATE onboarding.onboarding_cases
            SET last_kyc_refresh_at = @RefreshAt
            WHERE id = @Id";

        await using var updateCommand = new NpgsqlCommand(updateSql, connection);
        updateCommand.Parameters.AddWithValue("@RefreshAt", DateTime.UtcNow);
        updateCommand.Parameters.AddWithValue("@Id", refreshCase.Id);

        await updateCommand.ExecuteNonQueryAsync(cancellationToken);
    }

    private class RefreshCase
    {
        public Guid Id { get; set; }
        public string CaseNumber { get; set; } = string.Empty;
        public string RiskTier { get; set; } = string.Empty;
        public DateTime? LastRefreshAt { get; set; }
        public int RefreshIntervalDays { get; set; }
    }
}

