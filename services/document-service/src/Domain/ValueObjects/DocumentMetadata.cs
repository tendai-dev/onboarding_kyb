namespace DocumentService.Domain.ValueObjects;

public record DocumentMetadata
{
    public string? Description { get; init; }
    public Dictionary<string, string> Tags { get; init; } = new();
    public string? IssueDate { get; init; }
    public string? ExpiryDate { get; init; }
    public string? IssuingAuthority { get; init; }
    public string? DocumentNumber { get; init; }
    public string? Country { get; init; }
}

