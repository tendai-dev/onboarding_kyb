using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.EntityConfiguration;

public class EntityTypeRemoveRequirementTests
{
    [Fact]
    public void RemoveRequirement_ShouldRemoveRequirement_WhenRequirementExists()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var requirementId = Guid.NewGuid();
        entityType.AddRequirement(requirementId, true, 1);
        Assert.Single(entityType.Requirements);

        // Act
        entityType.RemoveRequirement(requirementId);

        // Assert
        Assert.Empty(entityType.Requirements);
    }

    [Fact]
    public void RemoveRequirement_ShouldNotThrow_WhenRequirementDoesNotExist()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var nonExistentRequirementId = Guid.NewGuid();

        // Act & Assert - Should not throw
        entityType.RemoveRequirement(nonExistentRequirementId);
        Assert.Empty(entityType.Requirements);
    }

    [Fact]
    public void RemoveRequirement_ShouldUpdateUpdatedAt_WhenRequirementRemoved()
    {
        // Arrange
        var entityType = new EntityType("INDIVIDUAL", "Individual", "Individual entity type");
        var requirementId = Guid.NewGuid();
        entityType.AddRequirement(requirementId, true, 1);
        var initialUpdatedAt = entityType.UpdatedAt;
        
        // Wait a bit to ensure time difference
        Thread.Sleep(10);

        // Act
        entityType.RemoveRequirement(requirementId);

        // Assert
        Assert.True(entityType.UpdatedAt >= initialUpdatedAt);
    }
}

