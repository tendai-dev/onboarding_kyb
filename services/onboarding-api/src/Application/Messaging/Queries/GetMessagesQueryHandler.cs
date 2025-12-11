using MediatR;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;

namespace OnboardingApi.Application.Messaging.Queries;

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

public class GetThreadByApplicationIdQueryHandler : IRequestHandler<GetThreadByApplicationIdQuery, MessageThreadDto?>
{
    private readonly IMessageRepository _messageRepository;

    public GetThreadByApplicationIdQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<MessageThreadDto?> Handle(GetThreadByApplicationIdQuery request, CancellationToken cancellationToken)
    {
        var thread = await _messageRepository.GetThreadByApplicationIdAsync(request.ApplicationId, cancellationToken);
        if (thread == null)
            return null;

        var messages = await _messageRepository.GetByThreadIdAsync(thread.Id, cancellationToken);
        var lastMessage = messages.OrderByDescending(m => m.SentAt).FirstOrDefault();

        return new MessageThreadDto
        {
            Id = thread.Id,
            ApplicationId = thread.ApplicationId,
            ApplicationReference = thread.ApplicationReference,
            ApplicantId = thread.ApplicantId,
            ApplicantName = thread.ApplicantName,
            AssignedAdminId = thread.AssignedAdminId,
            AssignedAdminName = thread.AssignedAdminName,
            IsActive = thread.IsActive,
            IsArchived = thread.IsArchived,
            IsStarred = thread.IsStarred,
            CreatedAt = thread.CreatedAt,
            LastMessageAt = thread.LastMessageAt,
            MessageCount = thread.MessageCount,
            UnreadCount = thread.UnreadCountApplicant + thread.UnreadCountAdmin,
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
                Attachments = null
            } : null
        };
    }
}

public class GetMyThreadsQueryHandler : IRequestHandler<GetMyThreadsQuery, PagedResult<MessageThreadDto>>
{
    private readonly IMessageRepository _messageRepository;

    public GetMyThreadsQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<PagedResult<MessageThreadDto>> Handle(GetMyThreadsQuery request, CancellationToken cancellationToken)
    {
        var threads = await _messageRepository.GetThreadsForUserAsync(request.UserId, request.UserRole, cancellationToken);
        
        var ordered = threads.OrderByDescending(t => t.LastMessageAt);
        var total = ordered.Count();

        var paged = ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new MessageThreadDto
            {
                Id = t.Id,
                ApplicationId = t.ApplicationId,
                ApplicationReference = t.ApplicationReference,
                ApplicantId = t.ApplicantId,
                ApplicantName = t.ApplicantName,
                AssignedAdminId = t.AssignedAdminId,
                AssignedAdminName = t.AssignedAdminName,
                IsActive = t.IsActive,
                IsArchived = t.IsArchived,
                IsStarred = t.IsStarred,
                CreatedAt = t.CreatedAt,
                LastMessageAt = t.LastMessageAt,
                MessageCount = t.MessageCount,
                UnreadCount = request.UserRole == OnboardingApi.Domain.Messaging.ValueObjects.UserRole.Applicant ? t.UnreadCountApplicant : t.UnreadCountAdmin,
                LastMessage = null
            })
            .ToList();

        return new PagedResult<MessageThreadDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetAllThreadsQueryHandler : IRequestHandler<GetAllThreadsQuery, PagedResult<MessageThreadDto>>
{
    private readonly IMessageRepository _messageRepository;

    public GetAllThreadsQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<PagedResult<MessageThreadDto>> Handle(GetAllThreadsQuery request, CancellationToken cancellationToken)
    {
        var threads = await _messageRepository.GetAllThreadsAsync(cancellationToken);
        
        var ordered = threads.OrderByDescending(t => t.LastMessageAt);
        var total = ordered.Count();

        var paged = ordered
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new MessageThreadDto
            {
                Id = t.Id,
                ApplicationId = t.ApplicationId,
                ApplicationReference = t.ApplicationReference,
                ApplicantId = t.ApplicantId,
                ApplicantName = t.ApplicantName,
                AssignedAdminId = t.AssignedAdminId,
                AssignedAdminName = t.AssignedAdminName,
                IsActive = t.IsActive,
                IsArchived = t.IsArchived,
                IsStarred = t.IsStarred,
                CreatedAt = t.CreatedAt,
                LastMessageAt = t.LastMessageAt,
                MessageCount = t.MessageCount,
                UnreadCount = t.UnreadCountApplicant + t.UnreadCountAdmin,
                LastMessage = null
            })
            .ToList();

        return new PagedResult<MessageThreadDto>
        {
            Items = paged,
            TotalCount = total,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }
}

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, int>
{
    private readonly IMessageRepository _messageRepository;

    public GetUnreadCountQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<int> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        var messages = await _messageRepository.GetAccessibleMessagesForUserAsync(request.UserId, request.UserRole, cancellationToken);
        return messages.Count(m => !m.IsRead && m.SenderId != request.UserId);
    }
}

