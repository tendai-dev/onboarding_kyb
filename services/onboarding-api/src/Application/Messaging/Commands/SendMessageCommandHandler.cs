using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Application.Projections.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;

namespace OnboardingApi.Application.Messaging.Commands;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, SendMessageResult>
{
    private readonly IMessageRepository _messageRepository;
    private readonly IMessageBroadcaster _messageBroadcaster;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<SendMessageCommandHandler> _logger;

    public SendMessageCommandHandler(
        IMessageRepository messageRepository,
        IMessageBroadcaster messageBroadcaster,
        IProjectionRepository projectionRepository,
        ILogger<SendMessageCommandHandler> logger)
    {
        _messageRepository = messageRepository;
        _messageBroadcaster = messageBroadcaster;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<SendMessageResult> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get or create thread for this application
            var thread = await _messageRepository.GetThreadByApplicationIdAsync(request.ApplicationId, cancellationToken);
            var isNewThread = thread == null;
            
            if (thread == null)
            {
                // Fetch actual application details from projections
                var applicationDetails = await _projectionRepository.GetOnboardingCaseAsync(
                    request.ApplicationId.ToString(), cancellationToken);
                
                var applicationReference = applicationDetails?.CaseId 
                    ?? $"APP-{request.ApplicationId.ToString().Substring(0, 8)}";
                
                // Build applicant name from projection data (first + last name, or business name)
                // Only use sender name as fallback if sender is an applicant (not admin)
                string applicantName;
                if (!string.IsNullOrWhiteSpace(applicationDetails?.ApplicantFirstName))
                {
                    applicantName = $"{applicationDetails.ApplicantFirstName} {applicationDetails.ApplicantLastName}".Trim();
                }
                else if (!string.IsNullOrWhiteSpace(applicationDetails?.BusinessLegalName))
                {
                    applicantName = applicationDetails.BusinessLegalName;
                }
                else if (request.SenderRole == UserRole.Applicant && !string.IsNullOrWhiteSpace(request.SenderName))
                {
                    // Only use sender name if sender is the applicant
                    applicantName = request.SenderName;
                }
                else
                {
                    // Use partner name from projection if available, otherwise use case reference
                    applicantName = !string.IsNullOrWhiteSpace(applicationDetails?.PartnerName)
                        ? applicationDetails.PartnerName
                        : applicationReference;
                }
                
                _logger.LogInformation(
                    "Creating new message thread for application {ApplicationId} with reference {Reference} and applicant {ApplicantName}",
                    request.ApplicationId, applicationReference, applicantName);
                
                thread = MessageThread.Create(
                    request.ApplicationId,
                    applicationReference,
                    request.SenderId,
                    applicantName);
                await _messageRepository.AddThreadAsync(thread, cancellationToken);
            }

            // Convert attachment info to domain entities
            var attachments = request.Attachments?.Select(a => 
                MessageAttachment.Create(
                    Guid.Empty, // Will be set after message is created
                    a.FileName,
                    a.ContentType,
                    a.FileSizeBytes,
                    a.StorageKey,
                    a.StorageUrl,
                    a.DocumentId,
                    a.Description
                )
            ).ToList();

            var message = Message.Create(
                thread.Id,
                request.ApplicationId,
                request.SenderId,
                request.SenderName ?? "Unknown",
                request.SenderRole,
                request.Content,
                request.ReceiverId,
                null, // receiverName - can be populated if needed
                request.ReplyToMessageId,
                attachments
            );
            
            // Update thread message count
            thread.IncrementMessageCount();
            
            // Only call UpdateThreadAsync if thread already exists in database
            // For new threads, EF Core will track changes automatically since it's already in "Added" state
            if (!isNewThread)
            {
                await _messageRepository.UpdateThreadAsync(thread, cancellationToken);
            }

            await _messageRepository.AddAsync(message, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            // Broadcast message via SignalR to thread group
            try
            {
                // Build message DTO for SignalR broadcast
                var messageDto = new
                {
                    id = message.Id.ToString(),
                    threadId = message.ThreadId.ToString(),
                    applicationId = message.ApplicationId.ToString(),
                    senderId = message.SenderId.ToString(),
                    senderName = message.SenderName ?? "User",
                    senderEmail = request.SenderEmail, // Email from request context
                    senderRole = message.SenderRole.ToString(),
                    content = message.Content,
                    sentAt = message.SentAt.ToString("O"),
                    attachments = message.Attachments.Select(a => new
                    {
                        id = a.Id.ToString(),
                        fileName = a.FileName,
                        contentType = a.ContentType,
                        fileSizeBytes = a.FileSizeBytes,
                        storageKey = a.StorageKey,
                        storageUrl = a.StorageUrl,
                        documentId = a.DocumentId?.ToString(),
                        description = a.Description
                    }).ToList()
                };

                // Send to thread group
                await _messageBroadcaster.BroadcastMessageAsync(
                    message.ThreadId.ToString(),
                    messageDto,
                    cancellationToken);

                // Also send to user groups for notification
                await _messageBroadcaster.NotifyUserAsync(
                    message.SenderId.ToString(),
                    new { threadId = message.ThreadId.ToString() },
                    cancellationToken);

                if (message.ReceiverId.HasValue)
                {
                    await _messageBroadcaster.NotifyUserAsync(
                        message.ReceiverId.Value.ToString(),
                        new { threadId = message.ThreadId.ToString() },
                        cancellationToken);
                }

                _logger.LogInformation(
                    "Broadcasted message {MessageId} to thread {ThreadId} via SignalR",
                    message.Id, message.ThreadId);
            }
            catch (Exception ex)
            {
                // Log but don't fail the message send if SignalR fails
                _logger.LogWarning(ex, 
                    "Failed to broadcast message {MessageId} via SignalR (non-critical)",
                    message.Id);
            }

            return SendMessageResult.Successful(message.Id, message.ThreadId);
        }
        catch (Exception ex)
        {
            return SendMessageResult.Failed(ex.Message);
        }
    }
}

public class MarkMessageAsReadCommandHandler : IRequestHandler<MarkMessageAsReadCommand, MarkMessageAsReadResult>
{
    private readonly IMessageRepository _messageRepository;

    public MarkMessageAsReadCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<MarkMessageAsReadResult> Handle(MarkMessageAsReadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var message = await _messageRepository.GetByIdAsync(request.MessageId, cancellationToken);
            if (message == null)
                return MarkMessageAsReadResult.Failed("Message not found");

            message.MarkAsRead(request.UserId, request.IsAdmin);
            await _messageRepository.UpdateAsync(message, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            return MarkMessageAsReadResult.Successful();
        }
        catch (Exception ex)
        {
            return MarkMessageAsReadResult.Failed(ex.Message);
        }
    }
}

public class DeleteMessageCommandHandler : IRequestHandler<DeleteMessageCommand, DeleteMessageResult>
{
    private readonly IMessageRepository _messageRepository;

    public DeleteMessageCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<DeleteMessageResult> Handle(DeleteMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var message = await _messageRepository.GetByIdAsync(request.MessageId, cancellationToken);
            if (message == null)
                return DeleteMessageResult.Failed("Message not found");

            message.Delete(request.UserId, request.IsAdmin);
            await _messageRepository.UpdateAsync(message, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            return DeleteMessageResult.Successful();
        }
        catch (Exception ex)
        {
            return DeleteMessageResult.Failed(ex.Message);
        }
    }
}

public class StarMessageCommandHandler : IRequestHandler<StarMessageCommand, StarMessageResult>
{
    private readonly IMessageRepository _messageRepository;

    public StarMessageCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<StarMessageResult> Handle(StarMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var message = await _messageRepository.GetByIdAsync(request.MessageId, cancellationToken);
            if (message == null)
                return StarMessageResult.Failed("Message not found");

            message.ToggleStar();
            await _messageRepository.UpdateAsync(message, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            return StarMessageResult.Successful(message.IsStarred);
        }
        catch (Exception ex)
        {
            return StarMessageResult.Failed(ex.Message);
        }
    }
}

public class ArchiveThreadCommandHandler : IRequestHandler<ArchiveThreadCommand, ArchiveThreadResult>
{
    private readonly IMessageRepository _messageRepository;

    public ArchiveThreadCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<ArchiveThreadResult> Handle(ArchiveThreadCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var thread = await _messageRepository.GetThreadByIdAsync(request.ThreadId, cancellationToken);
            if (thread == null)
                return ArchiveThreadResult.Failed("Thread not found");

            // Archive or unarchive based on request
            if (request.Archive)
            {
                thread.Archive();
            }
            else
            {
                thread.Unarchive();
            }

            await _messageRepository.UpdateThreadAsync(thread, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            return ArchiveThreadResult.Successful(thread.IsArchived);
        }
        catch (Exception ex)
        {
            return ArchiveThreadResult.Failed(ex.Message);
        }
    }
}

public class ForwardMessageCommandHandler : IRequestHandler<ForwardMessageCommand, ForwardMessageResult>
{
    private readonly IMessageRepository _messageRepository;
    private readonly IMessageBroadcaster _messageBroadcaster;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<ForwardMessageCommandHandler> _logger;

    public ForwardMessageCommandHandler(
        IMessageRepository messageRepository,
        IMessageBroadcaster messageBroadcaster,
        IProjectionRepository projectionRepository,
        ILogger<ForwardMessageCommandHandler> logger)
    {
        _messageRepository = messageRepository;
        _messageBroadcaster = messageBroadcaster;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<ForwardMessageResult> Handle(ForwardMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get the source message
            var sourceMessage = await _messageRepository.GetByIdAsync(request.MessageId, cancellationToken);
            if (sourceMessage == null)
                return ForwardMessageResult.Failed("Source message not found");

            // Get or create thread for target application
            var targetThread = await _messageRepository.GetThreadByApplicationIdAsync(request.ToApplicationId, cancellationToken);
            var isNewThread = targetThread == null;

            if (targetThread == null)
            {
                // Fetch actual application details from projections
                var applicationDetails = await _projectionRepository.GetOnboardingCaseAsync(
                    request.ToApplicationId.ToString(), cancellationToken);
                
                var applicationReference = applicationDetails?.CaseId 
                    ?? $"APP-{request.ToApplicationId.ToString().Substring(0, 8)}";
                
                // Build applicant name from projection data (first + last name, or business name)
                string applicantName;
                if (!string.IsNullOrWhiteSpace(applicationDetails?.ApplicantFirstName))
                {
                    applicantName = $"{applicationDetails.ApplicantFirstName} {applicationDetails.ApplicantLastName}".Trim();
                }
                else if (!string.IsNullOrWhiteSpace(applicationDetails?.BusinessLegalName))
                {
                    applicantName = applicationDetails.BusinessLegalName;
                }
                else
                {
                    // Use partner name from projection if available, otherwise use case reference
                    applicantName = !string.IsNullOrWhiteSpace(applicationDetails?.PartnerName)
                        ? applicationDetails.PartnerName
                        : applicationReference;
                }
                
                targetThread = MessageThread.Create(
                    request.ToApplicationId,
                    applicationReference,
                    sourceMessage.SenderId,
                    applicantName);
                await _messageRepository.AddThreadAsync(targetThread, cancellationToken);
            }

            // Build forward content
            var forwardContent = string.IsNullOrWhiteSpace(request.AdditionalContent)
                ? $"[Forwarded from {sourceMessage.SenderName}]\n\n{sourceMessage.Content}"
                : $"{request.AdditionalContent}\n\n---\n[Forwarded from {sourceMessage.SenderName}]\n\n{sourceMessage.Content}";

            // Copy attachments if any
            var attachments = sourceMessage.Attachments?.Select(a =>
                MessageAttachment.Create(
                    Guid.Empty, // Will be set after message is created
                    a.FileName,
                    a.ContentType,
                    a.FileSizeBytes,
                    a.StorageKey,
                    a.StorageUrl,
                    a.DocumentId,
                    a.Description
                )
            ).ToList() ?? new List<MessageAttachment>();

            // Create forwarded message
            var forwardedMessage = Message.Create(
                targetThread.Id,
                request.ToApplicationId,
                request.UserId, // Forwarder is the sender
                request.UserName,
                request.UserRole,
                forwardContent,
                request.ToReceiverId,
                null, // receiverName
                null, // Not a reply
                attachments
            );

            // Update thread message count
            targetThread.IncrementMessageCount();

            if (!isNewThread)
            {
                await _messageRepository.UpdateThreadAsync(targetThread, cancellationToken);
            }

            await _messageRepository.AddAsync(forwardedMessage, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

            // Broadcast forwarded message via SignalR
            try
            {
                var messageDto = new
                {
                    id = forwardedMessage.Id.ToString(),
                    threadId = targetThread.Id.ToString(),
                    applicationId = request.ToApplicationId.ToString(),
                    senderId = request.UserId.ToString(),
                    senderName = request.UserName ?? "User",
                    senderEmail = (string?)null, // Email not available in forward command
                    senderRole = request.UserRole.ToString(),
                    content = forwardContent,
                    sentAt = forwardedMessage.SentAt.ToString("O"),
                    attachments = forwardedMessage.Attachments.Select(a => new
                    {
                        id = a.Id.ToString(),
                        fileName = a.FileName,
                        contentType = a.ContentType,
                        fileSizeBytes = a.FileSizeBytes,
                        storageKey = a.StorageKey,
                        storageUrl = a.StorageUrl,
                        documentId = a.DocumentId?.ToString(),
                        description = a.Description
                    }).ToList()
                };

                await _messageBroadcaster.BroadcastMessageAsync(
                    targetThread.Id.ToString(),
                    messageDto,
                    cancellationToken);

                _logger.LogInformation(
                    "Broadcasted forwarded message {MessageId} to thread {ThreadId} via SignalR",
                    forwardedMessage.Id, targetThread.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to broadcast forwarded message {MessageId} via SignalR (non-critical)",
                    forwardedMessage.Id);
            }

            return ForwardMessageResult.Successful(forwardedMessage.Id, targetThread.Id);
        }
        catch (Exception ex)
        {
            return ForwardMessageResult.Failed(ex.Message);
        }
    }
}

public class RefreshThreadMetadataCommandHandler : IRequestHandler<RefreshThreadMetadataCommand, RefreshThreadMetadataResult>
{
    private readonly IMessageRepository _messageRepository;
    private readonly IProjectionRepository _projectionRepository;
    private readonly ILogger<RefreshThreadMetadataCommandHandler> _logger;

    public RefreshThreadMetadataCommandHandler(
        IMessageRepository messageRepository,
        IProjectionRepository projectionRepository,
        ILogger<RefreshThreadMetadataCommandHandler> logger)
    {
        _messageRepository = messageRepository;
        _projectionRepository = projectionRepository;
        _logger = logger;
    }

    public async Task<RefreshThreadMetadataResult> Handle(RefreshThreadMetadataCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var updatedCount = 0;
            IEnumerable<MessageThread> threads;

            if (request.ThreadId.HasValue)
            {
                var thread = await _messageRepository.GetThreadByIdAsync(request.ThreadId.Value, cancellationToken);
                threads = thread != null ? new[] { thread } : Array.Empty<MessageThread>();
            }
            else
            {
                threads = await _messageRepository.GetAllThreadsAsync(cancellationToken);
            }

            foreach (var thread in threads)
            {
                var applicationDetails = await _projectionRepository.GetOnboardingCaseAsync(
                    thread.ApplicationId.ToString(), cancellationToken);

                if (applicationDetails == null)
                {
                    _logger.LogWarning(
                        "Could not find projection for application {ApplicationId} in thread {ThreadId}",
                        thread.ApplicationId, thread.Id);
                    continue;
                }

                // Build applicant name from projection data
                string? newApplicantName = null;
                if (!string.IsNullOrWhiteSpace(applicationDetails.ApplicantFirstName))
                {
                    newApplicantName = $"{applicationDetails.ApplicantFirstName} {applicationDetails.ApplicantLastName}".Trim();
                }
                else if (!string.IsNullOrWhiteSpace(applicationDetails.BusinessLegalName))
                {
                    newApplicantName = applicationDetails.BusinessLegalName;
                }
                else if (!string.IsNullOrWhiteSpace(applicationDetails.PartnerName))
                {
                    newApplicantName = applicationDetails.PartnerName;
                }

                var needsUpdate = false;

                // Update applicant name if we found a better one
                if (!string.IsNullOrWhiteSpace(newApplicantName) && 
                    (thread.ApplicantName.Contains("Unknown") || 
                     thread.ApplicantName.StartsWith("APP-") ||
                     string.IsNullOrWhiteSpace(thread.ApplicantName)))
                {
                    thread.UpdateApplicantName(newApplicantName);
                    needsUpdate = true;
                    _logger.LogInformation(
                        "Updated thread {ThreadId} applicant name from '{OldName}' to '{NewName}'",
                        thread.Id, thread.ApplicantName, newApplicantName);
                }

                // Update application reference if needed
                if (!string.IsNullOrWhiteSpace(applicationDetails.CaseId) &&
                    (thread.ApplicationReference.StartsWith("APP-") || string.IsNullOrWhiteSpace(thread.ApplicationReference)))
                {
                    thread.UpdateApplicationReference(applicationDetails.CaseId);
                    needsUpdate = true;
                }

                if (needsUpdate)
                {
                    await _messageRepository.UpdateThreadAsync(thread, cancellationToken);
                    updatedCount++;
                }
            }

            await _messageRepository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Refreshed metadata for {Count} threads", updatedCount);
            return RefreshThreadMetadataResult.Successful(updatedCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to refresh thread metadata");
            return RefreshThreadMetadataResult.Failed(ex.Message);
        }
    }
}

