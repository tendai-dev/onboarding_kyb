using MediatR;
using MessagingService.Application.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Commands;

public class SendMessageCommandHandler : IRequestHandler<SendMessageCommand, SendMessageResult>
{
    private readonly IMessageRepository _repository;

    public SendMessageCommandHandler(IMessageRepository repository)
    {
        _repository = repository;
    }

    public async Task<SendMessageResult> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var message = Message.Create(
            request.CaseId,
            request.ThreadId,
            request.FromUserId,
            request.FromUserName,
            request.FromRole,
            request.Body);

        await _repository.AddAsync(message, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new SendMessageResult
        {
            Success = true,
            MessageId = message.Id,
            CreatedAt = message.CreatedAt
        };
    }
}

