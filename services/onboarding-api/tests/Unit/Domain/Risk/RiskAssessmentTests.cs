using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Risk;

public class RiskAssessmentTests
{
    [Fact]
    public void UpdateRiskFactor_ShouldThrowException_WhenFactorNotFound()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        var nonExistentFactorId = RiskFactorId.New();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => assessment.UpdateRiskFactor(
            nonExistentFactorId,
            RiskLevel.High,
            75m,
            "Description"
        ));
    }

    [Fact]
    public void CompleteAssessment_ShouldNotChangeStatus_WhenAlreadyCompleted()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        assessment.CompleteAssessment("assessor1", "Notes");
        var originalCompletedAt = assessment.CompletedAt;

        // Act
        assessment.CompleteAssessment("assessor2", "New notes");

        // Assert
        Assert.Equal(RiskAssessmentStatus.Completed, assessment.Status);
        Assert.Equal(originalCompletedAt, assessment.CompletedAt);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldThrowException_WhenAssessedByEmpty()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => assessment.SetManualRiskLevel(
            RiskLevel.High,
            "",
            "Justification"
        ));
    }

    [Fact]
    public void SetManualRiskLevel_ShouldThrowException_WhenJustificationEmpty()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => assessment.SetManualRiskLevel(
            RiskLevel.High,
            "assessor",
            ""
        ));
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetRiskLevel_WhenValid()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.High, "assessor", "Justification");

        // Assert
        Assert.Equal(RiskLevel.High, assessment.OverallRiskLevel);
        Assert.Equal(90m, assessment.RiskScore);
        Assert.Equal(RiskAssessmentStatus.Completed, assessment.Status);
        Assert.Equal("assessor", assessment.AssessedBy);
        Assert.NotNull(assessment.CompletedAt);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetCorrectScore_ForEachRiskLevel()
    {
        // Arrange
        var testCases = new[]
        {
            (RiskLevel.High, 90m),
            (RiskLevel.MediumHigh, 70m),
            (RiskLevel.Medium, 50m),
            (RiskLevel.MediumLow, 30m),
            (RiskLevel.Low, 10m),
            (RiskLevel.Unknown, 0m)
        };

        foreach (var (level, expectedScore) in testCases)
        {
            var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

            // Act
            assessment.SetManualRiskLevel(level, "assessor", "Justification");

            // Assert
            Assert.Equal(expectedScore, assessment.RiskScore);
        }
    }
}

