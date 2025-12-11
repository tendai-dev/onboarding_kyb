using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;

namespace OnboardingApi.Application.Risk.Commands;

public class CreateRiskAssessmentCommandHandler : IRequestHandler<CreateRiskAssessmentCommand, CreateRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;
    private readonly IOnboardingCaseRepository _caseRepository;
    private readonly ILogger<CreateRiskAssessmentCommandHandler> _logger;

    public CreateRiskAssessmentCommandHandler(
        IRiskAssessmentRepository repository,
        IOnboardingCaseRepository caseRepository,
        ILogger<CreateRiskAssessmentCommandHandler> logger)
    {
        _repository = repository;
        _caseRepository = caseRepository;
        _logger = logger;
    }

    public async Task<CreateRiskAssessmentResult> Handle(CreateRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        // Check if assessment already exists for this case
        // GetByCaseIdAsync now handles both GUID and case number lookups
        var existingAssessment = await _repository.GetByCaseIdAsync(request.CaseId, cancellationToken);
        if (existingAssessment != null)
        {
            _logger.LogInformation(
                "Risk assessment already exists for case {CaseId}. Existing assessment ID: {AssessmentId}, stored CaseId: {StoredCaseId}",
                request.CaseId,
                existingAssessment.Id.Value,
                existingAssessment.CaseId);
            throw new InvalidOperationException($"Risk assessment already exists for case {request.CaseId}");
        }

        // Create new assessment
        var assessment = RiskAssessment.Create(request.CaseId, request.PartnerId);

        // Save to repository
        await _repository.AddAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        // Update case status to Risk Review phase
        // This ensures proper state transition and workflow tracking
        try
        {
            OnboardingCase? caseEntity = null;
            
            // Try to parse as GUID first
            if (Guid.TryParse(request.CaseId, out var caseGuid))
            {
                // Find by GUID
                caseEntity = await _caseRepository.GetByIdAsync(caseGuid, cancellationToken);
            }
            
            // If not found by GUID, try case number
            if (caseEntity == null)
            {
                caseEntity = await _caseRepository.GetByCaseNumberAsync(request.CaseId, cancellationToken);
            }
            
            if (caseEntity == null)
            {
                _logger.LogWarning(
                    "Case not found for risk assessment creation. CaseId: {CaseId}. Risk assessment was still created, but case status was not updated.",
                    request.CaseId);
            }
            else
            {
                var initiatedBy = request.InitiatedBy ?? "system";
                caseEntity.StartRiskReview(initiatedBy);
                _caseRepository.Update(caseEntity);
                await _caseRepository.UnitOfWork.SaveChangesAsync(cancellationToken);
                
                _logger.LogInformation(
                    "Case {CaseId} (CaseNumber: {CaseNumber}) status updated to Risk Review phase by {InitiatedBy}",
                    caseEntity.Id,
                    caseEntity.CaseNumber,
                    initiatedBy);
            }
        }
        catch (InvalidOperationException ex)
        {
            // Business rule violation (e.g., invalid status transition)
            // Log as warning since this might be expected in some scenarios
            _logger.LogWarning(
                ex,
                "Cannot transition case {CaseId} to Risk Review phase: {Reason}. Risk assessment was still created.",
                request.CaseId,
                ex.Message);
        }
        catch (Exception ex)
        {
            // Unexpected error - log but don't fail the risk assessment creation
            // The risk assessment is more critical than the status update
            _logger.LogError(
                ex,
                "Failed to update case status to Risk Review for case {CaseId}. Risk assessment was still created.",
                request.CaseId);
        }

        return new CreateRiskAssessmentResult(
            assessment.Id.Value,
            assessment.CaseId,
            assessment.PartnerId,
            assessment.Status.ToString());
    }
}

public class AddRiskFactorCommandHandler : IRequestHandler<AddRiskFactorCommand, AddRiskFactorResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public AddRiskFactorCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<AddRiskFactorResult> Handle(AddRiskFactorCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.AddRiskFactor(request.Type, request.Level, request.Score, request.Description, request.Source);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var factor = assessment.Factors.Last();
        return new AddRiskFactorResult(
            factor.Id.Value,
            factor.Type.ToString(),
            factor.Level.ToString(),
            factor.Score);
    }
}

public class UpdateRiskFactorCommandHandler : IRequestHandler<UpdateRiskFactorCommand, UpdateRiskFactorResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public UpdateRiskFactorCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRiskFactorResult> Handle(UpdateRiskFactorCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.UpdateRiskFactor(
            RiskFactorId.From(request.FactorId),
            request.Level,
            request.Score,
            request.Description);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        var factor = assessment.Factors.First(f => f.Id.Value == request.FactorId);
        return new UpdateRiskFactorResult(
            factor.Id.Value,
            factor.Level.ToString(),
            factor.Score);
    }
}

public class CompleteRiskAssessmentCommandHandler : IRequestHandler<CompleteRiskAssessmentCommand, CompleteRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public CompleteRiskAssessmentCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<CompleteRiskAssessmentResult> Handle(CompleteRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.CompleteAssessment(request.AssessedBy, request.Notes);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new CompleteRiskAssessmentResult(
            assessment.Id.Value,
            assessment.Status.ToString(),
            assessment.CompletedAt ?? DateTime.UtcNow);
    }
}

public class RejectRiskAssessmentCommandHandler : IRequestHandler<RejectRiskAssessmentCommand, RejectRiskAssessmentResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public RejectRiskAssessmentCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<RejectRiskAssessmentResult> Handle(RejectRiskAssessmentCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.RejectAssessment(request.RejectedBy, request.Reason);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new RejectRiskAssessmentResult(
            assessment.Id.Value,
            assessment.Status.ToString());
    }
}

public class SetManualRiskLevelCommandHandler : IRequestHandler<SetManualRiskLevelCommand, SetManualRiskLevelResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public SetManualRiskLevelCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<SetManualRiskLevelResult> Handle(SetManualRiskLevelCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.SetManualRiskLevel(request.RiskLevel, request.AssessedBy, request.Justification);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new SetManualRiskLevelResult(
            assessment.Id.Value,
            assessment.OverallRiskLevel.ToString(),
            assessment.RiskScore);
    }
}

public class UpdateRiskAssessmentNotesCommandHandler : IRequestHandler<UpdateRiskAssessmentNotesCommand, UpdateRiskAssessmentNotesResult>
{
    private readonly IRiskAssessmentRepository _repository;

    public UpdateRiskAssessmentNotesCommandHandler(IRiskAssessmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<UpdateRiskAssessmentNotesResult> Handle(UpdateRiskAssessmentNotesCommand request, CancellationToken cancellationToken)
    {
        var assessment = await _repository.GetByIdAsync(RiskAssessmentId.From(request.AssessmentId), cancellationToken);
        if (assessment == null)
            throw new InvalidOperationException($"Risk assessment {request.AssessmentId} not found");

        assessment.UpdateNotes(request.Notes);
        
        await _repository.UpdateAsync(assessment, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return new UpdateRiskAssessmentNotesResult(
            assessment.Id.Value,
            true);
    }
}

