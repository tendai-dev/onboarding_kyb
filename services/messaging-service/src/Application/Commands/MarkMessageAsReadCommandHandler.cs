using MediatR;
using MessagingService.Domain.Interfaces;

namespace MessagingService.Application.Commands;

public class MarkMessageAsReadCommandHandler : IRequestHandler<MarkMessageAsReadCommand, MarkMessageAsReadResult>
{
    private readonly IMessageRepository _messageRepository;

    public MarkMessageAsReadCommandHandler(IMessageRepository messageRepository)
    {
        _messageRepository = messageRepository;
    }

    public async Task<MarkMessageAsReadResult> Handle(MarkMessageAsReadCommand request, CancellationToken cancellationToken)
    {
        var message = await _messageRepository.GetByIdAsync(request.MessageId, cancellationToken);
        if (message == null)
            return MarkMessageAsReadResult.Failed("Message not found");

        try
        {
            message.MarkAsRead(request.UserId);
            await _messageRepository.SaveChangesAsync(cancellationToken);
            return MarkMessageAsReadResult.Successful();
        }
        catch (Exception ex)
        {
            return MarkMessageAsReadResult.Failed(ex.Message);
        }
    }
}
