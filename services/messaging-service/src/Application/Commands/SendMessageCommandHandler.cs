using MediatR;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Commands;

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
            // For now, use ApplicationId as the thread grouping key
            var threadId = request.ApplicationId;

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
                threadId,
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
            
            // Update attachment message IDs
            if (attachments != null)
            {
                foreach (var attachment in attachments)
                {
                    // Use reflection or add a method to set MessageId
                    // For now, we'll handle this in the repository or use a factory method
                }
            }

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
