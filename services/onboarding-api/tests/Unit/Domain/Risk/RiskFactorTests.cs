using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Risk;

public class RiskFactorTests
{
    [Fact]
    public void Create_ShouldCreateRiskFactor_WithAllProperties()
    {
        // Act
        var factor = RiskFactor.Create(
            RiskFactorType.PEP,
            RiskLevel.High,
            85m,
            "PEP status detected",
            "SanctionsDB");

        // Assert
        Assert.NotNull(factor.Id);
        Assert.Equal(RiskFactorType.PEP, factor.Type);
        Assert.Equal(RiskLevel.High, factor.Level);
        Assert.Equal(85m, factor.Score);
        Assert.Equal("PEP status detected", factor.Description);
        Assert.Equal("SanctionsDB", factor.Source);
        Assert.NotNull(factor.CreatedAt);
    }

    [Fact]
    public void Create_ShouldCreateRiskFactor_WithoutSource()
    {
        // Act
        var factor = RiskFactor.Create(
            RiskFactorType.Sanctions,
            RiskLevel.Medium,
            50m,
            "Sanctions match");

        // Assert
        Assert.Equal(RiskFactorType.Sanctions, factor.Type);
        Assert.Null(factor.Source);
    }

    [Fact]
    public void Update_ShouldUpdateAllProperties()
    {
        // Arrange
        var factor = RiskFactor.Create(
            RiskFactorType.PEP,
            RiskLevel.Low,
            20m,
            "Initial description");

        // Act
        factor.Update(RiskLevel.High, 90m, "Updated description");

        // Assert
        Assert.Equal(RiskLevel.High, factor.Level);
        Assert.Equal(90m, factor.Score);
        Assert.Equal("Updated description", factor.Description);
        Assert.True(factor.UpdatedAt.HasValue);
    }

    [Fact]
    public void Create_ShouldThrow_WhenScoreIsNegative()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, -1m, "Description"));
    }

    [Fact]
    public void Create_ShouldThrow_WhenScoreExceeds100()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, 101m, "Description"));
    }

    [Fact]
    public void Update_ShouldThrow_WhenScoreIsNegative()
    {
        // Arrange
        var factor = RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, 20m, "Description");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            factor.Update(RiskLevel.High, -1m, "Updated"));
    }

    [Fact]
    public void Update_ShouldThrow_WhenScoreExceeds100()
    {
        // Arrange
        var factor = RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, 20m, "Description");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            factor.Update(RiskLevel.High, 101m, "Updated"));
    }

    [Fact]
    public void Create_ShouldAcceptBoundaryValues()
    {
        // Act
        var factor1 = RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, 0m, "Min score");
        var factor2 = RiskFactor.Create(RiskFactorType.PEP, RiskLevel.Low, 100m, "Max score");

        // Assert
        Assert.Equal(0m, factor1.Score);
        Assert.Equal(100m, factor2.Score);
    }
}
