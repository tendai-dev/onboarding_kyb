using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class UpdateRiskFactorCommandHandlerTests
{
    private readonly MockRiskAssessmentRepository _repositoryMock;
    private readonly UpdateRiskFactorCommandHandler _handler;

    public UpdateRiskFactorCommandHandlerTests()
    {
        _repositoryMock = new MockRiskAssessmentRepository();
        _handler = new UpdateRiskFactorCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldUpdateRiskFactor_WhenAssessmentExists()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var factorId = Guid.NewGuid();
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        typeof(RiskAssessment).GetProperty("Id")!.SetValue(assessment, RiskAssessmentId.From(assessmentId));
        
        // Add a risk factor first
        assessment.AddRiskFactor(RiskFactorType.Geography, RiskLevel.Medium, 5.0m, "Original description", "source");
        var factor = assessment.Factors.First();
        typeof(RiskFactor).GetProperty("Id")!.SetValue(factor, RiskFactorId.From(factorId));
        
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), assessment);

        var command = new UpdateRiskFactorCommand(
            assessmentId,
            factorId,
            RiskLevel.High,
            7.5m,
            "Updated description"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(factorId, result.FactorId);
        Assert.Equal("High", result.Level);
        Assert.Equal(7.5m, result.Score);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAssessmentNotFound()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), null);

        var command = new UpdateRiskFactorCommand(
            assessmentId,
            Guid.NewGuid(),
            RiskLevel.High,
            7.5m,
            "Updated description"
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

