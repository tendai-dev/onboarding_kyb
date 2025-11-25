using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Messaging.Interfaces;
using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Messaging;

namespace OnboardingApi.Infrastructure.Persistence.Messaging;

public class MessageRepository : IMessageRepository
{
    private readonly MessagingDbContext _context;
    private readonly ILogger<MessageRepository> _logger;

    public MessageRepository(MessagingDbContext context, ILogger<MessageRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Messages
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return await _context.Messages
            .Where(m => m.ApplicationId == applicationId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        return await _context.Messages
            .Where(m => m.ThreadId == threadId)
            .OrderBy(m => m.SentAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Message>> GetAccessibleMessagesForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        var query = _context.Messages.AsQueryable();

        if (role is UserRole.Admin or UserRole.ComplianceManager)
        {
            // Admin-like roles can access all messages
            var allMessages = await query.ToListAsync(cancellationToken);
            _logger.LogInformation(
                "[MessageRepository] Admin access - UserId: {UserId}, Role: {Role}, TotalMessages: {Count}",
                userId, role, allMessages.Count);
            return allMessages;
        }

        // Regular users: messages they sent or explicitly received
        var userMessages = await query
            .Where(m => m.SenderId == userId || (m.ReceiverId.HasValue && m.ReceiverId == userId))
            .ToListAsync(cancellationToken);
        _logger.LogInformation(
            "[MessageRepository] User access - UserId: {UserId}, Role: {Role}, TotalMessages: {Count}",
            userId, role, userMessages.Count);
        return userMessages;
    }

    public async Task<List<Message>> GetAllMessagesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.Messages.ToListAsync(cancellationToken);
    }

    public async Task<MessageThread?> GetThreadByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default)
    {
        return await _context.MessageThreads
            .FirstOrDefaultAsync(t => t.ApplicationId == applicationId, cancellationToken);
    }

    public async Task<MessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        return await _context.MessageThreads
            .FirstOrDefaultAsync(t => t.Id == threadId, cancellationToken);
    }

    public async Task<List<MessageThread>> GetThreadsForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default)
    {
        if (role is UserRole.Admin or UserRole.ComplianceManager)
        {
            // Admins can see all threads
            return await _context.MessageThreads
                .OrderByDescending(t => t.LastMessageAt)
                .ToListAsync(cancellationToken);
        }

        // Regular users see threads where they are the applicant
        return await _context.MessageThreads
            .Where(t => t.ApplicantId == userId)
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<MessageThread>> GetAllThreadsAsync(CancellationToken cancellationToken = default)
    {
        return await _context.MessageThreads
            .OrderByDescending(t => t.LastMessageAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        await _context.Messages.AddAsync(message, cancellationToken);
    }

    public async Task AddThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        await _context.MessageThreads.AddAsync(thread, cancellationToken);
    }

    public async Task UpdateAsync(Message message, CancellationToken cancellationToken = default)
    {
        _context.Messages.Update(message);
    }

    public async Task UpdateThreadAsync(MessageThread thread, CancellationToken cancellationToken = default)
    {
        _context.MessageThreads.Update(thread);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

