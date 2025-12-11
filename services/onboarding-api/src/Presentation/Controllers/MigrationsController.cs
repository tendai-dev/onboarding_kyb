using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using System.Text.Json;

namespace OnboardingApi.Presentation.Controllers;

[ApiController]
[Route("api/v1/migrations")]
#if !DEBUG
[Authorize]
#endif
public class MigrationsController : ControllerBase
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<MigrationsController> _logger;
    private static readonly List<MigrationJobDto> _migrationJobs = new();
    private static readonly object _lock = new();

    public MigrationsController(
        IOnboardingCaseRepository repository,
        ILogger<MigrationsController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    /// <summary>
    /// Get all migration jobs
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<MigrationJobDto>), StatusCodes.Status200OK)]
    [AllowAnonymous]
    public IActionResult GetMigrationJobs()
    {
        lock (_lock)
        {
            return Ok(_migrationJobs.OrderByDescending(j => j.StartTime ?? string.Empty).ToList());
        }
    }

    /// <summary>
    /// Get migration job by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(MigrationJobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [AllowAnonymous]
    public IActionResult GetMigrationJob(string id)
    {
        lock (_lock)
        {
            var job = _migrationJobs.FirstOrDefault(j => j.Id == id);
            if (job == null)
                return NotFound(new { error = $"Migration job {id} not found" });

            return Ok(job);
        }
    }

    /// <summary>
    /// Start a new migration job
    /// </summary>
    [HttpPost("start")]
    [ProducesResponseType(typeof(MigrationJobDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [AllowAnonymous]
    public async Task<IActionResult> StartMigration([FromForm] StartMigrationRequest request, CancellationToken cancellationToken)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest(new { error = "File is required" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Migration name is required" });

        if (string.IsNullOrWhiteSpace(request.EntityType))
            return BadRequest(new { error = "Entity type is required" });

        var jobId = $"MIG-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}";
        
        var job = new MigrationJobDto
        {
            Id = jobId,
            Name = request.Name,
            Status = "PENDING",
            Progress = 0,
            TotalRecords = 0,
            ProcessedRecords = 0,
            FailedRecords = 0,
            EntityType = request.EntityType,
            Source = request.File.FileName,
            StartTime = DateTime.UtcNow.ToString("O")
        };

        lock (_lock)
        {
            _migrationJobs.Add(job);
        }

        _logger.LogInformation("Migration job {JobId} created: {Name}", jobId, request.Name);

        // Process migration asynchronously (simulated)
        _ = ProcessMigrationAsync(jobId, request.File, cancellationToken);

        return Ok(job);
    }

    private async Task ProcessMigrationAsync(string jobId, IFormFile file, CancellationToken cancellationToken)
    {
        await Task.Delay(1000, cancellationToken).ConfigureAwait(false); // Simulate initial delay

        lock (_lock)
        {
            var job = _migrationJobs.FirstOrDefault(j => j.Id == jobId);
            if (job == null) return;

            job.Status = "IN_PROGRESS";
            // Simulate reading file and counting records
            job.TotalRecords = new Random().Next(500, 3000);
        }

        // Simulate processing records
        var random = new Random();
        var totalRecords = 0;
        var processedRecords = 0;
        var failedRecords = 0;

        lock (_lock)
        {
            var job = _migrationJobs.FirstOrDefault(j => j.Id == jobId);
            if (job != null)
            {
                totalRecords = job.TotalRecords;
            }
        }

        for (int i = 0; i < totalRecords; i++)
        {
            await Task.Delay(random.Next(10, 50), cancellationToken); // Simulate processing time

            lock (_lock)
            {
                var job = _migrationJobs.FirstOrDefault(j => j.Id == jobId);
                if (job == null) return;

                processedRecords++;
                
                // Randomly fail some records (5% failure rate)
                if (random.Next(100) < 5)
                {
                    failedRecords++;
                }

                job.ProcessedRecords = processedRecords;
                job.FailedRecords = failedRecords;
                job.Progress = (int)((double)processedRecords / totalRecords * 100);

                // Update job every 10 records
                if (i % 10 == 0)
                {
                    _logger.LogDebug("Migration {JobId} progress: {Progress}%", jobId, job.Progress);
                }
            }

            if (cancellationToken.IsCancellationRequested)
                break;
        }

        // Complete or fail the migration
        lock (_lock)
        {
            var job = _migrationJobs.FirstOrDefault(j => j.Id == jobId);
            if (job == null) return;

            if (failedRecords > totalRecords * 0.3) // If more than 30% failed, mark as failed
            {
                job.Status = "FAILED";
                job.ErrorMessage = $"Data validation failed: {failedRecords} records failed validation";
                _logger.LogWarning("Migration {JobId} failed: {Error}", jobId, job.ErrorMessage);
            }
            else
            {
                job.Status = "COMPLETED";
                job.Progress = 100;
                _logger.LogInformation("Migration {JobId} completed successfully", jobId);
            }

            job.EndTime = DateTime.UtcNow.ToString("O");
        }
    }
}

public class StartMigrationRequest
{
    public string Name { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? Source { get; set; }
    public IFormFile File { get; set; } = null!;
}

public class MigrationJobDto
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int Progress { get; set; }
    public int TotalRecords { get; set; }
    public int ProcessedRecords { get; set; }
    public int FailedRecords { get; set; }
    public string? StartTime { get; set; }
    public string? EndTime { get; set; }
    public string? ErrorMessage { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
}

