using MediatR;

namespace OnboardingApi.Application.Risk.Queries;

// DTO for EDD Signatures
public class EddSignatureDto
{
    public Guid Id { get; set; }
    public Guid RiskAssessmentId { get; set; }
    public string SignerRole { get; set; } = string.Empty;
    public string? SignerName { get; set; }
    public string SignerEmail { get; set; } = string.Empty;
    public string? SignnowDocumentId { get; set; }
    public string? SignnowInviteId { get; set; }
    public string Status { get; set; } = "pending";
    public string? Recommendation { get; set; }
    public string? Rationale { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? SignedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

// Query to get all signatures for an assessment
public record GetEddSignaturesQuery(Guid AssessmentId) : IRequest<List<EddSignatureDto>>;

// Command to create or update a signature
public record UpsertEddSignatureCommand(
    Guid AssessmentId,
    string SignerRole,
    string? SignerName,
    string SignerEmail,
    string? SignnowDocumentId,
    string? SignnowInviteId,
    string Status,
    string? Recommendation,
    string? Rationale
) : IRequest<EddSignatureDto>;
