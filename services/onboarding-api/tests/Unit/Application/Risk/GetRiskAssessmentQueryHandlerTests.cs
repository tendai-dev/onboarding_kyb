using OnboardingApi.Application.Risk.Interfaces;
using OnboardingApi.Application.Risk.Queries;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Risk;

public class GetRiskAssessmentQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRiskAssessmentDto_WhenAssessmentExists()
    {
        // Arrange
        var assessment = RiskAssessment.Create("case123", "partner456");
        var assessmentId = assessment.Id.Value;
        assessment.AddRiskFactor(RiskFactorType.Sanctions, RiskLevel.Medium, 50m, "Test factor");
        
        var repository = new MockRiskAssessmentRepository();
        repository.SetupGetById(assessment.Id, assessment);
        
        var handler = new GetRiskAssessmentQueryHandler(repository);
        var query = new GetRiskAssessmentQuery(assessmentId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(assessmentId, result.Id);
        Assert.Equal("case123", result.CaseId);
        Assert.Equal("partner456", result.PartnerId);
        Assert.Single(result.Factors);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenAssessmentNotFound()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var repository = new MockRiskAssessmentRepository();
        var handler = new GetRiskAssessmentQueryHandler(repository);
        var query = new GetRiskAssessmentQuery(assessmentId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class GetRiskAssessmentByCaseQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRiskAssessmentDto_WhenAssessmentExists()
    {
        // Arrange
        var caseId = "case123";
        var assessment = RiskAssessment.Create(caseId, "partner456");
        
        var repository = new MockRiskAssessmentRepository();
        repository.SetupGetByCaseId(caseId, assessment);
        
        var handler = new GetRiskAssessmentByCaseQueryHandler(repository);
        var query = new GetRiskAssessmentByCaseQuery(caseId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(caseId, result.CaseId);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenAssessmentNotFound()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new GetRiskAssessmentByCaseQueryHandler(repository);
        var query = new GetRiskAssessmentByCaseQuery("nonexistent");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}

public class SearchRiskAssessmentsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnFilteredAssessments_WhenFiltersProvided()
    {
        // Arrange
        var assessment1 = RiskAssessment.Create("case1", "partner1");
        assessment1.SetManualRiskLevel(RiskLevel.High, "admin", "Justification");
        
        var assessment2 = RiskAssessment.Create("case2", "partner1");
        assessment2.SetManualRiskLevel(RiskLevel.Low, "admin", "Justification");
        
        var repository = new MockRiskAssessmentRepository();
        repository.SetupSearch("partner1", null, null, null, new List<RiskAssessment> { assessment1, assessment2 });
        
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(PartnerId: "partner1");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task Handle_ShouldParseRiskLevelEnum_WhenValid()
    {
        // Arrange
        var assessment = RiskAssessment.Create("case1", "partner1");
        assessment.SetManualRiskLevel(RiskLevel.High, "admin", "Justification");
        
        var repository = new MockRiskAssessmentRepository();
        repository.SetupSearch(null, RiskLevel.High, null, null, new List<RiskAssessment> { assessment });
        
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(RiskLevel: "High");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Single(result);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoMatches()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        repository.SetupSearch("nonexistent", null, null, null, new List<RiskAssessment>());
        
        var handler = new SearchRiskAssessmentsQueryHandler(repository);
        var query = new SearchRiskAssessmentsQuery(PartnerId: "nonexistent");

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Empty(result);
    }
}

public class GetRiskFactorsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ShouldReturnRiskFactors_WhenAssessmentExists()
    {
        // Arrange
        var assessmentId = Guid.NewGuid();
        var riskAssessmentId = RiskAssessmentId.From(assessmentId);
        var assessment = RiskAssessment.Create("case123", "partner456");
        assessment.AddRiskFactor(RiskFactorType.Sanctions, RiskLevel.High, 75m, "Factor 1");
        assessment.AddRiskFactor(RiskFactorType.PEP, RiskLevel.Medium, 50m, "Factor 2");
        
        var repository = new MockRiskAssessmentRepository();
        repository.SetupGetById(riskAssessmentId, assessment);
        
        var handler = new GetRiskFactorsQueryHandler(repository);
        var query = new GetRiskFactorsQuery(assessmentId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Equal("Sanctions", result[0].Type);
        Assert.Equal("High", result[0].Level);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenAssessmentNotFound()
    {
        // Arrange
        var repository = new MockRiskAssessmentRepository();
        var handler = new GetRiskFactorsQueryHandler(repository);
        var query = new GetRiskFactorsQuery(Guid.NewGuid());

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}

