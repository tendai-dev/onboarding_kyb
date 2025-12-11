using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.EntityConfiguration;

public class RequirementAggregateTests
{
    [Fact]
    public void Constructor_ShouldThrow_WhenCodeIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Requirement(null!, "Display", "Description", "Type", "FieldType"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenDisplayNameIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Requirement("CODE", null!, "Description", "Type", "FieldType"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenDescriptionIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Requirement("CODE", "Display", null!, "Type", "FieldType"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenTypeIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Requirement("CODE", "Display", "Description", null!, "FieldType"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenFieldTypeIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new Requirement("CODE", "Display", "Description", "Type", null!));
    }

    [Fact]
    public void Constructor_ShouldCreateRequirement_WithAllProperties()
    {
        // Act
        var requirement = new Requirement(
            "CODE",
            "Display Name",
            "Description",
            "Type",
            "FieldType",
            "ValidationRules",
            "HelpText");

        // Assert
        Assert.NotEqual(Guid.Empty, requirement.Id);
        Assert.Equal("CODE", requirement.Code);
        Assert.Equal("Display Name", requirement.DisplayName);
        Assert.Equal("Description", requirement.Description);
        Assert.Equal("Type", requirement.Type);
        Assert.Equal("FieldType", requirement.FieldType);
        Assert.Equal("ValidationRules", requirement.ValidationRules);
        Assert.Equal("HelpText", requirement.HelpText);
        Assert.True(requirement.IsActive);
    }

    [Fact]
    public void UpdateDetails_ShouldThrow_WhenDisplayNameIsNull()
    {
        // Arrange
        var requirement = new Requirement("CODE", "Display", "Description", "Type", "FieldType");

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            requirement.UpdateDetails(null!, "Description", "Type", "FieldType"));
    }

    [Fact]
    public void UpdateDetails_ShouldUpdateProperties()
    {
        // Arrange
        var requirement = new Requirement("CODE", "Display", "Description", "Type", "FieldType");

        // Act
        requirement.UpdateDetails("New Display", "New Description", "New Type", "New FieldType", "New Rules", "New Help");

        // Assert
        Assert.Equal("New Display", requirement.DisplayName);
        Assert.Equal("New Description", requirement.Description);
        Assert.Equal("New Type", requirement.Type);
        Assert.Equal("New FieldType", requirement.FieldType);
        Assert.Equal("New Rules", requirement.ValidationRules);
        Assert.Equal("New Help", requirement.HelpText);
    }

    [Fact]
    public void Activate_ShouldSetIsActiveToTrue()
    {
        // Arrange
        var requirement = new Requirement("CODE", "Display", "Description", "Type", "FieldType");
        requirement.Deactivate();

        // Act
        requirement.Activate();

        // Assert
        Assert.True(requirement.IsActive);
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveToFalse()
    {
        // Arrange
        var requirement = new Requirement("CODE", "Display", "Description", "Type", "FieldType");

        // Act
        requirement.Deactivate();

        // Assert
        Assert.False(requirement.IsActive);
    }
}

