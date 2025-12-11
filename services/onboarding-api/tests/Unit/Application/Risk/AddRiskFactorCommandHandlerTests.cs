using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class AddRiskFactorCommandHandlerTests
{
    private readonly MockRiskAssessmentRepository _repositoryMock;
    private readonly AddRiskFactorCommandHandler _handler;

    public AddRiskFactorCommandHandlerTests()
    {
        _repositoryMock = new MockRiskAssessmentRepository();
        _handler = new AddRiskFactorCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldAddRiskFactor_WhenAssessmentExists()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        typeof(RiskAssessment).GetProperty("Id")!.SetValue(assessment, RiskAssessmentId.From(assessmentId));
        
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), assessment);

        var command = new AddRiskFactorCommand(
            assessmentId,
            RiskFactorType.Geography,
            RiskLevel.Medium,
            5.5m,
            "Test description",
            "Test source"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.FactorId);
        Assert.Equal("Geography", result.Type);
        Assert.Equal("Medium", result.Level);
        Assert.Equal(5.5m, result.Score);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAssessmentNotFound()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        _repositoryMock.SetupGetById(RiskAssessmentId.From(assessmentId), null);

        var command = new AddRiskFactorCommand(
            assessmentId,
            RiskFactorType.Geography,
            RiskLevel.Medium,
            5.5m,
            "Test description",
            "Test source"
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

