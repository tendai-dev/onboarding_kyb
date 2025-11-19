using MediatR;
using Microsoft.Extensions.Logging;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.Aggregates;
using WorkQueueService.Domain.ValueObjects;

namespace WorkQueueService.Application.Commands;

/// <summary>
/// Command to create a new work item from an onboarding case
/// </summary>
public record CreateWorkItemCommand(
    Guid ApplicationId,
    string ApplicantName,
    string EntityType,
    string Country,
    string RiskLevel, // "Low", "Medium", "High", "Critical"
    string CreatedBy,
    int? SlaDays = null
) : IRequest<CreateWorkItemResult>;

public record CreateWorkItemResult
{
    public bool Success { get; init; }
    public Guid? WorkItemId { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static CreateWorkItemResult Successful(Guid workItemId) => new() 
    { 
        Success = true, 
        WorkItemId = workItemId 
    };
    
    public static CreateWorkItemResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

public class CreateWorkItemCommandHandler : IRequestHandler<CreateWorkItemCommand, CreateWorkItemResult>
{
    private readonly IWorkItemRepository _repository;
    private readonly ILogger<CreateWorkItemCommandHandler> _logger;

    public CreateWorkItemCommandHandler(
        IWorkItemRepository repository,
        ILogger<CreateWorkItemCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<CreateWorkItemResult> Handle(CreateWorkItemCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Parse risk level string to enum
            // Default to Unknown since risk is now set manually by reviewers
            if (!Enum.TryParse<Domain.ValueObjects.RiskLevel>(request.RiskLevel, ignoreCase: true, out var riskLevel))
            {
                riskLevel = Domain.ValueObjects.RiskLevel.Unknown; // Default to Unknown for manual review
            }

            // Use default SLA days since risk level is not yet determined
            // SLA will be updated when risk is manually assessed
            var slaDays = request.SlaDays ?? 7; // Default SLA

            var workItem = WorkItem.Create(
                request.ApplicationId,
                request.ApplicantName,
                request.EntityType,
                request.Country,
                riskLevel,
                request.CreatedBy,
                slaDays
            );

            // All work items require manual assignment and risk assessment
            // No automatic assignment - reviewers must manually assign and assess risk
            _logger.LogInformation(
                "Work item {WorkItemId} created - requires manual assignment and risk assessment",
                workItem.Id);

            await _repository.AddAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            return CreateWorkItemResult.Successful(workItem.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create work item for application {ApplicationId}", request.ApplicationId);
            return CreateWorkItemResult.Failed($"Failed to create work item: {ex.Message}");
        }
    }
}

