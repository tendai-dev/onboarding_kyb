using MediatR;
using WorkQueueService.Application.Interfaces;

namespace WorkQueueService.Application.Commands;

public class AssignWorkItemCommandHandler : IRequestHandler<AssignWorkItemCommand, AssignWorkItemResult>
{
    private readonly IWorkItemRepository _repository;

    public AssignWorkItemCommandHandler(IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<AssignWorkItemResult> Handle(AssignWorkItemCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        
        if (workItem == null)
        {
            return new AssignWorkItemResult { Success = false, Message = "Work item not found" };
        }

        workItem.Assign(request.AssigneeId, request.AssigneeName, request.AssignedBy);
        
        await _repository.UpdateAsync(workItem, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new AssignWorkItemResult { Success = true, Message = "Work item assigned successfully" };
    }
}

