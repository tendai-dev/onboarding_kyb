using MediatR;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Domain.Aggregates;

namespace WorkQueueService.Application.Queries;

public class GetWorkItemsQueryHandler : IRequestHandler<GetWorkItemsQuery, List<WorkItem>>
{
    private readonly IWorkItemRepository _repository;

    public GetWorkItemsQueryHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<WorkItem>> Handle(GetWorkItemsQuery request, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(request.Status))
        {
            return await _repository.GetByStatusAsync(request.Status, cancellationToken);
        }

        if (request.AssigneeId.HasValue)
        {
            return await _repository.GetByAssigneeAsync(request.AssigneeId.Value, cancellationToken);
        }

        return await _repository.GetAllAsync(cancellationToken);
    }
}

