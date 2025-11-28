using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.Risk.Aggregates;
using OnboardingApi.Domain.Risk.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Risk;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class RiskAssessmentRepositoryTests
{
    private readonly MockLogger<RiskAssessmentRepository> _logger;

    public RiskAssessmentRepositoryTests()
    {
        _logger = new MockLogger<RiskAssessmentRepository>();
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnRiskAssessment_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var assessment = RiskAssessment.Create("case123", "partner123");

        context.Set<RiskAssessment>().Add(assessment);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByIdAsync(assessment.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(assessment.Id, result.Id);
        Assert.Equal("case123", result.CaseId);
    }

    [Fact]
    public async Task GetByCaseIdAsync_ShouldReturnRiskAssessment_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var caseId = "case123";
        var assessment = RiskAssessment.Create(caseId, "partner123");

        context.Set<RiskAssessment>().Add(assessment);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByCaseIdAsync(caseId, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(caseId, result.CaseId);
    }

    [Fact]
    public async Task GetByPartnerIdAsync_ShouldReturnRiskAssessments()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var partnerId = "partner123";
        var assessment1 = RiskAssessment.Create("case1", partnerId);
        var assessment2 = RiskAssessment.Create("case2", partnerId);
        var assessment3 = RiskAssessment.Create("case3", "partner456");

        context.Set<RiskAssessment>().AddRange(assessment1, assessment2, assessment3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByPartnerIdAsync(partnerId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, a => Assert.Equal(partnerId, a.PartnerId));
    }

    [Fact]
    public async Task GetByRiskLevelAsync_ShouldReturnRiskAssessments()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var assessment1 = RiskAssessment.Create("case1", "partner123");
        assessment1.SetManualRiskLevel(RiskLevel.High, "reviewer123", "High risk justification");
        var assessment2 = RiskAssessment.Create("case2", "partner123");
        assessment2.SetManualRiskLevel(RiskLevel.High, "reviewer123", "High risk justification");
        var assessment3 = RiskAssessment.Create("case3", "partner123");
        assessment3.SetManualRiskLevel(RiskLevel.Low, "reviewer123", "Low risk justification");

        context.Set<RiskAssessment>().AddRange(assessment1, assessment2, assessment3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByRiskLevelAsync(RiskLevel.High, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, a => Assert.Equal(RiskLevel.High, a.OverallRiskLevel));
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByPartnerId()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var partnerId = "partner123";
        var assessment1 = RiskAssessment.Create("case1", partnerId);
        var assessment2 = RiskAssessment.Create("case2", "partner456");

        context.Set<RiskAssessment>().AddRange(assessment1, assessment2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.SearchAsync(partnerId: partnerId, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(partnerId, result[0].PartnerId);
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByRiskLevel()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var assessment1 = RiskAssessment.Create("case1", "partner123");
        assessment1.SetManualRiskLevel(RiskLevel.High, "reviewer123", "High risk justification");
        var assessment2 = RiskAssessment.Create("case2", "partner123");
        assessment2.SetManualRiskLevel(RiskLevel.Low, "reviewer123", "Low risk justification");

        context.Set<RiskAssessment>().AddRange(assessment1, assessment2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.SearchAsync(riskLevel: RiskLevel.High, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Equal(RiskLevel.High, result[0].OverallRiskLevel);
    }

    [Fact]
    public async Task SearchAsync_ShouldFilterByCaseId()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var caseId = "case123";
        var assessment1 = RiskAssessment.Create(caseId, "partner123");
        var assessment2 = RiskAssessment.Create("case456", "partner123");

        context.Set<RiskAssessment>().AddRange(assessment1, assessment2);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.SearchAsync(caseId: caseId, cancellationToken: CancellationToken.None);

        // Assert
        Assert.Single(result);
        Assert.Contains(caseId, result[0].CaseId);
    }

    [Fact]
    public async Task AddAsync_ShouldAddRiskAssessment()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var assessment = RiskAssessment.Create("case123", "partner123");

        // Act
        await repository.AddAsync(assessment, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(assessment.Id, CancellationToken.None);
        Assert.NotNull(result);
    }

    [Fact]
    public async Task UpdateAsync_ShouldUpdateRiskAssessment()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<RiskDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new RiskDbContext(options);
        var repository = new RiskAssessmentRepository(context, _logger);

        var assessment = RiskAssessment.Create("case123", "partner123");

        context.Set<RiskAssessment>().Add(assessment);
        await context.SaveChangesAsync();

        // Act
        assessment.CompleteAssessment("reviewer123");
        await repository.UpdateAsync(assessment, CancellationToken.None);
        await repository.SaveChangesAsync(CancellationToken.None);

        // Assert
        var result = await repository.GetByIdAsync(assessment.Id, CancellationToken.None);
        Assert.NotNull(result);
        Assert.Equal(RiskAssessmentStatus.Completed, result.Status);
    }
}

