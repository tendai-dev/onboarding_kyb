using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.EntityConfiguration;

public class EntityTypeAggregateTests
{
    [Fact]
    public void Constructor_ShouldThrow_WhenCodeIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new EntityType(null!, "Display", "Description"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenDisplayNameIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new EntityType("CODE", null!, "Description"));
    }

    [Fact]
    public void Constructor_ShouldThrow_WhenDescriptionIsNull()
    {
        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            new EntityType("CODE", "Display", null!));
    }

    [Fact]
    public void Constructor_ShouldCreateEntityType_WithAllProperties()
    {
        // Act
        var entityType = new EntityType("CODE", "Display Name", "Description", "Icon");

        // Assert
        Assert.NotEqual(Guid.Empty, entityType.Id);
        Assert.Equal("CODE", entityType.Code);
        Assert.Equal("Display Name", entityType.DisplayName);
        Assert.Equal("Description", entityType.Description);
        Assert.Equal("Icon", entityType.Icon);
        Assert.True(entityType.IsActive);
    }

    [Fact]
    public void UpdateDetails_ShouldThrow_WhenDisplayNameIsNull()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");

        // Act & Assert
        Assert.Throws<ArgumentNullException>(() => 
            entityType.UpdateDetails(null!, "Description", "Icon"));
    }

    [Fact]
    public void UpdateDetails_ShouldUpdateProperties()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");

        // Act
        entityType.UpdateDetails("New Display", "New Description", "New Icon");

        // Assert
        Assert.Equal("New Display", entityType.DisplayName);
        Assert.Equal("New Description", entityType.Description);
        Assert.Equal("New Icon", entityType.Icon);
    }

    [Fact]
    public void Activate_ShouldSetIsActiveToTrue()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");
        entityType.Deactivate();

        // Act
        entityType.Activate();

        // Assert
        Assert.True(entityType.IsActive);
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveToFalse()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");

        // Act
        entityType.Deactivate();

        // Assert
        Assert.False(entityType.IsActive);
    }

    [Fact]
    public void AddRequirement_ShouldThrow_WhenRequirementAlreadyAdded()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");
        var requirementId = Guid.NewGuid();
        entityType.AddRequirement(requirementId, true, 1);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            entityType.AddRequirement(requirementId, false, 2));
    }

    [Fact]
    public void AddRequirement_ShouldAddRequirement()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");
        var requirementId = Guid.NewGuid();

        // Act
        entityType.AddRequirement(requirementId, true, 1);

        // Assert
        Assert.Single(entityType.Requirements);
        Assert.Equal(requirementId, entityType.Requirements.First().RequirementId);
    }

    [Fact]
    public void RemoveRequirement_ShouldRemoveRequirement_WhenExists()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");
        var requirementId = Guid.NewGuid();
        entityType.AddRequirement(requirementId, true, 1);

        // Act
        entityType.RemoveRequirement(requirementId);

        // Assert
        Assert.Empty(entityType.Requirements);
    }

    [Fact]
    public void RemoveRequirement_ShouldDoNothing_WhenNotExists()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");

        // Act
        entityType.RemoveRequirement(Guid.NewGuid());

        // Assert
        Assert.Empty(entityType.Requirements);
    }

    [Fact]
    public void UpdateRequirement_ShouldThrow_WhenRequirementNotFound()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            entityType.UpdateRequirement(Guid.NewGuid(), true, 1));
    }

    [Fact]
    public void UpdateRequirement_ShouldUpdateRequirement()
    {
        // Arrange
        var entityType = new EntityType("CODE", "Display", "Description");
        var requirementId = Guid.NewGuid();
        entityType.AddRequirement(requirementId, false, 1);

        // Act
        entityType.UpdateRequirement(requirementId, true, 2);

        // Assert
        var requirement = entityType.Requirements.First();
        Assert.True(requirement.IsRequired);
        Assert.Equal(2, requirement.DisplayOrder);
    }
}

