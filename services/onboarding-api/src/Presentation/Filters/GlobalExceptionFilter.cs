using FluentValidation;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OnboardingApi.Presentation.Models;
using Sentry;

namespace OnboardingApi.Presentation.Filters;

/// <summary>
/// Global exception filter for consistent error responses
/// </summary>
public class GlobalExceptionFilter : IExceptionFilter
{
    private readonly ILogger<GlobalExceptionFilter> _logger;

    public GlobalExceptionFilter(ILogger<GlobalExceptionFilter> logger)
    {
        _logger = logger;
    }

    public void OnException(ExceptionContext context)
    {
        var requestId = context.HttpContext.Request.Headers["X-Request-Id"].FirstOrDefault()
                        ?? context.HttpContext.TraceIdentifier;

        _logger.LogError(
            context.Exception,
            "Unhandled exception for request {RequestId}: {Message}",
            requestId,
            context.Exception.Message);

        ErrorResponse errorResponse;
        int statusCode;

        switch (context.Exception)
        {
            case ValidationException validationException:
                var validationErrors = validationException.Errors
                    .Select(e => new ErrorDetail
                    {
                        Field = e.PropertyName,
                        Message = e.ErrorMessage,
                        Code = e.ErrorCode
                    })
                    .ToList();

                errorResponse = ErrorResponse.BadRequest(
                    "ValidationError",
                    "Request validation failed",
                    requestId,
                    validationErrors);
                statusCode = StatusCodes.Status422UnprocessableEntity;
                break;

            case InvalidOperationException:
                errorResponse = ErrorResponse.BadRequest(
                    "InvalidOperation",
                    context.Exception.Message,
                    requestId);
                statusCode = StatusCodes.Status400BadRequest;
                break;

            case DbUpdateException dbEx:
                _logger.LogError(dbEx, "Database update exception: {Message}", dbEx.Message);
                
                // Extract the actual error message from nested inner exceptions
                // PostgreSQL errors are typically in InnerException.InnerException
                var actualMessage = dbEx.Message;
                Exception? currentException = dbEx.InnerException;
                
                // Traverse the inner exception chain to find the actual database error
                while (currentException != null)
                {
                    actualMessage = currentException.Message;
                    currentException = currentException.InnerException;
                }
                
                // Check for PostgreSQL error codes and unique constraint violations
                bool isDuplicateKey = actualMessage.Contains("23505", StringComparison.OrdinalIgnoreCase) ||
                                     actualMessage.Contains("duplicate", StringComparison.OrdinalIgnoreCase) || 
                                     actualMessage.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase) ||
                                     actualMessage.Contains("unique constraint", StringComparison.OrdinalIgnoreCase) ||
                                     actualMessage.Contains("IX_entity_types_code", StringComparison.OrdinalIgnoreCase);
                
                if (isDuplicateKey)
                {
                    // Extract the field name from the constraint name if possible
                    string userMessage = "A record with this value already exists. Please use a different value.";
                    if (actualMessage.Contains("IX_entity_types_code"))
                    {
                        userMessage = "An entity type with this code already exists. Please use a different code.";
                    }
                    
                    errorResponse = ErrorResponse.BadRequest(
                        "DuplicateKey",
                        userMessage,
                        requestId);
                }
                else
                {
                    // For other database errors, provide a user-friendly message
                    errorResponse = ErrorResponse.BadRequest(
                        "DatabaseError",
                        "A database error occurred. Please check your input and try again.",
                        requestId);
                }
                statusCode = StatusCodes.Status400BadRequest;
                break;

            case UnauthorizedAccessException:
                errorResponse = new ErrorResponse
                {
                    Name = "Unauthorized",
                    Message = "Access denied",
                    DebugId = requestId
                };
                statusCode = StatusCodes.Status403Forbidden;
                break;

            case KeyNotFoundException:
                errorResponse = ErrorResponse.NotFound(
                    "ResourceNotFound",
                    context.Exception.Message,
                    requestId);
                statusCode = StatusCodes.Status404NotFound;
                break;

            default:
                // In development, include exception details for debugging
                if (context.HttpContext.RequestServices.GetService<IHostEnvironment>()?.IsDevelopment() == true)
                {
                    var details = new List<ErrorDetail>
                    {
                        new ErrorDetail { Field = "exceptionType", Message = context.Exception.GetType().Name },
                        new ErrorDetail { Field = "innerException", Message = context.Exception.InnerException?.Message ?? "None" }
                    };
                    if (!string.IsNullOrEmpty(context.Exception.StackTrace))
                    {
                        details.Add(new ErrorDetail { Field = "stackTrace", Message = context.Exception.StackTrace });
                    }
                    
                    // Return error in format expected by frontend (simple JSON with "error" field)
                    // The frontend expects: {"error": "...", "message": "...", "details": {...}}
                    errorResponse = new ErrorResponse
                    {
                        Name = "InternalServerError",
                        Message = context.Exception.Message,
                        DebugId = requestId,
                        Details = details
                    };
                    
                    // Also log the full exception for debugging
                    _logger.LogError(context.Exception, 
                        "Unhandled exception in {Path} {Method}: {Message}", 
                        context.HttpContext.Request.Path,
                        context.HttpContext.Request.Method,
                        context.Exception.Message);
                }
                else
                {
                    errorResponse = ErrorResponse.InternalServerError(requestId);
                }
                statusCode = StatusCodes.Status500InternalServerError;
                break;
        }

        // Report to Sentry with context
        if (SentrySdk.IsEnabled)
        {
            SentrySdk.ConfigureScope(scope =>
            {
                scope.SetTag("request_id", requestId);
                scope.SetTag("endpoint", context.HttpContext.Request.Path);
                scope.SetTag("method", context.HttpContext.Request.Method);
                scope.SetTag("exception_type", context.Exception.GetType().Name);
                scope.SetExtra("status_code", statusCode);
                scope.SetExtra("user", context.HttpContext.User?.Identity?.Name ?? "anonymous");
                SentrySdk.CaptureException(context.Exception);
            });
        }

        // For document upload endpoints, return error in format expected by frontend
        if (context.HttpContext.Request.Path.Value?.Contains("/documents/upload") == true)
        {
            var isDevelopment = context.HttpContext.RequestServices.GetService<IHostEnvironment>()?.IsDevelopment() == true;
            
            // Return simple JSON format that frontend expects
            var simpleErrorResponse = new
            {
                error = isDevelopment ? context.Exception.Message : "Internal server error",
                message = isDevelopment ? context.Exception.Message : "An error occurred while processing the document upload.",
                details = isDevelopment ? new
                {
                    exceptionType = context.Exception.GetType().Name,
                    message = context.Exception.Message,
                    innerException = context.Exception.InnerException?.Message,
                    stackTrace = context.Exception.StackTrace
                } : null
            };
            
            context.Result = new ObjectResult(simpleErrorResponse)
            {
                StatusCode = statusCode
            };
        }
        else
        {
            context.Result = new ObjectResult(errorResponse)
            {
                StatusCode = statusCode
            };
        }

        context.ExceptionHandled = true;
    }
}

