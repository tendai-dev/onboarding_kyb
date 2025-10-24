using MediatR;
using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Application.Queries;

public record GetFormConfigurationQuery : IRequest<FormConfiguration?>
{
    public string EntityType { get; init; } = string.Empty;
    public string Country { get; init; } = string.Empty;
    public string RiskLevel { get; init; } = string.Empty;
}

public class GetFormConfigurationQueryHandler : IRequestHandler<GetFormConfigurationQuery, FormConfiguration?>
{
    public async Task<FormConfiguration?> Handle(GetFormConfigurationQuery request, CancellationToken cancellationToken)
    {
        // In a real implementation, this would query the database
        // For now, return the form configuration based on the parameters
        await Task.CompletedTask;

        // Return appropriate form based on entity type and country
        var formCode = $"{request.Country}_{request.EntityType}_V1".ToUpper().Replace(" ", "_");

        return new FormConfiguration
        {
            Id = Guid.NewGuid(),
            FormCode = formCode,
            DisplayName = $"{request.Country} {request.EntityType} Onboarding",
            Description = $"Dynamic form for {request.EntityType} in {request.Country}",
            EntityType = request.EntityType,
            Country = request.Country,
            RiskLevel = request.RiskLevel,
            Version = 1,
            IsActive = true,
            EffectiveFrom = DateTime.UtcNow.AddMonths(-1),
            Sections = new List<FormSection>(),
            CreatedAt = DateTime.UtcNow
        };
    }
}

