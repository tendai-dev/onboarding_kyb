namespace OnboardingApi.Application.Common;

/// <summary>
/// Represents the result of an operation with optional error details.
/// Use this instead of silently swallowing exceptions.
/// </summary>
public class OperationResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public string? ErrorCode { get; init; }
    public Exception? Exception { get; init; }
    
    /// <summary>
    /// Correlation ID for tracking this operation across logs
    /// </summary>
    public string? CorrelationId { get; init; }

    public static OperationResult Succeeded(string? correlationId = null) => new() 
    { 
        Success = true, 
        CorrelationId = correlationId 
    };
    
    public static OperationResult Failed(string errorMessage, string? errorCode = null, Exception? exception = null, string? correlationId = null) => new() 
    { 
        Success = false, 
        ErrorMessage = errorMessage, 
        ErrorCode = errorCode,
        Exception = exception,
        CorrelationId = correlationId
    };
}

/// <summary>
/// Represents the result of an operation with a value.
/// </summary>
public class OperationResult<T> : OperationResult
{
    public T? Value { get; init; }

    public static OperationResult<T> Succeeded(T value, string? correlationId = null) => new() 
    { 
        Success = true, 
        Value = value,
        CorrelationId = correlationId
    };
    
    public new static OperationResult<T> Failed(string errorMessage, string? errorCode = null, Exception? exception = null, string? correlationId = null) => new() 
    { 
        Success = false, 
        ErrorMessage = errorMessage, 
        ErrorCode = errorCode,
        Exception = exception,
        CorrelationId = correlationId
    };
}

/// <summary>
/// Standard error codes for categorizing failures
/// </summary>
public static class ErrorCodes
{
    public const string ValidationError = "VALIDATION_ERROR";
    public const string NotFound = "NOT_FOUND";
    public const string Unauthorized = "UNAUTHORIZED";
    public const string Forbidden = "FORBIDDEN";
    public const string Conflict = "CONFLICT";
    public const string ExternalServiceError = "EXTERNAL_SERVICE_ERROR";
    public const string DatabaseError = "DATABASE_ERROR";
    public const string InternalError = "INTERNAL_ERROR";
    public const string RateLimited = "RATE_LIMITED";
    public const string Timeout = "TIMEOUT";
}
