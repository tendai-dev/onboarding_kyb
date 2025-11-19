using MediatR;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;
using Microsoft.Extensions.Logging;

namespace MessagingService.Application.Queries;

public class GetAllThreadsQueryHandler : IRequestHandler<GetAllThreadsQuery, PagedResult<MessageThreadDto>>
{
    private readonly IMessageRepository _messageRepository;
    private readonly ILogger<GetAllThreadsQueryHandler> _logger;

    public GetAllThreadsQueryHandler(IMessageRepository messageRepository, ILogger<GetAllThreadsQueryHandler> logger)
    {
        _messageRepository = messageRepository;
        _logger = logger;
    }

    public async Task<PagedResult<MessageThreadDto>> Handle(GetAllThreadsQuery request, CancellationToken cancellationToken)
    {
        var allMessages = await _messageRepository.GetAllMessagesAsync(cancellationToken);

        _logger.LogInformation(
            "[GetAllThreadsQueryHandler] TotalMessages: {Count}",
            allMessages.Count);

        var grouped = allMessages
            .Where(m => m.ThreadId != Guid.Empty) // Filter out messages without valid thread IDs
            .GroupBy(m => m.ThreadId)
            .Select(g =>
            {
                var firstMessage = g.OrderByDescending(m => m.SentAt).First();
                
                // Count unread messages: messages that haven't been read
                var unreadCount = g.Count(m => !m.IsRead);
                
                var lastMessage = g.OrderByDescending(m => m.SentAt).FirstOrDefault();
                
                return new MessageThreadDto
                {
                    Id = g.Key,
                    ApplicationId = firstMessage.ApplicationId,
                    ApplicationReference = string.Empty,
                    ApplicantId = firstMessage.SenderId,
                    ApplicantName = firstMessage.SenderName,
                    MessageCount = g.Count(),
                    UnreadCount = unreadCount,
                    LastMessageAt = g.Max(x => x.SentAt),
                    IsActive = true,
                    CreatedAt = g.Min(x => x.SentAt),
                    LastMessage = lastMessage != null ? new MessageDto
                    {
                        Id = lastMessage.Id,
                        ThreadId = lastMessage.ThreadId,
                        SenderId = lastMessage.SenderId,
                        SenderName = lastMessage.SenderName,
                        SenderRole = lastMessage.SenderRole.ToString(),
                        ReceiverId = lastMessage.ReceiverId,
                        Content = lastMessage.Content,
                        Type = lastMessage.Type.ToString(),
                        Status = lastMessage.Status.ToString(),
                        SentAt = lastMessage.SentAt,
                        ReadAt = lastMessage.ReadAt,
                        IsRead = lastMessage.IsRead
                    } : null
                };
            })
            .OrderByDescending(t => t.LastMessageAt);

        var totalCount = grouped.Count();
        var items = grouped
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToList();

        _logger.LogInformation(
            "[GetAllThreadsQueryHandler] Result - TotalThreads: {TotalCount}, ItemsReturned: {ItemsCount}",
            totalCount, items.Count);

        return new PagedResult<MessageThreadDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

