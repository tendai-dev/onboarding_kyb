using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.Events;
using OnboardingApi.Domain.Risk.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.Risk;

public class RiskAssessmentEdgeCaseTests
{
    [Fact]
    public void UpdateRiskFactor_ShouldThrow_WhenFactorNotFound()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        var nonExistentFactorId = RiskFactorId.New();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => 
            assessment.UpdateRiskFactor(nonExistentFactorId, RiskLevel.Medium, 50m, "Updated"));
    }

    [Fact]
    public void UpdateRiskFactor_ShouldUpdateFactor_WhenFound()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        assessment.AddRiskFactor(RiskFactorType.PEP, RiskLevel.Low, 20m, "Initial");
        var factorId = assessment.Factors.First().Id;

        // Act
        assessment.UpdateRiskFactor(factorId, RiskLevel.High, 80m, "Updated description");

        // Assert
        var updatedFactor = assessment.Factors.First();
        Assert.Equal(RiskLevel.High, updatedFactor.Level);
        Assert.Equal(80m, updatedFactor.Score);
        Assert.Equal("Updated description", updatedFactor.Description);
        Assert.Single(assessment.DomainEvents.OfType<RiskFactorUpdatedEvent>());
    }

    [Fact]
    public void SetManualRiskLevel_ShouldThrow_WhenAssessedByIsEmpty()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            assessment.SetManualRiskLevel(RiskLevel.High, "", "Justification"));
    }

    [Fact]
    public void SetManualRiskLevel_ShouldThrow_WhenJustificationIsEmpty()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => 
            assessment.SetManualRiskLevel(RiskLevel.High, "assessor", ""));
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForHigh()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.High, "assessor", "High risk justification");

        // Assert
        Assert.Equal(RiskLevel.High, assessment.OverallRiskLevel);
        Assert.Equal(90m, assessment.RiskScore);
        Assert.Equal(RiskAssessmentStatus.Completed, assessment.Status);
        Assert.NotNull(assessment.CompletedAt);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForMediumHigh()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.MediumHigh, "assessor", "Medium high justification");

        // Assert
        Assert.Equal(RiskLevel.MediumHigh, assessment.OverallRiskLevel);
        Assert.Equal(70m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForMedium()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Medium, "assessor", "Medium justification");

        // Assert
        Assert.Equal(RiskLevel.Medium, assessment.OverallRiskLevel);
        Assert.Equal(50m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForMediumLow()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.MediumLow, "assessor", "Medium low justification");

        // Assert
        Assert.Equal(RiskLevel.MediumLow, assessment.OverallRiskLevel);
        Assert.Equal(30m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForLow()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Low, "assessor", "Low justification");

        // Assert
        Assert.Equal(RiskLevel.Low, assessment.OverallRiskLevel);
        Assert.Equal(10m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldSetScoreForUnknown()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");

        // Act
        assessment.SetManualRiskLevel(RiskLevel.Unknown, "assessor", "Unknown justification");

        // Assert
        Assert.Equal(RiskLevel.Unknown, assessment.OverallRiskLevel);
        Assert.Equal(0m, assessment.RiskScore);
    }

    [Fact]
    public void SetManualRiskLevel_ShouldRaiseEvent_WithPreviousLevel()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        var previousLevel = assessment.OverallRiskLevel;

        // Act
        assessment.SetManualRiskLevel(RiskLevel.High, "assessor", "Justification");

        // Assert
        var events = assessment.DomainEvents.OfType<RiskLevelManuallySetEvent>().ToList();
        Assert.Single(events);
        Assert.Equal(previousLevel.ToString(), events[0].PreviousLevel);
        Assert.Equal(RiskLevel.High.ToString(), events[0].NewLevel);
    }

    [Fact]
    public void CompleteAssessment_ShouldDoNothing_WhenAlreadyCompleted()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        assessment.CompleteAssessment("assessor1", "Notes 1");
        var originalCompletedAt = assessment.CompletedAt;
        var originalAssessedBy = assessment.AssessedBy;

        // Act
        assessment.CompleteAssessment("assessor2", "Notes 2");

        // Assert
        Assert.Equal(originalCompletedAt, assessment.CompletedAt);
        Assert.Equal(originalAssessedBy, assessment.AssessedBy);
    }

    [Fact]
    public void UpdateNotes_ShouldUpdateNotes_WithoutChangingStatus()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        var originalStatus = assessment.Status;
        var originalCompletedAt = assessment.CompletedAt;

        // Act
        assessment.UpdateNotes("Draft notes");

        // Assert
        Assert.Equal("Draft notes", assessment.Notes);
        Assert.Equal(originalStatus, assessment.Status);
        Assert.Equal(originalCompletedAt, assessment.CompletedAt);
    }

    [Fact]
    public void UpdateNotes_ShouldClearNotes_WhenNull()
    {
        // Arrange
        var assessment = RiskAssessment.Create("CASE-123", "PARTNER-456");
        assessment.UpdateNotes("Some notes");

        // Act
        assessment.UpdateNotes(null);

        // Assert
        Assert.Null(assessment.Notes);
    }
}

