using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Interfaces;

public interface IMessageRepository
{
    Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default);
    Task AddAsync(Message message, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

