using Microsoft.EntityFrameworkCore;
using MessagingService.Application.Interfaces;
using MessagingService.Domain.Aggregates;
using MessagingService.Infrastructure.Persistence;

namespace MessagingService.Infrastructure.Repositories;

public class MessageRepository : IMessageRepository
{
    private readonly MessagingDbContext _context;

    public MessageRepository(MessagingDbContext context)
    {
        _context = context;
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

    public async Task AddAsync(Message message, CancellationToken cancellationToken = default)
    {
        await _context.Messages.AddAsync(message, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}

