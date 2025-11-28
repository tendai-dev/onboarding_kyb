using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Risk;

public class RiskAssessmentSetManualRiskLevelTests
{
    [Fact]
    public void SetManualRiskLevel_ShouldSetScore90_WhenRiskLevelIsHigh()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.High, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.High, assessment.OverallRiskLevel);
        Assert.Equal(90m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScore70_WhenRiskLevelIsMediumHigh()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.MediumHigh, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.MediumHigh, assessment.OverallRiskLevel);
        Assert.Equal(70m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScore50_WhenRiskLevelIsMedium()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Medium, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.Medium, assessment.OverallRiskLevel);
        Assert.Equal(50m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScore30_WhenRiskLevelIsMediumLow()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.MediumLow, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.MediumLow, assessment.OverallRiskLevel);
        Assert.Equal(30m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScore10_WhenRiskLevelIsLow()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Low, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.Low, assessment.OverallRiskLevel);
        Assert.Equal(10m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScore0_WhenRiskLevelIsUnknown()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Unknown, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.Unknown, assessment.OverallRiskLevel);
        Assert.Equal(0m, assessment.RiskScore);
    }
}

