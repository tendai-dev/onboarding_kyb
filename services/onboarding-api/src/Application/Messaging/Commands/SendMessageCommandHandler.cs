using MediatR;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;

namespace OnboardingApi.Application.Messaging.Commands;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, SendMessageResult>
{
    private readonly IMessageRepository _messageRepository;

    public SendMessageCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<SendMessageResult> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        try
        {
            // Get or create thread for this application
            var thread = await _messageRepository.GetThreadByApplicationIdAsync(request.ApplicationId, cancellationToken);
            
            if (thread == null)
            {
                // Create new thread - in production, would get application details
                thread = MessageThread.Create(
                    request.ApplicationId,
                    $"APP-{request.ApplicationId}",
                    request.SenderId,
                    request.SenderName);
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
                request.SenderName,
                request.SenderRole,
                request.Content,
                request.ReceiverId,
                null, // receiverName - can be populated if needed
                request.ReplyToMessageId,
                attachments
            );
            
            // Update thread
            thread.IncrementMessageCount();
            await _messageRepository.UpdateThreadAsync(thread, cancellationToken);

            await _messageRepository.AddAsync(message, cancellationToken);
            await _messageRepository.SaveChangesAsync(cancellationToken);

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

            message.MarkAsRead(request.UserId);
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

            message.Delete(request.UserId);
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

