using Microsoft.EntityFrameworkCore;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Repositories;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class OnboardingCaseRepositoryEdgeCaseTests
{
    [Fact]
    public async Task GetByCaseNumberAsync_ShouldBeCaseInsensitive()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var applicant = CreateCompleteApplicant();
        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            null,
            "creator");

        context.Set<OnboardingCase>().Add(onboardingCase);
        await context.SaveChangesAsync();

        // Act - Search with different case
        var result = await repository.GetByCaseNumberAsync(onboardingCase.CaseNumber.ToUpper());

        // Assert
        Assert.NotNull(result);
        Assert.Equal(onboardingCase.CaseNumber, result.CaseNumber);
    }

    [Fact]
    public async Task GetByPartnerIdWithFiltersAsync_ShouldFilterByStatus()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var partnerId = Guid.NewGuid();
        var applicant = CreateCompleteApplicant();

        var case1 = OnboardingCase.Create(OnboardingType.Individual, partnerId, "PART-123", applicant, null, "creator");
        var case2 = OnboardingCase.Create(OnboardingType.Individual, partnerId, "PART-124", applicant, null, "creator");
        case2.Submit("user1");

        context.Set<OnboardingCase>().AddRange(case1, case2);
        await context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await repository.GetByPartnerIdWithFiltersAsync(
            partnerId,
            limit: 10,
            offset: 0,
            status: "Submitted");

        // Assert
        Assert.Equal(1, totalCount);
        Assert.Single(items);
        Assert.Equal(case2.Id, items.First().Id);
    }

    [Fact]
    public async Task GetByPartnerIdWithFiltersAsync_ShouldApplyPagination()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var partnerId = Guid.NewGuid();
        var applicant = CreateCompleteApplicant();

        var cases = Enumerable.Range(1, 5)
            .Select(i => OnboardingCase.Create(OnboardingType.Individual, partnerId, $"PART-{i}", applicant, null, "creator"))
            .ToList();

        context.Set<OnboardingCase>().AddRange(cases);
        await context.SaveChangesAsync();

        // Act
        var (items, totalCount) = await repository.GetByPartnerIdWithFiltersAsync(
            partnerId,
            limit: 2,
            offset: 1);

        // Assert
        Assert.Equal(5, totalCount);
        Assert.Equal(2, items.Count());
    }

    [Fact]
    public async Task GetByPartnerIdWithFiltersAsync_ShouldIgnoreInvalidStatus()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var partnerId = Guid.NewGuid();
        var applicant = CreateCompleteApplicant();

        var case1 = OnboardingCase.Create(OnboardingType.Individual, partnerId, "PART-123", applicant, null, "creator");

        context.Set<OnboardingCase>().Add(case1);
        await context.SaveChangesAsync();

        // Act - Invalid status enum value
        var (items, totalCount) = await repository.GetByPartnerIdWithFiltersAsync(
            partnerId,
            limit: 10,
            offset: 0,
            status: "InvalidStatus");

        // Assert - Should return all cases since invalid status is ignored
        Assert.Equal(1, totalCount);
        Assert.Single(items);
    }

    [Fact]
    public async Task Update_ShouldMarkEntityAsModified()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var applicant = CreateCompleteApplicant();
        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            null,
            "creator");

        context.Set<OnboardingCase>().Add(onboardingCase);
        await context.SaveChangesAsync();

        // Act
        repository.Update(onboardingCase);

        // Assert
        var entry = context.Entry(onboardingCase);
        Assert.Equal(EntityState.Modified, entry.State);
    }

    [Fact]
    public async Task Delete_ShouldRemoveCase()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var applicant = CreateCompleteApplicant();
        var onboardingCase = OnboardingCase.Create(
            OnboardingType.Individual,
            Guid.NewGuid(),
            "PART-123",
            applicant,
            null,
            "creator");

        context.Set<OnboardingCase>().Add(onboardingCase);
        await context.SaveChangesAsync();

        // Act
        repository.Delete(onboardingCase);
        await context.SaveChangesAsync();

        // Assert
        var result = await repository.GetByIdAsync(onboardingCase.Id);
        Assert.Null(result);
    }

    private static ApplicantDetails CreateCompleteApplicant()
    {
        return new ApplicantDetails
        {
            FirstName = "John",
            LastName = "Doe",
            DateOfBirth = new DateTime(1990, 1, 1),
            Email = "john@example.com",
            PhoneNumber = "+1234567890",
            ResidentialAddress = new Address
            {
                Street = "123 Main St",
                City = "New York",
                State = "NY",
                PostalCode = "10001",
                Country = "US"
            },
            Nationality = "US"
        };
    }
}

