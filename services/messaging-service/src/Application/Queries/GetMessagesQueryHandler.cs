using MediatR;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Queries;

public class GetMessagesQueryHandler : IRequestHandler<GetMessagesQuery, PagedResult<MessageDto>>
{
    private readonly IMessageRepository _messageRepository;

    public GetMessagesQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<PagedResult<MessageDto>> Handle(GetMessagesQuery request, CancellationToken cancellationToken)
    {
        var messages = await _messageRepository.GetByThreadIdAsync(request.ThreadId, cancellationToken);

        var ordered = messages.OrderByDescending(m => m.SentAt);
        var total = ordered.Count();

        var paged = ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                ThreadId = m.ThreadId,
                SenderId = m.SenderId,
                SenderName = m.SenderName,
                SenderRole = m.SenderRole.ToString(),
                ReceiverId = m.ReceiverId,
                ReceiverName = m.ReceiverName,
                Content = m.Content,
                Type = m.Type.ToString(),
                Status = m.Status.ToString(),
                SentAt = m.SentAt,
                ReadAt = m.ReadAt,
                IsRead = m.IsRead,
                ReplyToMessageId = m.ReplyToMessageId,
                IsStarred = m.IsStarred,
                Attachments = m.Attachments.Select(a => new MessageAttachmentDto
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
                }).ToList()
            })
            .ToList();

        return new PagedResult<MessageDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}


