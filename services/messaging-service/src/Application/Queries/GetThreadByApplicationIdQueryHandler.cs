using MediatR;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Queries;

public class GetThreadByApplicationIdQueryHandler : IRequestHandler<GetThreadByApplicationIdQuery, MessageThreadDto?>
{
    private readonly IMessageRepository _messageRepository;

    public GetThreadByApplicationIdQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<MessageThreadDto?> Handle(GetThreadByApplicationIdQuery request, CancellationToken cancellationToken)
    {
        // Get all messages for this application
        var messages = await _messageRepository.GetByCaseIdAsync(request.ApplicationId, cancellationToken);

        if (messages == null || !messages.Any())
        {
            return null; // No thread exists yet
        }

        // Group messages by thread ID (typically one thread per application)
        var grouped = messages.GroupBy(m => m.ThreadId).FirstOrDefault();

        if (grouped == null)
        {
            return null;
        }

        var firstMessage = grouped.OrderBy(m => m.SentAt).First();
        var lastMessage = grouped.OrderByDescending(m => m.SentAt).FirstOrDefault();

        return new MessageThreadDto
        {
            Id = grouped.Key,
            ApplicationId = firstMessage.ApplicationId,
            ApplicationReference = string.Empty,
            ApplicantId = firstMessage.SenderId,
            ApplicantName = firstMessage.SenderName,
            MessageCount = grouped.Count(),
            UnreadCount = grouped.Count(x => !x.IsRead),
            LastMessageAt = grouped.Max(x => x.SentAt),
            IsActive = true,
            IsArchived = false,
            IsStarred = false,
            CreatedAt = grouped.Min(x => x.SentAt),
            LastMessage = lastMessage != null ? new MessageDto
            {
                Id = lastMessage.Id,
                ThreadId = lastMessage.ThreadId,
                SenderId = lastMessage.SenderId,
                SenderName = lastMessage.SenderName,
                SenderRole = lastMessage.SenderRole.ToString(),
                ReceiverId = lastMessage.ReceiverId,
                ReceiverName = lastMessage.ReceiverName,
                Content = lastMessage.Content,
                Type = lastMessage.Type.ToString(),
                Status = lastMessage.Status.ToString(),
                SentAt = lastMessage.SentAt,
                ReadAt = lastMessage.ReadAt,
                IsRead = lastMessage.IsRead,
                ReplyToMessageId = lastMessage.ReplyToMessageId,
                IsStarred = lastMessage.IsStarred,
                Attachments = lastMessage.Attachments?.Select(a => new MessageAttachmentDto
                {
                    Id = a.Id,
                    MessageId = a.MessageId,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    FileSizeBytes = a.FileSizeBytes,
                    StorageKey = a.StorageKey,
                    StorageUrl = a.StorageUrl,
                    DocumentId = a.DocumentId,
                    Description = a.Description,
                    UploadedAt = a.UploadedAt
                }).ToList() ?? new List<MessageAttachmentDto>()
            } : null
        };
    }
}

