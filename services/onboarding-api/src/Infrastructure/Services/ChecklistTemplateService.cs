using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;

namespace OnboardingApi.Infrastructure.Services;

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
            new() { Code = "ID_VERIFY", Name = "Identity Verification", Description = "Verify government-issued ID", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 1 },
            new() { Code = "ADDR_VERIFY", Name = "Address Verification", Description = "Verify residential address", Category = ChecklistItemCategory.Address, IsRequired = true, Order = 2 },
            new() { Code = "PHONE_VERIFY", Name = "Phone Verification", Description = "Verify phone number via SMS/call", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Code = "EMAIL_VERIFY", Name = "Email Verification", Description = "Verify email address", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 4 },
            new() { Code = "SELFIE_VERIFY", Name = "Selfie Verification", Description = "Liveness check with selfie", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 5 },
            new() { Code = "PEP_SCREEN", Name = "PEP Screening", Description = "Politically Exposed Person screening", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 6 },
            new() { Code = "SANCTIONS_SCREEN", Name = "Sanctions Screening", Description = "Check against sanctions lists", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 7 },
            new() { Code = "SOURCE_FUNDS", Name = "Source of Funds", Description = "Document source of funds", Category = ChecklistItemCategory.Financial, IsRequired = false, Order = 8 },
            new() { Code = "BANK_STMT", Name = "Bank Statement", Description = "Provide recent bank statement", Category = ChecklistItemCategory.Financial, IsRequired = false, Order = 9 },
            new() { Code = "TAX_INFO", Name = "Tax Information", Description = "Provide tax identification", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 10 }
        };
    }

    private static List<ChecklistItemTemplate> GetCorporateTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Code = "CERT_INCORP", Name = "Certificate of Incorporation", Description = "Provide certificate of incorporation", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Code = "ARTICLES", Name = "Articles of Association", Description = "Provide articles of association", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 2 },
            new() { Code = "SHAREHOLDER_REG", Name = "Shareholder Register", Description = "Provide current shareholder register", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 3 },
            new() { Code = "DIRECTOR_REG", Name = "Director Register", Description = "Provide current director register", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 4 },
            new() { Code = "UBO", Name = "Beneficial Ownership", Description = "Identify ultimate beneficial owners (>25%)", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 5 },
            new() { Code = "DIR_ID_VERIFY", Name = "Director ID Verification", Description = "Verify identity of all directors", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 6 },
            new() { Code = "UBO_ID_VERIFY", Name = "UBO ID Verification", Description = "Verify identity of beneficial owners", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 7 },
            new() { Code = "BUSINESS_LICENSE", Name = "Business License", Description = "Provide relevant business licenses", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 8 },
            new() { Code = "FINANCIAL_STMT", Name = "Financial Statements", Description = "Provide audited financial statements", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 9 },
            new() { Code = "BANK_ACCT", Name = "Bank Account Details", Description = "Provide corporate bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 10 },
            new() { Code = "CORP_PEP_SCREEN", Name = "Corporate PEP Screening", Description = "Screen directors and UBOs for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 11 },
            new() { Code = "CORP_SANCTIONS_SCREEN", Name = "Corporate Sanctions Screening", Description = "Screen entity and persons against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 12 },
            new() { Code = "TAX_REG", Name = "Tax Registration", Description = "Provide tax registration certificate", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 13 },
            new() { Code = "REG_OFFICE_ADDR", Name = "Registered Office Address", Description = "Verify registered office address", Category = ChecklistItemCategory.Address, IsRequired = true, Order = 14 },
            new() { Code = "BUSINESS_ACTIVITY", Name = "Business Activity Verification", Description = "Verify nature of business activities", Category = ChecklistItemCategory.Verification, IsRequired = true, Order = 15 }
        };
    }

    private static List<ChecklistItemTemplate> GetTrustTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Code = "TRUST_DEED", Name = "Trust Deed", Description = "Provide executed trust deed", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Code = "TRUSTEE_ID", Name = "Trustee Identification", Description = "Verify identity of all trustees", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 2 },
            new() { Code = "SETTLOR_ID", Name = "Settlor Identification", Description = "Verify identity of trust settlor", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Code = "BENEFICIARY_DETAILS", Name = "Beneficiary Details", Description = "Provide details of all beneficiaries", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 4 },
            new() { Code = "TRUST_REG", Name = "Trust Registration", Description = "Provide trust registration certificate", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 5 },
            new() { Code = "TRUST_ASSETS_SOURCE", Name = "Source of Trust Assets", Description = "Document source of trust assets", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 6 },
            new() { Code = "TRUST_BANK_ACCT", Name = "Trust Bank Account", Description = "Provide trust bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 7 },
            new() { Code = "TRUSTEE_PEP_SCREEN", Name = "Trustee PEP Screening", Description = "Screen trustees for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 8 },
            new() { Code = "TRUST_SANCTIONS_SCREEN", Name = "Trust Sanctions Screening", Description = "Screen trust parties against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 9 },
            new() { Code = "TRUST_PURPOSE", Name = "Trust Purpose", Description = "Document purpose and objectives of trust", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 10 }
        };
    }

    private static List<ChecklistItemTemplate> GetPartnershipTemplates()
    {
        return new List<ChecklistItemTemplate>
        {
            new() { Code = "PARTNERSHIP_AGREEMENT", Name = "Partnership Agreement", Description = "Provide executed partnership agreement", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 1 },
            new() { Code = "PARTNERSHIP_REG", Name = "Partnership Registration", Description = "Provide partnership registration certificate", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 2 },
            new() { Code = "PARTNER_ID", Name = "Partner Identification", Description = "Verify identity of all partners", Category = ChecklistItemCategory.Identity, IsRequired = true, Order = 3 },
            new() { Code = "PARTNERSHIP_CAPITAL", Name = "Partnership Capital", Description = "Document partnership capital contributions", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 4 },
            new() { Code = "MGMT_STRUCTURE", Name = "Management Structure", Description = "Document partnership management structure", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 5 },
            new() { Code = "PARTNERSHIP_LICENSE", Name = "Business License", Description = "Provide relevant business licenses", Category = ChecklistItemCategory.Documentation, IsRequired = true, Order = 6 },
            new() { Code = "PARTNERSHIP_BANK_ACCT", Name = "Partnership Bank Account", Description = "Provide partnership bank account details", Category = ChecklistItemCategory.Financial, IsRequired = true, Order = 7 },
            new() { Code = "PARTNER_PEP_SCREEN", Name = "Partner PEP Screening", Description = "Screen all partners for PEP status", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 8 },
            new() { Code = "PARTNERSHIP_SANCTIONS_SCREEN", Name = "Partnership Sanctions Screening", Description = "Screen partnership and partners against sanctions", Category = ChecklistItemCategory.Risk, IsRequired = true, Order = 9 },
            new() { Code = "PARTNERSHIP_TAX_REG", Name = "Tax Registration", Description = "Provide partnership tax registration", Category = ChecklistItemCategory.Compliance, IsRequired = true, Order = 10 }
        };
    }
}

