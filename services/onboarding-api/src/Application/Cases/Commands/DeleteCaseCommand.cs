using MediatR;

namespace OnboardingApi.Application.Cases.Commands;

/// <summary>
/// Command to delete an onboarding case and all related entities across schemas.
/// Uses cross-schema transaction to ensure atomicity.
/// </summary>
public record DeleteCaseCommand(
    Guid CaseId,
    string DeletedBy,
    bool HardDelete = false
) : IRequest<DeleteCaseResult>;

public record DeleteCaseResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public DeletedEntities? DeletedEntities { get; init; }
    
    public static DeleteCaseResult Succeeded(DeletedEntities entities) => new() 
    { 
        Success = true, 
        DeletedEntities = entities 
    };
    
    public static DeleteCaseResult Failed(string error) => new() 
    { 
        Success = false, 
        ErrorMessage = error 
    };
}

public record DeletedEntities
{
    public Guid CaseId { get; init; }
    public string CaseNumber { get; init; } = string.Empty;
    public int WorkItemsDeleted { get; init; }
    public int DocumentsDeleted { get; init; }
    public int ChecklistsDeleted { get; init; }
    public int NotificationsDeleted { get; init; }
    public int AuditLogsCreated { get; init; }
}
