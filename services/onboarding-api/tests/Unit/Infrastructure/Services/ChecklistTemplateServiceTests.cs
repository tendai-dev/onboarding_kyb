using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Infrastructure.Services;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class ChecklistTemplateServiceTests
{
    [Fact]
    public async Task GetTemplatesAsync_ShouldReturnIndividualTemplates()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Individual);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, t => t.Code == "ID_VERIFY");
        Assert.Contains(result, t => t.Code == "ADDR_VERIFY");
        Assert.Contains(result, t => t.Code == "PEP_SCREEN");
        Assert.All(result, t => Assert.NotNull(t.Code));
        Assert.All(result, t => Assert.NotNull(t.Name));
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldReturnCorporateTemplates()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Corporate);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, t => t.Code == "CERT_INCORP");
        Assert.Contains(result, t => t.Code == "ARTICLES");
        Assert.Contains(result, t => t.Code == "UBO");
        Assert.Contains(result, t => t.Code == "FINANCIAL_STMT");
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldReturnTrustTemplates()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Trust);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, t => t.Code == "TRUST_DEED");
        Assert.Contains(result, t => t.Code == "TRUSTEE_ID");
        Assert.Contains(result, t => t.Code == "SETTLOR_ID");
        Assert.Contains(result, t => t.Code == "BENEFICIARY_DETAILS");
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldReturnPartnershipTemplates()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Partnership);

        // Assert
        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.Contains(result, t => t.Code == "PARTNERSHIP_AGREEMENT");
        Assert.Contains(result, t => t.Code == "PARTNERSHIP_REG");
        Assert.Contains(result, t => t.Code == "PARTNER_ID");
        Assert.Contains(result, t => t.Code == "PARTNERSHIP_CAPITAL");
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldThrow_WhenUnknownType()
    {
        // Arrange
        var service = new ChecklistTemplateService();
        var unknownType = (ChecklistType)999;

        // Act & Assert
        await Assert.ThrowsAsync<ArgumentException>(() => 
            service.GetTemplatesAsync(unknownType));
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldHaveOrderedTemplates()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Individual);

        // Assert
        var ordered = result.OrderBy(t => t.Order).ToList();
        Assert.Equal(result, ordered);
        Assert.All(result, t => Assert.True(t.Order > 0));
    }

    [Fact]
    public async Task GetTemplatesAsync_ShouldHaveRequiredFlags()
    {
        // Arrange
        var service = new ChecklistTemplateService();

        // Act
        var result = await service.GetTemplatesAsync(ChecklistType.Individual);

        // Assert
        var requiredCount = result.Count(t => t.IsRequired);
        Assert.True(requiredCount > 0);
        Assert.Contains(result, t => t.IsRequired);
    }
}
