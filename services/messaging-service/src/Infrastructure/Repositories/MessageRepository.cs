using Microsoft.EntityFrameworkCore;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;
using MessagingService.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace MessagingService.Infrastructure.Repositories;

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

    public async Task<List<Message>> GetByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        return await _context.Messages
            .Where(m => m.ApplicationId == caseId)
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
            // Admin-like roles can access all messages (including those from applicants without ReceiverId)
            // This ensures admins can see all messages in the system
            var allMessages = await query.ToListAsync(cancellationToken);
            // Log for debugging
            _logger.LogInformation(
                "[MessageRepository] Admin access - UserId: {UserId}, Role: {Role}, TotalMessages: {Count}",
                userId, role, allMessages.Count);
            
            if (allMessages.Count > 0)
            {
                _logger.LogInformation(
                    "[MessageRepository] Sample messages - First: ThreadId={ThreadId}, SenderId={SenderId}, SenderRole={SenderRole}",
                    allMessages[0].ThreadId, allMessages[0].SenderId, allMessages[0].SenderRole);
            }
            
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
        var allMessages = await _context.Messages.ToListAsync(cancellationToken);
        _logger.LogInformation(
            "[MessageRepository] GetAllMessagesAsync - TotalMessages: {Count}",
            allMessages.Count);
        return allMessages;
    }

    public async Task AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        await _context.Messages.AddAsync(message, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

