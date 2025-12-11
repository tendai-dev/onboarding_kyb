using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Projections.ReadModels;
using OnboardingApi.Infrastructure.Persistence.Projections;
using OnboardingApi.Tests.Unit.TestHelpers;
using System;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class ProjectionRepositoryTests : IDisposable
{
    private readonly ProjectionsDbContext _context;
    private readonly ProjectionRepository _repository;
    private readonly MockLogger<ProjectionRepository> _logger;

    public ProjectionRepositoryTests()
    {
        var options = new DbContextOptionsBuilder<ProjectionsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _logger = new MockLogger<ProjectionRepository>();
        _context = new ProjectionsDbContext(options);
        _repository = new ProjectionRepository(_context, _logger);
    }

    [Fact]
    public async Task GetOnboardingCaseAsync_ShouldReturnCase_WhenExists()
    {
        // Arrange
        var projection = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-123",
            Status = "InProgress",
            PartnerId = "partner-123"
        };

        await _context.OnboardingCases.AddAsync(projection);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCaseAsync("CASE-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("CASE-123", result!.CaseId);
    }

    [Fact]
    public async Task GetOnboardingCaseAsync_ShouldReturnNull_WhenNotExists()
    {
        // Act
        var result = await _repository.GetOnboardingCaseAsync("NON-EXISTENT");

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByPartnerId()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-456",
            Status = "InProgress"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(partnerId: "partner-123");

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CASE-1", result.Items[0].CaseId);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByStatus()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "Approved"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "Rejected"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(status: "Approved");

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("Approved", result.Items[0].Status);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldRespectPagination()
    {
        // Arrange
        var projections = Enumerable.Range(1, 10).Select(i => new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = $"CASE-{i}",
            PartnerId = "partner-123",
            Status = "InProgress"
        }).ToList();

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(skip: 2, take: 3);

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(10, result.TotalCount);
        Assert.Equal(2, result.Skip);
        Assert.Equal(3, result.Take);
    }

    [Fact]
    public async Task GetCasesByPartnerAsync_ShouldReturnCases_ForPartner()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetCasesByPartnerAsync("partner-123");

        // Assert
        Assert.Equal(2, result.Count);
        Assert.All(result, c => Assert.Equal("partner-123", c.PartnerId));
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateStatistics()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", Status = "InProgress", PartnerId = "partner-123", CreatedAt = DateTime.UtcNow },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", Status = "Approved", PartnerId = "partner-123", CreatedAt = DateTime.UtcNow },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", Status = "Rejected", PartnerId = "partner-123", CreatedAt = DateTime.UtcNow }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Cases.TotalCases);
        Assert.Equal(1, result.Cases.CompletedCases);
        Assert.Equal(1, result.Cases.RejectedCases);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByRiskLevel()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            RiskLevel = "High"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            RiskLevel = "Low"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(riskLevel: "High");

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("High", result.Items[0].RiskLevel);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterBySearchTerm()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            ApplicantFirstName = "John",
            ApplicantLastName = "Doe",
            ApplicantEmail = "john.doe@example.com"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            ApplicantFirstName = "Jane",
            ApplicantLastName = "Smith",
            ApplicantEmail = "jane.smith@example.com"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(searchTerm: "John");

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("John", result.Items[0].ApplicantFirstName);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByCaseId()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "caseid", sortDirection: "asc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("CASE-1", result.Items[0].CaseId);
        Assert.Equal("CASE-2", result.Items[1].CaseId);
        Assert.Equal("CASE-3", result.Items[2].CaseId);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByCreatedAtDescending()
    {
        // Arrange
        var baseDate = DateTime.UtcNow;
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", CreatedAt = baseDate.AddDays(-2) },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", CreatedAt = baseDate },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", CreatedAt = baseDate.AddDays(-1) }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "createdat", sortDirection: "desc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("CASE-2", result.Items[0].CaseId); // Most recent first
    }

    [Fact]
    public async Task GetCasesRequiringAttentionAsync_ShouldReturnCasesRequiringAttention()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", RequiresManualReview = true },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", RiskLevel = "High" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", HasComplianceIssues = true },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-4", PartnerId = "partner-123", Status = "Approved" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetCasesRequiringAttentionAsync("partner-123");

        // Assert
        Assert.True(result.Count >= 3); // At least 3 cases requiring attention
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateMetrics_WhenNoCases()
    {
        // Act
        var result = await _repository.GetDashboardAsync();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.Cases.TotalCases);
        Assert.Equal(0, result.Performance.AverageCompletionTimeHours);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculatePerformanceMetrics_WithCompletedCases()
    {
        // Arrange
        var baseDate = DateTime.UtcNow;
        var projections = new[]
        {
            new OnboardingCaseProjection 
            { 
                Id = Guid.NewGuid(), 
                CaseId = "CASE-1", 
                Status = "Approved", 
                PartnerId = "partner-123", 
                CreatedAt = baseDate.AddDays(-5),
                ApprovedAt = baseDate.AddDays(-2)
            },
            new OnboardingCaseProjection 
            { 
                Id = Guid.NewGuid(), 
                CaseId = "CASE-2", 
                Status = "Approved", 
                PartnerId = "partner-123", 
                CreatedAt = baseDate.AddDays(-10),
                ApprovedAt = baseDate.AddDays(-5)
            },
            new OnboardingCaseProjection 
            { 
                Id = Guid.NewGuid(), 
                CaseId = "CASE-3", 
                Status = "Rejected", 
                PartnerId = "partner-123", 
                CreatedAt = baseDate.AddDays(-3)
            }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Performance.AverageCompletionTimeHours > 0);
        Assert.True(result.Performance.ApprovalRate > 0);
        Assert.True(result.Performance.CompletionRate > 0);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateRiskMetrics()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", Status = "InProgress", PartnerId = "partner-123", RiskLevel = "High", RiskScore = 80 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", Status = "InProgress", PartnerId = "partner-123", RiskLevel = "Medium", RiskScore = 50 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", Status = "InProgress", PartnerId = "partner-123", RiskLevel = "Low", RiskScore = 20 }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Risk.HighRiskCases);
        Assert.Equal(1, result.Risk.MediumRiskCases);
        Assert.Equal(1, result.Risk.LowRiskCases);
        Assert.True(result.Risk.AverageRiskScore > 0);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateComplianceMetrics()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection 
            { 
                Id = Guid.NewGuid(), 
                CaseId = "CASE-1", 
                Status = "InProgress", 
                PartnerId = "partner-123",
                PendingDocumentCount = 2,
                VerifiedDocumentCount = 3,
                RejectedDocumentCount = 1
            },
            new OnboardingCaseProjection 
            { 
                Id = Guid.NewGuid(), 
                CaseId = "CASE-2", 
                Status = "InProgress", 
                PartnerId = "partner-123",
                PendingDocumentCount = 1,
                VerifiedDocumentCount = 5,
                RejectedDocumentCount = 0
            }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Compliance.DocumentsAwaitingVerification);
        Assert.Equal(8, result.Compliance.DocumentsVerified);
        Assert.Equal(1, result.Compliance.DocumentsRejected);
        Assert.True(result.Compliance.DocumentVerificationRate > 0);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateCaseTypeStatistics()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", Status = "InProgress", PartnerId = "partner-123", Type = "Individual" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", Status = "InProgress", PartnerId = "partner-123", Type = "Corporate" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", Status = "InProgress", PartnerId = "partner-123", Type = "Trust" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-4", Status = "InProgress", PartnerId = "partner-123", Type = "Partnership" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.Cases.IndividualCases);
        Assert.Equal(1, result.Cases.CorporateCases);
        Assert.Equal(1, result.Cases.TrustCases);
        Assert.Equal(1, result.Cases.PartnershipCases);
    }

    [Fact]
    public async Task GetDashboardAsync_ShouldCalculateGrowthPercentages()
    {
        // Arrange
        var currentMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
        var lastMonth = currentMonth.AddMonths(-1);
        
        var projections = new[]
        {
            // Current month cases
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", Status = "InProgress", PartnerId = "partner-123", CreatedAt = currentMonth.AddDays(5) },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", Status = "Approved", PartnerId = "partner-123", CreatedAt = currentMonth.AddDays(10), ApprovedAt = currentMonth.AddDays(12) },
            // Last month cases
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", Status = "InProgress", PartnerId = "partner-123", CreatedAt = lastMonth.AddDays(5) },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-4", Status = "Approved", PartnerId = "partner-123", CreatedAt = lastMonth.AddDays(10), ApprovedAt = lastMonth.AddDays(15) }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetDashboardAsync("partner-123");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Cases.NewCasesThisMonth);
        Assert.Equal(2, result.Cases.NewCasesLastMonth);
        Assert.Equal(1, result.Cases.CompletedCasesThisMonth);
        Assert.Equal(1, result.Cases.CompletedCasesLastMonth);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByDateRange()
    {
        // Arrange
        var baseDate = DateTime.UtcNow;
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            CreatedAt = baseDate.AddDays(-5)
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            CreatedAt = baseDate.AddDays(-1)
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(
            fromDate: baseDate.AddDays(-3),
            toDate: baseDate);

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CASE-2", result.Items[0].CaseId);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByAssignedTo()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            AssignedTo = "user-123"
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            AssignedTo = "user-456"
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(assignedTo: "user-123");

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("user-123", result.Items[0].AssignedTo);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByRequiresManualReview()
    {
        // Arrange
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            RequiresManualReview = true
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            RequiresManualReview = false
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(requiresManualReview: true);

        // Assert
        Assert.Single(result.Items);
        Assert.True(result.Items[0].RequiresManualReview);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldFilterByIsOverdue()
    {
        // Arrange
        var oldDate = DateTime.UtcNow.AddDays(-35);
        var projection1 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-1",
            PartnerId = "partner-123",
            Status = "InProgress",
            CreatedAt = oldDate
        };

        var projection2 = new OnboardingCaseProjection
        {
            Id = Guid.NewGuid(),
            CaseId = "CASE-2",
            PartnerId = "partner-123",
            Status = "InProgress",
            CreatedAt = DateTime.UtcNow.AddDays(-10)
        };

        await _context.OnboardingCases.AddRangeAsync(projection1, projection2);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(isOverdue: true);

        // Assert
        Assert.Single(result.Items);
        Assert.Equal("CASE-1", result.Items[0].CaseId);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByStatus()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "Rejected" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "Approved" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "status", sortDirection: "asc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("Approved", result.Items[0].Status);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByRiskLevel()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", RiskLevel = "High" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", RiskLevel = "Low" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", RiskLevel = "Medium" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "risklevel", sortDirection: "desc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        // String sorting is alphabetical: "High" > "Medium" > "Low" (descending)
        Assert.Equal("Medium", result.Items[0].RiskLevel); // Alphabetically first in descending order
        Assert.Contains(result.Items, c => c.RiskLevel == "High");
        Assert.Contains(result.Items, c => c.RiskLevel == "Low");
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByRiskScore()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", RiskScore = 50 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", RiskScore = 80 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", RiskScore = 30 }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "riskscore", sortDirection: "desc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(80, result.Items[0].RiskScore);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByUpdatedAt()
    {
        // Arrange
        var baseDate = DateTime.UtcNow;
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", UpdatedAt = baseDate.AddDays(-2) },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", UpdatedAt = baseDate },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", UpdatedAt = baseDate.AddDays(-1) }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "updatedat", sortDirection: "desc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("CASE-2", result.Items[0].CaseId);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByProgress()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", ProgressPercentage = 30 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", ProgressPercentage = 80 },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", ProgressPercentage = 50 }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "progress", sortDirection: "asc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal(30, result.Items[0].ProgressPercentage);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldSortByApplicantName()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", ApplicantLastName = "Smith", ApplicantFirstName = "Jane" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", ApplicantLastName = "Doe", ApplicantFirstName = "John" },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-3", PartnerId = "partner-123", Status = "InProgress", ApplicantLastName = "Brown", ApplicantFirstName = "Alice" }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: "applicantname", sortDirection: "asc");

        // Assert
        Assert.Equal(3, result.Items.Count);
        Assert.Equal("Brown", result.Items[0].ApplicantLastName);
    }

    [Fact]
    public async Task GetOnboardingCasesAsync_ShouldUseDefaultSort_WhenSortByIsNull()
    {
        // Arrange
        var projections = new[]
        {
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-1", PartnerId = "partner-123", Status = "InProgress", UpdatedAt = DateTime.UtcNow.AddDays(-1) },
            new OnboardingCaseProjection { Id = Guid.NewGuid(), CaseId = "CASE-2", PartnerId = "partner-123", Status = "InProgress", UpdatedAt = DateTime.UtcNow }
        };

        await _context.OnboardingCases.AddRangeAsync(projections);
        await _context.SaveChangesAsync();

        // Act
        var result = await _repository.GetOnboardingCasesAsync(sortBy: null);

        // Assert
        Assert.Equal(2, result.Items.Count);
        // Should default to UpdatedAt descending
        Assert.Equal("CASE-2", result.Items[0].CaseId);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}

