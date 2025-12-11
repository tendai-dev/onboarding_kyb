using Mapster;
using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Commands;

/// <summary>
/// Handler for CreateOnboardingCaseCommand
/// </summary>
public class CreateOnboardingCaseCommandHandler : IRequestHandler<CreateOnboardingCaseCommand, CreateOnboardingCaseResult>
{
    private readonly IOnboardingCaseRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<CreateOnboardingCaseCommandHandler> _logger;

    public CreateOnboardingCaseCommandHandler(
        IOnboardingCaseRepository repository,
        IEventBus eventBus,
        ILogger<CreateOnboardingCaseCommandHandler> logger)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<CreateOnboardingCaseResult> Handle(CreateOnboardingCaseCommand request, CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "Creating onboarding case for partner {PartnerId}, type {Type}",
            request.PartnerId,
            request.Type);

        // Map DTOs to value objects using Mapster
        var applicant = request.Applicant.Adapt<ApplicantDetails>();
        var business = request.Business?.Adapt<BusinessDetails>();

        // Create aggregate
        var onboardingCase = OnboardingCase.Create(
            request.Type,
            request.PartnerId,
            request.PartnerReferenceId,
            applicant,
            business,
            request.CreatedBy);

        // Persist
        await _repository.AddAsync(onboardingCase, cancellationToken);
        await _repository.UnitOfWork.SaveChangesAsync(cancellationToken);

        // Publish domain events
        foreach (var domainEvent in onboardingCase.DomainEvents)
        {
            await _eventBus.PublishAsync(domainEvent, cancellationToken);
        }

        onboardingCase.ClearDomainEvents();

        _logger.LogInformation(
            "Created onboarding case {CaseId} with number {CaseNumber}",
            onboardingCase.Id,
            onboardingCase.CaseNumber);

        return new CreateOnboardingCaseResult(onboardingCase.Id, onboardingCase.CaseNumber);
    }
}

