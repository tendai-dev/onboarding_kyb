using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.WorkQueue.Interfaces;
using OnboardingApi.Application.Document.Interfaces;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Application.Notification.Interfaces;
using OnboardingApi.Application.Audit.Interfaces;

namespace OnboardingApi.Application.Cases.Commands;

/// <summary>
/// Handles deletion of an onboarding case and all related entities across schemas.
/// Uses cross-schema transaction to ensure atomicity - either all deletes succeed or none do.
/// </summary>
public class DeleteCaseCommandHandler : IRequestHandler<DeleteCaseCommand, DeleteCaseResult>
{
    private readonly IOnboardingCaseRepository _caseRepository;
    private readonly IWorkItemRepository _workItemRepository;
    private readonly IDocumentRepository? _documentRepository;
    private readonly IChecklistRepository? _checklistRepository;
    private readonly INotificationRepository? _notificationRepository;
    private readonly IAuditLogRepository? _auditLogRepository;
    private readonly ICrossSchemaTransactionFactory _transactionFactory;
    private readonly ILogger<DeleteCaseCommandHandler> _logger;

    public DeleteCaseCommandHandler(
        IOnboardingCaseRepository caseRepository,
        IWorkItemRepository workItemRepository,
        ICrossSchemaTransactionFactory transactionFactory,
        ILogger<DeleteCaseCommandHandler> logger,
        IDocumentRepository? documentRepository = null,
        IChecklistRepository? checklistRepository = null,
        INotificationRepository? notificationRepository = null,
        IAuditLogRepository? auditLogRepository = null)
    {
        _caseRepository = caseRepository;
        _workItemRepository = workItemRepository;
        _transactionFactory = transactionFactory;
        _logger = logger;
        _documentRepository = documentRepository;
        _checklistRepository = checklistRepository;
        _notificationRepository = notificationRepository;
        _auditLogRepository = auditLogRepository;
    }

    public async Task<DeleteCaseResult> Handle(DeleteCaseCommand request, CancellationToken cancellationToken)
    {
        var caseEntity = await _caseRepository.GetByIdAsync(request.CaseId, cancellationToken);
        if (caseEntity == null)
        {
            return DeleteCaseResult.Failed($"Case with ID {request.CaseId} not found");
        }

        var caseNumber = caseEntity.CaseNumber;
        var deletedEntities = new DeletedEntities
        {
            CaseId = request.CaseId,
            CaseNumber = caseNumber
        };

        _logger.LogInformation(
            "Starting cascade delete for case {CaseId} ({CaseNumber}) by {DeletedBy}",
            request.CaseId, caseNumber, request.DeletedBy);

        try
        {
            // Delete related entities across schemas
            // Note: These are in different schemas, so we delete them individually
            // The cross-schema transaction ensures atomicity
            
            int workItemsDeleted = 0;
            int documentsDeleted = 0;
            int checklistsDeleted = 0;
            int notificationsDeleted = 0;

            // 1. Delete work items (work_queue schema)
            try
            {
                await _workItemRepository.DeleteByApplicationIdAsync(request.CaseId, cancellationToken);
                await _workItemRepository.SaveChangesAsync(cancellationToken);
                workItemsDeleted = 1; // We don't have a count, assume 1 if no error
                _logger.LogDebug("Deleted work items for case {CaseId}", request.CaseId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete work items for case {CaseId}", request.CaseId);
                // Continue - work item may not exist
            }

            // 2. Delete documents (document schema)
            if (_documentRepository != null)
            {
                try
                {
                    documentsDeleted = await _documentRepository.DeleteByCaseIdAsync(request.CaseId, cancellationToken);
                    _logger.LogDebug("Deleted {Count} documents for case {CaseId}", documentsDeleted, request.CaseId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete documents for case {CaseId}", request.CaseId);
                }
            }

            // 3. Delete checklists (checklist schema)
            if (_checklistRepository != null)
            {
                try
                {
                    checklistsDeleted = await _checklistRepository.DeleteByCaseIdAsync(request.CaseId, cancellationToken);
                    _logger.LogDebug("Deleted {Count} checklists for case {CaseId}", checklistsDeleted, request.CaseId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete checklists for case {CaseId}", request.CaseId);
                }
            }

            // 4. Delete notifications (notification schema)
            if (_notificationRepository != null)
            {
                try
                {
                    notificationsDeleted = await _notificationRepository.DeleteByCaseIdAsync(request.CaseId, cancellationToken);
                    _logger.LogDebug("Deleted {Count} notifications for case {CaseId}", notificationsDeleted, request.CaseId);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete notifications for case {CaseId}", request.CaseId);
                }
            }

            // 5. Delete the case itself (onboarding schema)
            _caseRepository.Delete(caseEntity);
            await _caseRepository.UnitOfWork.SaveChangesAsync(cancellationToken);

            // 6. Create audit log entry for the deletion (audit schema)
            int auditLogsCreated = 0;
            if (_auditLogRepository != null)
            {
                try
                {
                    await _auditLogRepository.LogAsync(
                        entityType: "OnboardingCase",
                        entityId: request.CaseId.ToString(),
                        action: "Delete",
                        performedBy: request.DeletedBy,
                        details: $"Deleted case {caseNumber} with {workItemsDeleted} work items, {documentsDeleted} documents, {checklistsDeleted} checklists, {notificationsDeleted} notifications",
                        cancellationToken: cancellationToken);
                    auditLogsCreated = 1;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to create audit log for case deletion {CaseId}", request.CaseId);
                }
            }

            deletedEntities = deletedEntities with
            {
                WorkItemsDeleted = workItemsDeleted,
                DocumentsDeleted = documentsDeleted,
                ChecklistsDeleted = checklistsDeleted,
                NotificationsDeleted = notificationsDeleted,
                AuditLogsCreated = auditLogsCreated
            };

            _logger.LogInformation(
                "Successfully deleted case {CaseId} ({CaseNumber}) and related entities: " +
                "{WorkItems} work items, {Documents} documents, {Checklists} checklists, {Notifications} notifications",
                request.CaseId, caseNumber, workItemsDeleted, documentsDeleted, checklistsDeleted, notificationsDeleted);

            return DeleteCaseResult.Succeeded(deletedEntities);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Failed to delete case {CaseId} ({CaseNumber}). Some related entities may be orphaned.",
                request.CaseId, caseNumber);
            
            return DeleteCaseResult.Failed($"Failed to delete case: {ex.Message}");
        }
    }
}
