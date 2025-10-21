using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Application.Interfaces;

public interface IChecklistTemplateService
{
    Task<List<ChecklistItemTemplate>> GetTemplatesAsync(ChecklistType type, CancellationToken cancellationToken = default);
}
