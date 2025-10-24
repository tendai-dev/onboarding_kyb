using MediatR;
using MessagingService.Application.Interfaces;
using MessagingService.Domain.Aggregates;

namespace MessagingService.Application.Queries;

public class GetMessagesQueryHandler : IRequestHandler<GetMessagesQuery, List<Message>>
{
    private readonly IMessageRepository _repository;

    public GetMessagesQueryHandler(IMessageRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Message>> Handle(GetMessagesQuery request, CancellationToken cancellationToken)
    {
        if (request.ThreadId.HasValue)
        {
            return await _repository.GetByThreadIdAsync(request.ThreadId.Value, cancellationToken);
        }

        if (request.CaseId.HasValue)
        {
            return await _repository.GetByCaseIdAsync(request.CaseId.Value, cancellationToken);
        }

        return new List<Message>();
    }
}

