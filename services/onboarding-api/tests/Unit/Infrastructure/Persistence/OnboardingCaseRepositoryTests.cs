using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using OnboardingApi.Infrastructure.Persistence;
using OnboardingApi.Infrastructure.Persistence.Repositories;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Persistence;

public class OnboardingCaseRepositoryTests
{
    [Fact]
    public async Task GetByIdAsync_ShouldReturnCase_WhenExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        var applicant = new ApplicantDetails
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
        var result = await repository.GetByIdAsync(onboardingCase.Id, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(onboardingCase.Id, result.Id);
        Assert.Equal(onboardingCase.CaseNumber, result.CaseNumber);
    }

    [Fact]
    public async Task GetByIdAsync_ShouldReturnNull_WhenNotExists()
    {
        // Arrange
        var options = new DbContextOptionsBuilder<OnboardingDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        using var context = new OnboardingDbContext(options);
        var repository = new OnboardingCaseRepository(context);

        // Act
        var result = await repository.GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task GetByCaseNumberAsync_ShouldReturnCase_WhenExists()
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
        var result = await repository.GetByCaseNumberAsync(onboardingCase.CaseNumber, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(onboardingCase.CaseNumber, result.CaseNumber);
    }

    [Fact]
    public async Task GetByPartnerIdAsync_ShouldReturnCases_WhenExists()
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
        var case3 = OnboardingCase.Create(OnboardingType.Individual, Guid.NewGuid(), "PART-125", applicant, null, "creator");

        context.Set<OnboardingCase>().AddRange(case1, case2, case3);
        await context.SaveChangesAsync();

        // Act
        var result = await repository.GetByPartnerIdAsync(partnerId, CancellationToken.None);

        // Assert
        Assert.Equal(2, result.Count());
        Assert.All(result, c => Assert.Equal(partnerId, c.PartnerId));
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

