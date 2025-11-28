using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class CreateRiskAssessmentCommandHandlerTests
{
    private readonly MockRiskAssessmentRepository _repositoryMock;
    private readonly CreateRiskAssessmentCommandHandler _handler;

    public CreateRiskAssessmentCommandHandlerTests()
    {
        _repositoryMock = new MockRiskAssessmentRepository();
        _handler = new CreateRiskAssessmentCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateRiskAssessment_WhenNoExistingAssessment()
    {
        // Arrange
        var caseId = "CASE-123";
        var partnerId = "PARTNER-456";
        _repositoryMock.SetupGetByCaseId(caseId, null);

        var command = new CreateRiskAssessmentCommand(caseId, partnerId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.AssessmentId);
        Assert.Equal(caseId, result.CaseId);
        Assert.Equal(partnerId, result.PartnerId);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenAssessmentAlreadyExists()
    {
        // Arrange
        var caseId = "CASE-123";
        var partnerId = "PARTNER-456";
        var existingAssessment = RiskAssessment.Create(caseId, partnerId);
        _repositoryMock.SetupGetByCaseId(caseId, existingAssessment);

        var command = new CreateRiskAssessmentCommand(caseId, partnerId);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

