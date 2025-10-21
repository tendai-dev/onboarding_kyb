using OnboardingApi.Application.Commands;
using OnboardingApi.Domain.Aggregates;
using System.Text.Json.Serialization;

namespace OnboardingApi.Presentation.Models;

/// <summary>
/// Standard API response wrapper
/// </summary>
public class ApiResponse<T>
{
    [JsonPropertyName("data")]
    public T Data { get; set; } = default!;

    [JsonPropertyName("links")]
    public Dictionary<string, string>? Links { get; set; }

    [JsonPropertyName("meta")]
    public ResponseMeta? Meta { get; set; }

    public static ApiResponse<T> Success(T data, string requestId, Dictionary<string, string>? links = null)
    {
        return new ApiResponse<T>
        {
            Data = data,
            Links = links,
            Meta = new ResponseMeta
            {
                RequestId = requestId,
                Timestamp = DateTime.UtcNow
            }
        };
    }
}

public class ResponseMeta
{
    [JsonPropertyName("request_id")]
    public string RequestId { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public DateTime Timestamp { get; set; }
}

/// <summary>
/// Standard error response
/// </summary>
public class ErrorResponse
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("details")]
    public List<ErrorDetail>? Details { get; set; }

    [JsonPropertyName("debug_id")]
    public string DebugId { get; set; } = string.Empty;

    public static ErrorResponse BadRequest(string name, string message, string debugId, List<ErrorDetail>? details = null)
    {
        return new ErrorResponse
        {
            Name = name,
            Message = message,
            DebugId = debugId,
            Details = details
        };
    }

    public static ErrorResponse NotFound(string name, string message, string debugId)
    {
        return new ErrorResponse
        {
            Name = name,
            Message = message,
            DebugId = debugId
        };
    }

    public static ErrorResponse Conflict(string name, string message, string debugId)
    {
        return new ErrorResponse
        {
            Name = name,
            Message = message,
            DebugId = debugId
        };
    }

    public static ErrorResponse InternalServerError(string debugId)
    {
        return new ErrorResponse
        {
            Name = "InternalServerError",
            Message = "An unexpected error occurred. Please try again later.",
            DebugId = debugId
        };
    }
}

public class ErrorDetail
{
    [JsonPropertyName("field")]
    public string? Field { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("code")]
    public string? Code { get; set; }
}

/// <summary>
/// Create onboarding case request
/// </summary>
public class CreateOnboardingCaseRequest
{
    [JsonPropertyName("type")]
    public OnboardingType Type { get; set; }

    [JsonPropertyName("partner_id")]
    public Guid PartnerId { get; set; }

    [JsonPropertyName("partner_reference_id")]
    public string PartnerReferenceId { get; set; } = string.Empty;

    [JsonPropertyName("applicant")]
    public ApplicantDetailsDto Applicant { get; set; } = null!;

    [JsonPropertyName("business")]
    public BusinessDetailsDto? Business { get; set; }
}

/// <summary>
/// Onboarding case response
/// </summary>
public class OnboardingCaseResponse
{
    [JsonPropertyName("id")]
    public Guid Id { get; set; }

    [JsonPropertyName("case_number")]
    public string CaseNumber { get; set; } = string.Empty;
}

/// <summary>
/// Paginated list response
/// </summary>
public class PagedResponse<T>
{
    [JsonPropertyName("items")]
    public List<T> Items { get; set; } = new();

    [JsonPropertyName("total")]
    public int Total { get; set; }

    [JsonPropertyName("page")]
    public int Page { get; set; }

    [JsonPropertyName("page_size")]
    public int PageSize { get; set; }

    [JsonPropertyName("links")]
    public PaginationLinks? Links { get; set; }
}

public class PaginationLinks
{
    [JsonPropertyName("self")]
    public string Self { get; set; } = string.Empty;

    [JsonPropertyName("next")]
    public string? Next { get; set; }

    [JsonPropertyName("prev")]
    public string? Prev { get; set; }
}

