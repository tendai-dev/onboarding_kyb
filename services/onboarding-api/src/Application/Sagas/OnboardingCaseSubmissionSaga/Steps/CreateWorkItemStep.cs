using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.WorkQueue.Commands;

namespace OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.Steps;

/// <summary>
/// Step 2: Create work item for the case
/// Compensation: Delete the work item if subsequent steps fail
/// </summary>
public class CreateWorkItemStep : ISagaStep<OnboardingCaseSubmissionState>
{
    private readonly IMediator _mediator;
    private readonly ILogger<CreateWorkItemStep> _logger;

    public string StepName => "CreateWorkItem";

    public CreateWorkItemStep(
        IMediator mediator,
        ILogger<CreateWorkItemStep> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    public async Task<StepResult> ExecuteAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken)
    {
        if (state.CaseId == null)
        {
            return StepResult.Failed("Cannot create work item: CaseId is null");
        }

        try
        {
            _logger.LogInformation("[Saga {SagaId}] Creating work item for case {CaseId}", 
                state.SagaId, state.CaseId);

            // Build applicant name
            var applicantName = $"{state.Applicant.FirstName} {state.Applicant.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(applicantName) && state.Business != null)
            {
                applicantName = state.Business.LegalName ?? "Unknown";
            }
            if (string.IsNullOrWhiteSpace(applicantName))
            {
                applicantName = "Unknown Applicant";
            }

            // Determine entity type
            var entityType = state.Type == Domain.Aggregates.OnboardingType.Business ? "Business" : "Individual";
            if (!string.IsNullOrWhiteSpace(state.EntityTypeCode))
            {
                entityType = state.EntityTypeCode;
            }

            // Extract country
            var country = state.Applicant?.ResidentialAddress?.Country ?? 
                         state.Business?.RegisteredAddress?.Country ?? 
                         "Unknown";

            var command = new CreateWorkItemCommand(
                ApplicationId: state.CaseId.Value,
                ApplicantName: applicantName,
                BusinessName: state.Business?.LegalName,
                EntityType: entityType,
                Country: country,
                RiskLevel: "Unknown",
                CreatedBy: state.CreatedBy,
                SlaDays: 5
            );

            var result = await _mediator.Send(command, cancellationToken);

            if (result.Success)
            {
                state.WorkItemId = result.WorkItemId;
                state.WorkItemNumber = result.WorkItemNumber;

                _logger.LogInformation("[Saga {SagaId}] Created work item {WorkItemId} ({WorkItemNumber}) for case {CaseId}", 
                    state.SagaId, result.WorkItemId, result.WorkItemNumber, state.CaseId);

                return StepResult.Succeeded(new Dictionary<string, object>
                {
                    ["WorkItemId"] = result.WorkItemId!.Value,
                    ["WorkItemNumber"] = result.WorkItemNumber ?? ""
                });
            }

            // Work item already exists is acceptable
            if (result.ErrorMessage?.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true)
            {
                _logger.LogInformation("[Saga {SagaId}] Work item already exists for case {CaseId}", 
                    state.SagaId, state.CaseId);
                return StepResult.Succeeded();
            }

            return StepResult.Failed($"Failed to create work item: {result.ErrorMessage}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Saga {SagaId}] Failed to create work item for case {CaseId}: {Error}", 
                state.SagaId, state.CaseId, ex.Message);
            return StepResult.Failed($"Failed to create work item: {ex.Message}");
        }
    }

    public async Task CompensateAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken)
    {
        if (state.WorkItemId == null)
        {
            _logger.LogInformation("[Saga {SagaId}] No work item to compensate - work item was not created", state.SagaId);
            return;
        }

        try
        {
            _logger.LogWarning("[Saga {SagaId}] Compensating: Deleting work item {WorkItemId}", 
                state.SagaId, state.WorkItemId);

            var command = new DeleteWorkItemCommand(state.WorkItemId.Value);
            await _mediator.Send(command, cancellationToken);

            _logger.LogInformation("[Saga {SagaId}] Compensation complete: Deleted work item {WorkItemId}", 
                state.SagaId, state.WorkItemId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Saga {SagaId}] Compensation failed for work item {WorkItemId}: {Error}", 
                state.SagaId, state.WorkItemId, ex.Message);
        }
    }
}
