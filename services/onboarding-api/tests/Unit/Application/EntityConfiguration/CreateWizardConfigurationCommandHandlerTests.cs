using OnboardingApi.Application.EntityConfiguration.Commands;
using OnboardingApi.Application.EntityConfiguration.Interfaces;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.EntityConfiguration;

public class CreateWizardConfigurationCommandHandlerTests
{
    private readonly MockWizardConfigurationRepository _wizardRepositoryMock;
    private readonly MockEntityTypeRepository _entityTypeRepositoryMock;
    private readonly CreateWizardConfigurationCommandHandler _handler;

    public CreateWizardConfigurationCommandHandlerTests()
    {
        _wizardRepositoryMock = new MockWizardConfigurationRepository();
        _entityTypeRepositoryMock = new MockEntityTypeRepository();
        _handler = new CreateWizardConfigurationCommandHandler(_wizardRepositoryMock, _entityTypeRepositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateWizardConfiguration_WhenEntityTypeExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Test Entity", "Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        
        _entityTypeRepositoryMock.SetupGetById(entityTypeId, entityType);
        _wizardRepositoryMock.SetupGetByEntityTypeId(entityTypeId, null);

        var command = new CreateWizardConfigurationCommand(
            EntityTypeId: entityTypeId,
            IsActive: true,
            Steps: new List<CreateWizardStepCommand>
            {
                new CreateWizardStepCommand(
                    Title: "Step 1",
                    Subtitle: "Subtitle 1",
                    RequirementTypes: new List<string> { "Document" },
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
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(entityTypeId, result.EntityTypeId);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenEntityTypeNotFound()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        _entityTypeRepositoryMock.SetupGetById(entityTypeId, null);

        var command = new CreateWizardConfigurationCommand(
            EntityTypeId: entityTypeId,
            IsActive: true,
            Steps: new List<CreateWizardStepCommand>()
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenWizardConfigurationAlreadyExists()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();
        var entityType = new EntityType("CODE-001", "Test Entity", "Description");
        typeof(EntityType).GetProperty("Id")!.SetValue(entityType, entityTypeId);
        var existingWizard = new WizardConfiguration(entityTypeId);
        
        _entityTypeRepositoryMock.SetupGetById(entityTypeId, entityType);
        _wizardRepositoryMock.SetupGetByEntityTypeId(entityTypeId, existingWizard);

        var command = new CreateWizardConfigurationCommand(
            EntityTypeId: entityTypeId,
            IsActive: true,
            Steps: new List<CreateWizardStepCommand>()
        );

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }
}

