using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class RejectRiskAssessmentCommandHandlerTests
{
    private readonly MockRiskAssessmentRepository _repositoryMock;
    private readonly RejectRiskAssessmentCommandHandler _handler;

    public RejectRiskAssessmentCommandHandlerTests()
    {
        _repositoryMock = new MockRiskAssessmentRepository();
        _handler = new RejectRiskAssessmentCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldRejectAssessment_WhenAssessmentExists()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        typeof(RiskAssessment).GetProperty("Id")!.SetValue(assessment, RiskAssessmentId.From(assessmentId));
        
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), assessment);

        var command = new RejectRiskAssessmentCommand(assessmentId, "rejector123", "Invalid data");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(assessmentId, result.AssessmentId);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAssessmentNotFound()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), null);

        var command = new RejectRiskAssessmentCommand(assessmentId, "rejector123", "Invalid data");

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

