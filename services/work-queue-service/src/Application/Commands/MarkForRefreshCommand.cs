using MediatR;

namespace WorkQueueService.Application.Commands;

public record MarkForRefreshCommand(
    Guid WorkItemId,
    string MarkedByUserId
) : IRequest<MarkForRefreshResult>;

public record MarkForRefreshResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    
    public static MarkForRefreshResult Successful() => new() { Success = true };
    public static MarkForRefreshResult Failed(string error) => new() { Success = false, ErrorMessage = error };
}

public class MarkForRefreshCommandHandler : IRequestHandler<MarkForRefreshCommand, MarkForRefreshResult>
{
    private readonly Application.Interfaces.IWorkItemRepository _repository;

    public MarkForRefreshCommandHandler(Application.Interfaces.IWorkItemRepository repository)
    {
        _repository = repository;
    }

    public async Task<MarkForRefreshResult> Handle(MarkForRefreshCommand request, CancellationToken cancellationToken)
    {
        var workItem = await _repository.GetByIdAsync(request.WorkItemId, cancellationToken);
        if (workItem == null)
            return MarkForRefreshResult.Failed("Work item not found");

        try
        {
            workItem.MarkForRefresh(request.MarkedByUserId);
            await _repository.UpdateAsync(workItem, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);
            return MarkForRefreshResult.Successful();
        }
        catch (Exception ex)
        {
            return MarkForRefreshResult.Failed(ex.Message);
        }
    }
}

