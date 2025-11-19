using MediatR;
using MessagingService.Domain.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Queries;

public class GetUnreadCountQueryHandler : IRequestHandler<GetUnreadCountQuery, int>
{
    private readonly IMessageRepository _messageRepository;

    public GetUnreadCountQueryHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<int> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        var accessible = await _messageRepository.GetAccessibleMessagesForUserAsync(request.UserId, request.UserRole, cancellationToken);

        if (request.UserRole is UserRole.Admin or UserRole.ComplianceManager)
        {
            // For admin-like roles, count unread messages:
            // - Messages without ReceiverId (general messages, typically from applicants)
            // - Messages where admin is the receiver
            // - Messages sent by applicants (even if ReceiverId is null, they're meant for admins)
            return accessible.Count(m => !m.IsRead && 
                (m.ReceiverId == null || m.ReceiverId == request.UserId || m.SenderRole == UserRole.Applicant));
        }

        // For regular users, count messages explicitly addressed to them
        return accessible.Count(m => !m.IsRead && m.ReceiverId.HasValue && m.ReceiverId == request.UserId);
    }
}


