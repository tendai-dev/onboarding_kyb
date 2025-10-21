using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using OnboardingApi.Presentation.Models;

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
                errorResponse = ErrorResponse.InternalServerError(requestId);
                statusCode = StatusCodes.Status500InternalServerError;
                break;
        }

        context.Result = new ObjectResult(errorResponse)
        {
            StatusCode = statusCode
        };

        context.ExceptionHandled = true;
    }
}

