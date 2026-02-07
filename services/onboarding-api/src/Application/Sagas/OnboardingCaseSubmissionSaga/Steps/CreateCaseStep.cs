using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;

namespace OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.Steps;

/// <summary>
/// Step 1: Create the onboarding case
/// Compensation: Delete the case if subsequent steps fail
/// </summary>
public class CreateCaseStep : ISagaStep<OnboardingCaseSubmissionState>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly ILogger<CreateCaseStep> _logger;

    public string StepName => "CreateCase";

    public CreateCaseStep(
        IOnboardingCaseRepository repository,
        ILogger<CreateCaseStep> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<StepResult> ExecuteAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("[Saga {SagaId}] Creating onboarding case for partner {PartnerId}", 
                state.SagaId, state.PartnerId);

            var entity = OnboardingCase.Create(
                state.Type,
                state.PartnerId,
                state.PartnerReferenceId,
                state.Applicant,
                state.Business,
                state.CreatedBy);

            // Add metadata
            foreach (var kvp in state.Metadata)
            {
                entity.Metadata[kvp.Key] = kvp.Value;
            }

            // Submit based on schema-driven or legacy mode
            if (state.IsSchemaDriven)
            {
                entity.SubmitSchemaDriven(state.CreatedBy, 
                    $"FormConfigId: {state.FormConfigId ?? "none"}, EntityType: {state.EntityTypeCode ?? "none"}");
            }
            else
            {
                entity.Submit(state.CreatedBy);
            }

            await _repository.AddAsync(entity, cancellationToken);
            await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

            // Store results in state
            state.CaseId = entity.Id;
            state.CaseNumber = entity.CaseNumber;

            _logger.LogInformation("[Saga {SagaId}] Created case {CaseId} ({CaseNumber})", 
                state.SagaId, entity.Id, entity.CaseNumber);

            return StepResult.Succeeded(new Dictionary<string, object>
            {
                ["CaseId"] = entity.Id,
                ["CaseNumber"] = entity.CaseNumber
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Saga {SagaId}] Failed to create case: {Error}", state.SagaId, ex.Message);
            return StepResult.Failed($"Failed to create case: {ex.Message}");
        }
    }

    public async Task CompensateAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken)
    {
        if (state.CaseId == null)
        {
            _logger.LogInformation("[Saga {SagaId}] No case to compensate - case was not created", state.SagaId);
            return;
        }

        try
        {
            _logger.LogWarning("[Saga {SagaId}] Compensating: Deleting case {CaseId}", state.SagaId, state.CaseId);
            
            var entity = await _repository.GetByIdAsync(state.CaseId.Value, cancellationToken);
            if (entity != null)
            {
                _repository.Delete(entity);
                await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("[Saga {SagaId}] Compensation complete: Deleted case {CaseId}", 
                    state.SagaId, state.CaseId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Saga {SagaId}] Compensation failed for case {CaseId}: {Error}", 
                state.SagaId, state.CaseId, ex.Message);
            // Compensation failures are logged but don't throw - manual intervention may be needed
        }
    }
}
