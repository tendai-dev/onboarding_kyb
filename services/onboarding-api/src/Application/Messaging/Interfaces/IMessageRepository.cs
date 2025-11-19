using OnboardingApi.Domain.Messaging.Aggregates;
using OnboardingApi.Domain.Messaging.ValueObjects;

namespace OnboardingApi.Application.Messaging.Interfaces;

public interface IMessageRepository
{
    Task<Message?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByCaseIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task<List<Message>> GetByThreadIdAsync(Guid threadId, CancellationToken cancellationToken = default);
    Task<List<Message>> GetAccessibleMessagesForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default);
    Task<List<Message>> GetAllMessagesAsync(CancellationToken cancellationToken = default);
    Task<MessageThread?> GetThreadByApplicationIdAsync(Guid applicationId, CancellationToken cancellationToken = default);
    Task<MessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default);
    Task<List<MessageThread>> GetThreadsForUserAsync(Guid userId, UserRole role, CancellationToken cancellationToken = default);
    Task<List<MessageThread>> GetAllThreadsAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Message message, CancellationToken cancellationToken = default);
    Task AddThreadAsync(MessageThread thread, CancellationToken cancellationToken = default);
    Task UpdateAsync(Message message, CancellationToken cancellationToken = default);
    Task UpdateThreadAsync(MessageThread thread, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}

