using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.EntityConfiguration;

public class WizardConfigurationAggregateTests
{
    [Fact]
    public void Constructor_ShouldCreateWizardConfiguration()
    {
        // Arrange
        var entityTypeId = Guid.NewGuid();

        // Act
        var wizard = new WizardConfiguration(entityTypeId);

        // Assert
        Assert.NotEqual(Guid.Empty, wizard.Id);
        Assert.Equal(entityTypeId, wizard.EntityTypeId);
        Assert.True(wizard.IsActive);
        Assert.Empty(wizard.Steps);
    }

    [Fact]
    public void UpdateSteps_ShouldReplaceAllSteps()
    {
        // Arrange
        var wizard = new WizardConfiguration(Guid.NewGuid());
        var step1 = new WizardStep(wizard.Id, "Step 1", "Subtitle 1", "[]", "Category1", 1);
        var step2 = new WizardStep(wizard.Id, "Step 2", "Subtitle 2", "[]", "Category2", 2);
        wizard.UpdateSteps(new List<WizardStep> { step1, step2 });

        // Act
        var newStep = new WizardStep(wizard.Id, "Step 3", "Subtitle 3", "[]", "Category3", 3);
        wizard.UpdateSteps(new List<WizardStep> { newStep });

        // Assert
        Assert.Single(wizard.Steps);
        Assert.Equal("Step 3", wizard.Steps.First().Title);
    }

    [Fact]
    public void Activate_ShouldSetIsActiveToTrue()
    {
        // Arrange
        var wizard = new WizardConfiguration(Guid.NewGuid());
        wizard.Deactivate();

        // Act
        wizard.Activate();

        // Assert
        Assert.True(wizard.IsActive);
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveToFalse()
    {
        // Arrange
        var wizard = new WizardConfiguration(Guid.NewGuid());

        // Act
        wizard.Deactivate();

        // Assert
        Assert.False(wizard.IsActive);
    }
}

public class WizardStepAggregateTests
{
    [Fact]
    public void Constructor_ShouldThrow_WhenTitleIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new WizardStep(Guid.NewGuid(), null!, "Subtitle", "[]", "Category", 1));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenSubtitleIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new WizardStep(Guid.NewGuid(), "Title", null!, "[]", "Category", 1));
    }

    [Fact]
    public void Constructor_ShouldCreateWizardStep_WithAllProperties()
    {
        // Arrange
        var wizardId = Guid.NewGuid();

        // Act
        var step = new WizardStep(wizardId, "Title", "Subtitle", "[\"Type1\"]", "Category", 1);

        // Assert
        Assert.NotEqual(Guid.Empty, step.Id);
        Assert.Equal(wizardId, step.WizardConfigurationId);
        Assert.Equal("Title", step.Title);
        Assert.Equal("Subtitle", step.Subtitle);
        Assert.Equal("[\"Type1\"]", step.RequirementTypes);
        Assert.Equal("Category", step.ChecklistCategory);
        Assert.Equal(1, step.StepNumber);
        Assert.True(step.IsActive);
    }

    [Fact]
    public void Constructor_ShouldUseDefaultRequirementTypes_WhenNull()
    {
        // Act
        var step = new WizardStep(Guid.NewGuid(), "Title", "Subtitle", null!, "Category", 1);

        // Assert
        Assert.Equal("[]", step.RequirementTypes);
    }

    [Fact]
    public void UpdateDetails_ShouldThrow_WhenTitleIsNull()
    {
        // Arrange
        var step = new WizardStep(Guid.NewGuid(), "Title", "Subtitle", "[]", "Category", 1);

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            step.UpdateDetails(null!, "Subtitle", "[]", "Category", 1));
    }

    [Fact]
    public void UpdateDetails_ShouldUpdateProperties()
    {
        // Arrange
        var step = new WizardStep(Guid.NewGuid(), "Title", "Subtitle", "[]", "Category", 1);

        // Act
        step.UpdateDetails("New Title", "New Subtitle", "[\"NewType\"]", "New Category", 2);

        // Assert
        Assert.Equal("New Title", step.Title);
        Assert.Equal("New Subtitle", step.Subtitle);
        Assert.Equal("[\"NewType\"]", step.RequirementTypes);
        Assert.Equal("New Category", step.ChecklistCategory);
        Assert.Equal(2, step.StepNumber);
    }

    [Fact]
    public void Activate_ShouldSetIsActiveToTrue()
    {
        // Arrange
        var step = new WizardStep(Guid.NewGuid(), "Title", "Subtitle", "[]", "Category", 1);
        step.Deactivate();

        // Act
        step.Activate();

        // Assert
        Assert.True(step.IsActive);
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveToFalse()
    {
        // Arrange
        var step = new WizardStep(Guid.NewGuid(), "Title", "Subtitle", "[]", "Category", 1);

        // Act
        step.Deactivate();

        // Assert
        Assert.False(step.IsActive);
    }
}

