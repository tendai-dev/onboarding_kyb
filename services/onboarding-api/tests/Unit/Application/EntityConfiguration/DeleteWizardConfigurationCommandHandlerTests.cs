using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class DeleteWizardConfigurationCommandHandlerTests
{
    private readonly MockWizardConfigurationRepository _repositoryMock;
    private readonly DeleteWizardConfigurationCommandHandler _handler;

    public DeleteWizardConfigurationCommandHandlerTests()
    {
        _repositoryMock = new MockWizardConfigurationRepository();
        _handler = new DeleteWizardConfigurationCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldDeleteWizardConfiguration_WhenConfigurationExists()
    {
        // Arrange
        var wizardId = Guid.NewGuid();
        var wizardConfig = new WizardConfiguration(Guid.NewGuid());
        typeof(WizardConfiguration).GetProperty("Id")!.SetValue(wizardConfig, wizardId);
        
        _repositoryMock.SetupGetById(wizardId, wizardConfig);

        var command = new DeleteWizardConfigurationCommand(wizardId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnFalse_WhenConfigurationNotFound()
    {
        // Arrange
        var wizardId = Guid.NewGuid();
        _repositoryMock.SetupGetById(wizardId, null);

        var command = new DeleteWizardConfigurationCommand(wizardId);

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result);
    }
}

