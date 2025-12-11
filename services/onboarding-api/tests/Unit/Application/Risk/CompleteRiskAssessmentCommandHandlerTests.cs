using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class CompleteRiskAssessmentCommandHandlerTests
{
    private readonly MockRiskAssessmentRepository _repositoryMock;
    private readonly CompleteRiskAssessmentCommandHandler _handler;

    public CompleteRiskAssessmentCommandHandlerTests()
    {
        _repositoryMock = new MockRiskAssessmentRepository();
        _handler = new CompleteRiskAssessmentCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCompleteAssessment_WhenAssessmentExists()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        typeof(RiskAssessment).GetProperty("Id")!.SetValue(assessment, RiskAssessmentId.From(assessmentId));
        
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), assessment);

        var command = new CompleteRiskAssessmentCommand(assessmentId, "assessor123", "Assessment notes");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(assessmentId, result.AssessmentId);
        Assert.NotEqual(default(DateTime), result.CompletedAt);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAssessmentNotFound()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), null);

        var command = new CompleteRiskAssessmentCommand(assessmentId, "assessor123", "Assessment notes");

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

