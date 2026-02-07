using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga.Steps;

namespace OnboardingApi.Application.Sagas.OnboardingCaseSubmissionSaga;

/// <summary>
/// Orchestrator for the Onboarding Case Submission Saga
/// Coordinates: Case Creation -> Work Item Creation
/// Implements compensating transactions on failure
/// </summary>
public class OnboardingCaseSubmissionOrchestrator : ISagaOrchestrator<OnboardingCaseSubmissionState>
{
    private readonly CreateCaseStep _createCaseStep;
    private readonly CreateWorkItemStep _createWorkItemStep;
    private readonly ILogger<OnboardingCaseSubmissionOrchestrator> _logger;

    private readonly List<ISagaStep<OnboardingCaseSubmissionState>> _steps;

    public OnboardingCaseSubmissionOrchestrator(
        CreateCaseStep createCaseStep,
        CreateWorkItemStep createWorkItemStep,
        ILogger<OnboardingCaseSubmissionOrchestrator> logger)
    {
        _createCaseStep = createCaseStep;
        _createWorkItemStep = createWorkItemStep;
        _logger = logger;

        // Define step order
        _steps = new List<ISagaStep<OnboardingCaseSubmissionState>>
        {
            _createCaseStep,
            _createWorkItemStep
        };
    }

    public async Task<SagaResult> ExecuteAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[Saga {SagaId}] Starting OnboardingCaseSubmission saga", state.SagaId);
        state.Status = SagaStatus.InProgress;

        var completedSteps = new List<ISagaStep<OnboardingCaseSubmissionState>>();

        try
        {
            foreach (var step in _steps)
            {
                state.CurrentStep = _steps.IndexOf(step);
                _logger.LogInformation("[Saga {SagaId}] Executing step {StepIndex}: {StepName}", 
                    state.SagaId, state.CurrentStep, step.StepName);

                var result = await step.ExecuteAsync(state, cancellationToken);

                if (!result.Success)
                {
                    _logger.LogWarning("[Saga {SagaId}] Step {StepName} failed: {Error}. Starting compensation.", 
                        state.SagaId, step.StepName, result.ErrorMessage);

                    state.Status = SagaStatus.Compensating;
                    state.FailureReason = result.ErrorMessage;

                    // Compensate in reverse order
                    await CompensateStepsAsync(completedSteps, state, cancellationToken);

                    state.Status = SagaStatus.Compensated;
                    state.CompletedAt = DateTime.UtcNow;

                    return SagaResult.Failed(state.SagaId, result.ErrorMessage ?? "Step failed");
                }

                completedSteps.Add(step);
                state.CompletedSteps[step.StepName] = DateTime.UtcNow.ToString("O");

                _logger.LogInformation("[Saga {SagaId}] Step {StepName} completed successfully", 
                    state.SagaId, step.StepName);
            }

            state.Status = SagaStatus.Completed;
            state.CompletedAt = DateTime.UtcNow;

            _logger.LogInformation("[Saga {SagaId}] Saga completed successfully. CaseId: {CaseId}, WorkItemId: {WorkItemId}", 
                state.SagaId, state.CaseId, state.WorkItemId);

            return SagaResult.Succeeded(state.SagaId, new Dictionary<string, object>
            {
                ["CaseId"] = state.CaseId!.Value,
                ["CaseNumber"] = state.CaseNumber ?? "",
                ["WorkItemId"] = state.WorkItemId ?? Guid.Empty,
                ["WorkItemNumber"] = state.WorkItemNumber ?? ""
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[Saga {SagaId}] Unexpected error during saga execution", state.SagaId);

            state.Status = SagaStatus.Compensating;
            state.FailureReason = ex.Message;

            await CompensateStepsAsync(completedSteps, state, cancellationToken);

            state.Status = SagaStatus.Compensated;
            state.CompletedAt = DateTime.UtcNow;

            return SagaResult.Failed(state.SagaId, ex.Message);
        }
    }

    public async Task CompensateAsync(OnboardingCaseSubmissionState state, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("[Saga {SagaId}] Manual compensation requested", state.SagaId);
        await CompensateStepsAsync(_steps, state, cancellationToken);
    }

    private async Task CompensateStepsAsync(
        List<ISagaStep<OnboardingCaseSubmissionState>> stepsToCompensate,
        OnboardingCaseSubmissionState state,
        CancellationToken cancellationToken)
    {
        // Compensate in reverse order
        for (int i = stepsToCompensate.Count - 1; i >= 0; i--)
        {
            var step = stepsToCompensate[i];
            try
            {
                _logger.LogInformation("[Saga {SagaId}] Compensating step: {StepName}", state.SagaId, step.StepName);
                await step.CompensateAsync(state, cancellationToken);
            }
            catch (Exception ex)
            {
                // Log but continue compensating other steps
                _logger.LogError(ex, "[Saga {SagaId}] Compensation failed for step {StepName}: {Error}", 
                    state.SagaId, step.StepName, ex.Message);
            }
        }
    }
}
