using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class UpdateWizardConfigurationCommandHandlerTests
{
    private readonly MockWizardConfigurationRepository _repositoryMock;
    private readonly UpdateWizardConfigurationCommandHandler _handler;

    public UpdateWizardConfigurationCommandHandlerTests()
    {
        _repositoryMock = new MockWizardConfigurationRepository();
        _handler = new UpdateWizardConfigurationCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldUpdateWizardConfiguration_WhenConfigurationExists()
    {
        // Arrange
        var wizardId = Guid.NewGuid();
        var entityTypeId = Guid.NewGuid();
        var wizardConfig = new WizardConfiguration(entityTypeId);
        typeof(WizardConfiguration).GetProperty("Id")!.SetValue(wizardConfig, wizardId);
        
        _repositoryMock.SetupGetById(wizardId, wizardConfig);

        var command = new UpdateWizardConfigurationCommand(
            Id: wizardId,
            IsActive: false,
            Steps: new List<CreateWizardStepCommand>
            {
                new CreateWizardStepCommand(
                    Title: "Updated Step",
                    Subtitle: "Updated Subtitle",
                    RequirementTypes: new List<string>(),
                    ChecklistCategory: "Identity",
                    StepNumber: 1,
                    IsActive: true
                )
            }
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(wizardId, result.Id);
        Assert.Equal(entityTypeId, result.EntityTypeId);
        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenConfigurationNotFound()
    {
        // Arrange
        var wizardId = Guid.NewGuid();
        _repositoryMock.SetupGetById(wizardId, null);

        var command = new UpdateWizardConfigurationCommand(
            Id: wizardId,
            IsActive: true,
            Steps: new List<CreateWizardStepCommand>()
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

