using ChecklistService.Application.Interfaces;
using ChecklistService.Domain.ValueObjects;

namespace ChecklistService.Infrastructure.Services;

public class ChecklistTemplateService : IChecklistTemplateService
{
    public Task<List<ChecklistItemTemplate>> GetTemplatesAsync(ChecklistType type, CancellationToken cancellationToken = default)
    {
        var templates = type switch
        {
            ChecklistType.Individual => GetIndividualTemplates(),
            ChecklistType.Corporate => GetCorporateTemplates(),
            ChecklistType.Trust => GetTrustTemplates(),
            ChecklistType.Partnership => GetPartnershipTemplates(),
            _ => throw new ArgumentException($"Unknown checklist type: {type}")
        };

        return Task.FromResult(templates);
    }

    private static List<ChecklistItemTemplate> GetIndividualTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Name = "Identity Verification", Description = "Verify government-issued ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new() { Name = "Address Verification", Description = "Verify residential address", Category = ChecklistItemCategory.Address, IsRequired = true, Order = 2 },
            new() { Name = "Phone Verification", Description = "Verify phone number via SMS/call", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Name = "Email Verification", Description = "Verify email address", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 4 },
            new() { Name = "Selfie Verification", Description = "Liveness check with selfie", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 5 },
            new() { Name = "PEP Screening", Description = "Politically Exposed Person screening", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 6 },
            new() { Name = "Sanctions Screening", Description = "Check against sanctions lists", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 7 },
            new() { Name = "Source of Funds", Description = "Document source of funds", Category = ChecklistItemCategory.Financial, IsRequired = false, Order = 8 },
            new() { Name = "Bank Statement", Description = "Provide recent bank statement", Category = ChecklistItemCategory.Financial, IsRequired = false, Order = 9 },
            new() { Name = "Tax Information", Description = "Provide tax identification", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 10 }
        };
    }

    private static List<ChecklistItemTemplate> GetCorporateTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Name = "Certificate of Incorporation", Description = "Provide certificate of incorporation", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Name = "Articles of Association", Description = "Provide articles of association", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 2 },
            new() { Name = "Shareholder Register", Description = "Provide current shareholder register", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 3 },
            new() { Name = "Director Register", Description = "Provide current director register", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 4 },
            new() { Name = "Beneficial Ownership", Description = "Identify ultimate beneficial owners (>25%)", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 5 },
            new() { Name = "Director ID Verification", Description = "Verify identity of all directors", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 6 },
            new() { Name = "UBO ID Verification", Description = "Verify identity of beneficial owners", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 7 },
            new() { Name = "Business License", Description = "Provide relevant business licenses", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 8 },
            new() { Name = "Financial Statements", Description = "Provide audited financial statements", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 9 },
            new() { Name = "Bank Account Details", Description = "Provide corporate bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 10 },
            new() { Name = "Corporate PEP Screening", Description = "Screen directors and UBOs for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 11 },
            new() { Name = "Corporate Sanctions Screening", Description = "Screen entity and persons against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 12 },
            new() { Name = "Tax Registration", Description = "Provide tax registration certificate", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 13 },
            new() { Name = "Registered Office Address", Description = "Verify registered office address", Category = ChecklistItemCategory.Address, IsRequired = true, Order = 14 },
            new() { Name = "Business Activity Verification", Description = "Verify nature of business activities", Category = ChecklistItemCategory.Verification, IsRequired = true, Order = 15 }
        };
    }

    private static List<ChecklistItemTemplate> GetTrustTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Name = "Trust Deed", Description = "Provide executed trust deed", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Name = "Trustee Identification", Description = "Verify identity of all trustees", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 },
            new() { Name = "Settlor Identification", Description = "Verify identity of trust settlor", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Name = "Beneficiary Details", Description = "Provide details of all beneficiaries", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 4 },
            new() { Name = "Trust Registration", Description = "Provide trust registration certificate", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 5 },
            new() { Name = "Source of Trust Assets", Description = "Document source of trust assets", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 6 },
            new() { Name = "Trust Bank Account", Description = "Provide trust bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 7 },
            new() { Name = "Trustee PEP Screening", Description = "Screen trustees for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 8 },
            new() { Name = "Trust Sanctions Screening", Description = "Screen trust parties against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 9 },
            new() { Name = "Trust Purpose", Description = "Document purpose and objectives of trust", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 10 }
        };
    }

    private static List<ChecklistItemTemplate> GetPartnershipTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Name = "Partnership Agreement", Description = "Provide executed partnership agreement", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Name = "Partnership Registration", Description = "Provide partnership registration certificate", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 2 },
            new() { Name = "Partner Identification", Description = "Verify identity of all partners", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Name = "Partnership Capital", Description = "Document partnership capital contributions", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 4 },
            new() { Name = "Management Structure", Description = "Document partnership management structure", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 5 },
            new() { Name = "Business License", Description = "Provide relevant business licenses", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 6 },
            new() { Name = "Partnership Bank Account", Description = "Provide partnership bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 7 },
            new() { Name = "Partner PEP Screening", Description = "Screen all partners for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 8 },
            new() { Name = "Partnership Sanctions Screening", Description = "Screen partnership and partners against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 9 },
            new() { Name = "Tax Registration", Description = "Provide partnership tax registration", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 10 }
        };
    }
}
