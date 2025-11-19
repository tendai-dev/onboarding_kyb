using MessagingService.Domain.Aggregates;

namespace MessagingService.Domain.Interfaces;

public interface IMessageRepository
{
    Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default);
    Task<List<Message>> GetAccessibleMessagesForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default);
    Task<List<Message>> GetAllMessagesAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Message message, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

