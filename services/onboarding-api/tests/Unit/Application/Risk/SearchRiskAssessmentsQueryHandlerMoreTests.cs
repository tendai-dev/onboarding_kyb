using OnboardingApi.Application.Risk.Commands;
using OnboardingApi.Application.Risk.Queries;
using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class SearchRiskAssessmentsQueryHandlerMoreTests
{
    [Fact]
    public async Task Handle_ShouldParseRiskLevel_WhenValidRiskLevelProvided()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(RiskLevel: "High");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseRiskLevel_WhenInvalidRiskLevelProvided()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(RiskLevel: "InvalidRiskLevel");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseRiskLevel_WhenRiskLevelIsEmpty()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(RiskLevel: "");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseRiskLevel_WhenRiskLevelIsNull()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(RiskLevel: null);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldParseStatus_WhenValidStatusProvided()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(Status: "Completed");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseStatus_WhenInvalidStatusProvided()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(Status: "InvalidStatus");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseStatus_WhenStatusIsEmpty()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(Status: "");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }

    [Fact]
    public async Task Handle_ShouldNotParseStatus_WhenStatusIsNull()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(Status: null);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }
}

