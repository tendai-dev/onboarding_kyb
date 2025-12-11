using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Application.Checklist.Interfaces;

public interface IChecklistTemplateService
{
    Task<List<ChecklistItemTemplate>> GetTemplatesAsync(ChecklistType type, CancellationToken cancellationToken = default);
}

