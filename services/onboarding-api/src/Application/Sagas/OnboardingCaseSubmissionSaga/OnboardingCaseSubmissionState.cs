using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga;

/// <summary>
/// State for the Onboarding Case Submission Saga
/// Coordinates: Case Creation -> Work Item Creation -> Projection Sync
/// </summary>
public class OnboardingCaseSubmissionState : ISagaState
{
    public Guid SagaId { get; init; } = Guid.NewGuid();
    public string SagaType => "OnboardingCaseSubmission";
    public SagaStatus Status { get; set; } = SagaStatus.Started;
    public DateTime StartedAt { get; init; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
    public string? FailureReason { get; set; }
    public int CurrentStep { get; set; }
    public Dictionary<string, string> CompletedSteps { get; init; } = new();

    // Input data
    public OnboardingType Type { get; init; }
    public Guid PartnerId { get; init; }
    public string PartnerReferenceId { get; init; } = string.Empty;
    public ApplicantDetails Applicant { get; init; } = null!;
    public BusinessDetails? Business { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public Dictionary<string, string> Metadata { get; init; } = new();
    public bool IsSchemaDriven { get; init; }
    public string? FormConfigId { get; init; }
    public string? EntityTypeCode { get; init; }

    // Step results (populated during execution)
    public Guid? CaseId { get; set; }
    public string? CaseNumber { get; set; }
    public Guid? WorkItemId { get; set; }
    public string? WorkItemNumber { get; set; }
    public bool ProjectionSynced { get; set; }
}
