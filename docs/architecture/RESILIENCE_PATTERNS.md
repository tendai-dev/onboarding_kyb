# Resilience Patterns & Implementation

## Default Timeout & Retry Policies by Dependency Class

### 1. Database (PostgreSQL)

```csharp
// Infrastructure/Persistence/DbContextFactory.cs
services.AddDbContext<OnboardingDbContext>(options =>
{
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.CommandTimeout(30);  // 30 seconds
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: new[] { "57P03", "40001" }  // Connection failure, deadlock
        );
        npgsqlOptions.ExecutionStrategy(c => 
            new NpgsqlRetryingExecutionStrategy(
                c,
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(5),
                errorCodesToAdd: null
            )
        );
    });
});
```

**Policy:**
- **Timeout**: 30 seconds per command
- **Retries**: 3 attempts
- **Backoff**: Exponential (1s, 2s, 5s)
- **Retry on**: Connection failures, deadlocks, transient errors

### 2. Redis (Cache/Idempotency)

```csharp
// Infrastructure/Caching/RedisConfiguration.cs
public class RedisConfiguration
{
    public static ConnectionMultiplexer Configure(string connectionString)
    {
        var options = ConfigurationOptions.Parse(connectionString);
        
        // Timeouts
        options.ConnectTimeout = 5000;  // 5 seconds
        options.SyncTimeout = 3000;     // 3 seconds
        options.AsyncTimeout = 3000;    // 3 seconds
        
        // Retry policy
        options.ConnectRetry = 3;
        options.AbortOnConnectFail = false;
        options.ReconnectRetryPolicy = new ExponentialRetry(1000, 5000);
        
        return ConnectionMultiplexer.Connect(options);
    }
}

// Usage with Polly fallback
public class ResilientCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<ResilientCacheService> _logger;
    private readonly AsyncPolicy _policy;
    
    public ResilientCacheService(IConnectionMultiplexer redis, ILogger<ResilientCacheService> logger)
    {
        _redis = redis;
        _logger = logger;
        
        // Fallback policy: don't fail app if cache is down
        _policy = Policy
            .Handle<RedisException>()
            .Or<TimeoutException>()
            .FallbackAsync(
                fallbackAction: async ct =>
                {
                    _logger.LogWarning("Redis unavailable, continuing without cache");
                },
                onFallbackAsync: async (exception, context) =>
                {
                    _logger.LogError(exception, "Redis fallback triggered");
                }
            );
    }
    
    public async Task<T?> GetAsync<T>(string key)
    {
        try
        {
            return await _policy.ExecuteAsync(async () =>
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetAsync(key);
                return value.HasValue ? JsonSerializer.Deserialize<T>(value!) : default;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Cache get failed for key {Key}", key);
            return default;  // Graceful degradation
        }
    }
}
```

**Policy:**
- **Timeout**: 3 seconds per operation
- **Retries**: 3 attempts (exponential: 1s, 2s, 5s)
- **Fallback**: Continue without cache (graceful degradation)
- **Circuit breaker**: Open after 5 consecutive failures

### 3. Kafka (Event Bus)

```csharp
// Infrastructure/EventBus/ResilientKafkaProducer.cs
public class ResilientKafkaProducer : IEventBus
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<ResilientKafkaProducer> _logger;
    private readonly AsyncPolicy<DeliveryResult<string, string>> _policy;
    
    public ResilientKafkaProducer(IOptions<KafkaOptions> options, ILogger<ResilientKafkaProducer> logger)
    {
        _logger = logger;
        
        var config = new ProducerConfig
        {
            BootstrapServers = options.Value.BootstrapServers,
            MessageTimeoutMs = 30000,      // 30 seconds
            RequestTimeoutMs = 10000,      // 10 seconds
            MessageSendMaxRetries = 3,
            RetryBackoffMs = 1000,
            EnableIdempotence = true,
            Acks = Acks.All
        };
        
        _producer = new ProducerBuilder<string, string>(config).Build();
        
        // Retry policy
        _policy = Policy<DeliveryResult<string, string>>
            .Handle<KafkaException>(ex => ex.Error.IsError && !ex.Error.IsFatal)
            .Or<ProduceException<string, string>>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)) 
                                                   + TimeSpan.FromMilliseconds(Random.Shared.Next(0, 1000)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        "Kafka publish retry {RetryCount} after {Delay}ms: {Error}",
                        retryCount, timespan.TotalMilliseconds, outcome.Exception?.Message);
                }
            );
    }
    
    public async Task PublishAsync<TEvent>(TEvent @event, CancellationToken cancellationToken = default)
    {
        var message = new Message<string, string>
        {
            Key = @event.EventId.ToString(),
            Value = JsonSerializer.Serialize(@event)
        };
        
        await _policy.ExecuteAsync(async () =>
        {
            return await _producer.ProduceAsync("domain-events", message, cancellationToken);
        });
    }
}
```

**Policy:**
- **Timeout**: 30 seconds per message
- **Retries**: 3 attempts (exponential backoff + jitter)
- **Idempotence**: Enabled (producer deduplication)
- **Acknowledgment**: All in-sync replicas

### 4. HTTP External APIs

```csharp
// Infrastructure/Http/ResilientHttpClientFactory.cs
public static class ResilientHttpClientFactory
{
    public static IHttpClientBuilder AddResilientHttpClient(
        this IServiceCollection services,
        string name,
        TimeoutPolicy timeoutPolicy)
    {
        return services.AddHttpClient(name)
            .ConfigureHttpClient(client =>
            {
                client.Timeout = timeoutPolicy.Total;
            })
            .AddPolicyHandler(GetRetryPolicy())
            .AddPolicyHandler(GetCircuitBreakerPolicy())
            .AddPolicyHandler(GetTimeoutPolicy(timeoutPolicy.PerRequest))
            .AddPolicyHandler(GetBulkheadPolicy());
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy()
    {
        var jitterer = new Random();
        
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
                    + TimeSpan.FromMilliseconds(jitterer.Next(0, 1000)),
                onRetry: (outcome, timespan, retryCount, context) =>
                {
                    Console.WriteLine($"Retry {retryCount} after {timespan.TotalSeconds}s");
                });
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
    {
        return HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<TimeoutRejectedException>()
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30),
                onBreak: (outcome, duration) =>
                {
                    Console.WriteLine($"Circuit breaker opened for {duration.TotalSeconds}s");
                },
                onReset: () =>
                {
                    Console.WriteLine("Circuit breaker reset");
                },
                onHalfOpen: () =>
                {
                    Console.WriteLine("Circuit breaker half-open, testing...");
                });
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetTimeoutPolicy(TimeSpan timeout)
    {
        return Policy.TimeoutAsync<HttpResponseMessage>(timeout, TimeoutStrategy.Pessimistic);
    }
    
    private static IAsyncPolicy<HttpResponseMessage> GetBulkheadPolicy()
    {
        return Policy.BulkheadAsync<HttpResponseMessage>(
            maxParallelization: 10,
            maxQueuingActions: 20);
    }
}

public class TimeoutPolicy
{
    public TimeSpan PerRequest { get; set; } = TimeSpan.FromSeconds(10);
    public TimeSpan Total { get; set; } = TimeSpan.FromSeconds(30);
}

// Usage in Startup.cs
services.AddResilientHttpClient("risk-api", new TimeoutPolicy
{
    PerRequest = TimeSpan.FromSeconds(5),
    Total = TimeSpan.FromSeconds(15)
});
```

**Policy:**
- **Timeout**: 10 seconds per request, 30 seconds total
- **Retries**: 3 attempts (exponential backoff + jitter)
- **Circuit Breaker**: Open after 5 failures, 30s break
- **Bulkhead**: Max 10 concurrent requests, 20 queued

### 5. S3/MinIO (Object Storage)

```csharp
// Infrastructure/Storage/ResilientMinioClient.cs
public class ResilientMinioClient : IObjectStorage
{
    private readonly IMinioClient _minio;
    private readonly ILogger<ResilientMinioClient> _logger;
    private readonly AsyncPolicy _policy;
    
    public ResilientMinioClient(IMinioClient minio, ILogger<ResilientMinioClient> logger)
    {
        _minio = minio;
        _logger = logger;
        
        _policy = Policy
            .Handle<MinioException>(ex => IsTransient(ex))
            .Or<HttpRequestException>()
            .Or<TaskCanceledException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: attempt => 
                    TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                onRetry: (exception, timespan, retryCount, context) =>
                {
                    _logger.LogWarning(
                        exception,
                        "MinIO operation retry {RetryCount} after {Delay}s",
                        retryCount, timespan.TotalSeconds);
                });
    }
    
    public async Task<string> GeneratePresignedUploadUrlAsync(
        string bucketName,
        string objectKey,
        TimeSpan expiry,
        Dictionary<string, string>? metadata = null,
        CancellationToken cancellationToken = default)
    {
        return await _policy.ExecuteAsync(async () =>
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(10));  // 10s timeout
            
            return await _minio.PresignedPutObjectAsync(
                new PresignedPutObjectArgs()
                    .WithBucket(bucketName)
                    .WithObject(objectKey)
                    .WithExpiry((int)expiry.TotalSeconds)
            );
        });
    }
    
    private static bool IsTransient(MinioException ex)
    {
        // Retry on temporary failures
        return ex.ServerResponse?.StatusCode is 429 or 500 or 502 or 503 or 504;
    }
}
```

**Policy:**
- **Timeout**: 10 seconds per operation
- **Retries**: 3 attempts (exponential: 2s, 4s, 8s)
- **Retry on**: 429 (rate limit), 5xx errors

## Summary Matrix

| Dependency | Timeout | Retries | Backoff | Circuit Breaker | Graceful Degradation |
|------------|---------|---------|---------|-----------------|----------------------|
| **PostgreSQL** | 30s | 3 | Exponential | N/A | Fail (data critical) |
| **Redis** | 3s | 3 | Exponential (1s-5s) | 5 failures, 30s break | Continue without cache |
| **Kafka** | 30s | 3 | Exponential + jitter | N/A | Store in outbox |
| **HTTP (External)** | 10s/req, 30s total | 3 | Exponential + jitter | 5 failures, 30s break | Return cached/default |
| **MinIO/S3** | 10s | 3 | Exponential (2s-8s) | N/A | Fail (document critical) |

## Rate Limiting Implementation

```csharp
// Presentation/Middleware/RateLimitingMiddleware.cs
public class RateLimitingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RateLimitingMiddleware> _logger;
    
    public RateLimitingMiddleware(
        RequestDelegate next,
        IConnectionMultiplexer redis,
        ILogger<RateLimitingMiddleware> logger)
    {
        _next = next;
        _redis = redis;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        var rateLimitAttribute = endpoint?.Metadata.GetMetadata<RateLimitAttribute>();
        
        if (rateLimitAttribute == null)
        {
            await _next(context);
            return;
        }
        
        var clientId = GetClientIdentifier(context);
        var key = $"rate_limit:{rateLimitAttribute.Name}:{clientId}";
        
        var db = _redis.GetDatabase();
        var current = await db.StringIncrementAsync(key);
        
        if (current == 1)
        {
            await db.KeyExpireAsync(key, TimeSpan.FromSeconds(rateLimitAttribute.WindowSeconds));
        }
        
        var remaining = Math.Max(0, rateLimitAttribute.Limit - (int)current);
        var resetAt = DateTimeOffset.UtcNow.AddSeconds(rateLimitAttribute.WindowSeconds).ToUnixTimeSeconds();
        
        // Add rate limit headers
        context.Response.Headers["X-RateLimit-Limit"] = rateLimitAttribute.Limit.ToString();
        context.Response.Headers["X-RateLimit-Remaining"] = remaining.ToString();
        context.Response.Headers["X-RateLimit-Reset"] = resetAt.ToString();
        
        if (current > rateLimitAttribute.Limit)
        {
            _logger.LogWarning(
                "Rate limit exceeded for {ClientId} on {Endpoint}",
                clientId, rateLimitAttribute.Name);
            
            context.Response.StatusCode = 429;
            context.Response.Headers["Retry-After"] = rateLimitAttribute.WindowSeconds.ToString();
            
            await context.Response.WriteAsJsonAsync(new
            {
                name = "RateLimitExceeded",
                message = $"Rate limit exceeded. Try again in {rateLimitAttribute.WindowSeconds} seconds.",
                debug_id = context.TraceIdentifier
            });
            
            return;
        }
        
        await _next(context);
    }
    
    private static string GetClientIdentifier(HttpContext context)
    {
        // Prefer authenticated user
        if (context.User.Identity?.IsAuthenticated == true)
        {
            return context.User.FindFirst("sub")?.Value ?? "anonymous";
        }
        
        // Fall back to IP address
        return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}

[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public class RateLimitAttribute : Attribute
{
    public string Name { get; }
    public int Limit { get; }
    public int WindowSeconds { get; }
    
    public RateLimitAttribute(string name, int limit = 100, int windowSeconds = 60)
    {
        Name = name;
        Limit = limit;
        WindowSeconds = windowSeconds;
    }
}

// Usage
[HttpPost]
[RateLimit("create-case", limit: 10, windowSeconds: 60)]  // 10 per minute
public async Task<IActionResult> CreateCase([FromBody] CreateCaseRequest request)
{
    // ...
}
```

## Concurrency Safety

### Optimistic Locking (ETag)

```csharp
// Controllers
[HttpPut("{id}")]
public async Task<IActionResult> UpdateCase(
    Guid id,
    [FromBody] UpdateCaseRequest request,
    [FromHeader(Name = "If-Match")] string? ifMatch)
{
    if (string.IsNullOrEmpty(ifMatch))
    {
        return BadRequest(new { error = "If-Match header required for updates" });
    }
    
    var onboardingCase = await _repository.GetByIdAsync(id);
    if (onboardingCase == null)
    {
        return NotFound();
    }
    
    var currentETag = GenerateETag(onboardingCase);
    if (currentETag != ifMatch.Trim('"'))
    {
        return StatusCode(412, new
        {
            name = "PreconditionFailed",
            message = "Resource was modified by another request",
            current_etag = currentETag,
            debug_id = HttpContext.TraceIdentifier
        });
    }
    
    // Proceed with update
    onboardingCase.UpdateApplicant(request.Applicant, GetUserId());
    await _repository.UnitOfWork.SaveChangesAsync();
    
    var newETag = GenerateETag(onboardingCase);
    Response.Headers["ETag"] = $"\"{newETag}\"";
    
    return Ok(onboardingCase);
}

private string GenerateETag(OnboardingCase entity)
{
    var data = $"{entity.Id}|{entity.UpdatedAt.Ticks}";
    var hash = SHA256.HashData(Encoding.UTF8.GetBytes(data));
    return Convert.ToBase64String(hash)[..16];
}
```

### Distributed Locks (for critical sections)

```csharp
// Infrastructure/Locking/RedisDistributedLock.cs
public class RedisDistributedLock : IDistributedLock
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisDistributedLock> _logger;
    
    public async Task<IDisposable?> AcquireAsync(
        string resource,
        TimeSpan expiry,
        CancellationToken cancellationToken = default)
    {
        var lockKey = $"lock:{resource}";
        var lockValue = Guid.NewGuid().ToString();
        var db = _redis.GetDatabase();
        
        var acquired = await db.StringSetAsync(
            lockKey,
            lockValue,
            expiry,
            When.NotExists);
        
        if (!acquired)
        {
            _logger.LogWarning("Failed to acquire lock for {Resource}", resource);
            return null;
        }
        
        return new RedisLock(db, lockKey, lockValue, _logger);
    }
    
    private class RedisLock : IDisposable
    {
        private readonly IDatabase _db;
        private readonly string _key;
        private readonly string _value;
        private readonly ILogger _logger;
        
        public RedisLock(IDatabase db, string key, string value, ILogger logger)
        {
            _db = db;
            _key = key;
            _value = value;
            _logger = logger;
        }
        
        public void Dispose()
        {
            // Only delete if we still own the lock (value matches)
            var script = @"
                if redis.call('get', KEYS[1]) == ARGV[1] then
                    return redis.call('del', KEYS[1])
                else
                    return 0
                end";
            
            _db.ScriptEvaluate(script, new RedisKey[] { _key }, new RedisValue[] { _value });
            _logger.LogDebug("Released lock {Key}", _key);
        }
    }
}

// Usage
await using var lock = await _distributedLock.AcquireAsync(
    $"onboarding-case:{caseId}",
    TimeSpan.FromSeconds(30));

if (lock == null)
{
    return Conflict(new { error = "Resource is locked by another operation" });
}

// Critical section - only one process can execute this
await ProcessCase(caseId);
```

## Testing Resilience

```csharp
// Tests/Resilience/CircuitBreakerTests.cs
[Fact]
public async Task CircuitBreaker_ShouldOpen_After5Failures()
{
    // Arrange
    var mockHttp = new MockHttpMessageHandler();
    mockHttp.When("*").Respond(HttpStatusCode.InternalServerError);
    
    var client = new HttpClient(mockHttp);
    var policy = ResilientHttpClientFactory.GetCombinedPolicy();
    
    // Act - Trigger 5 failures
    for (int i = 0; i < 5; i++)
    {
        await Assert.ThrowsAsync<HttpRequestException>(async () =>
        {
            await policy.ExecuteAsync(() => client.GetAsync("http://test.com"));
        });
    }
    
    // Assert - 6th attempt should fail immediately (circuit open)
    var sw = Stopwatch.StartNew();
    await Assert.ThrowsAsync<BrokenCircuitException>(async () =>
    {
        await policy.ExecuteAsync(() => client.GetAsync("http://test.com"));
    });
    sw.Stop();
    
    sw.ElapsedMilliseconds.Should().BeLessThan(100);  // Fails fast
}
```

## Monitoring Resilience

```promql
# Circuit breaker state
circuit_breaker_state{service="onboarding-api",dependency="risk-api"}

# Retry attempts
rate(http_client_retry_total{service="onboarding-api"}[5m])

# Timeout rate
rate(http_client_timeout_total{service="onboarding-api"}[5m])

# Rate limit hits
rate(rate_limit_exceeded_total{endpoint="/cases"}[5m])
```

