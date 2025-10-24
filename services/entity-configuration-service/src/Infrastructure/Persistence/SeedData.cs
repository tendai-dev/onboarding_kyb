using EntityConfigurationService.Domain.Aggregates;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace EntityConfigurationService.Infrastructure.Persistence;

/// <summary>
/// Seeds initial entity types and requirements based on Annexure A - Corporate Digital Onboarding Requirements
/// </summary>
public static class SeedData
{
    public static async Task SeedAsync(EntityConfigurationDbContext context, ILogger logger)
    {
        // Check if already seeded
        if (await context.EntityTypes.AnyAsync())
        {
            logger.LogInformation("Database already seeded");
            return;
        }

        logger.LogInformation("Seeding entity configuration data...");

        // Create Requirements based on Annexure A
        var requirements = CreateRequirements();
        foreach (var req in requirements)
        {
            await context.Requirements.AddAsync(req);
        }
        await context.SaveChangesAsync();

        // Create Entity Types and map requirements
        var entityTypes = CreateEntityTypes();
        foreach (var entityType in entityTypes)
        {
            await context.EntityTypes.AddAsync(entityType);
        }
        await context.SaveChangesAsync();

        // Map requirements to entity types
        MapRequirementsToEntityTypes(entityTypes, requirements);
        await context.SaveChangesAsync();

        logger.LogInformation("Seed data completed successfully");
    }

    private static List<Requirement> CreateRequirements()
    {
        var requirements = new List<Requirement>();

        // 1. INFORMATION REQUIREMENTS
        requirements.Add(new Requirement(
            "LEGAL_NAME",
            "Registered or Full Legal Name",
            "Official legal name as registered with authorities",
            RequirementType.Information,
            FieldType.Text,
            "{\"required\":true,\"minLength\":2,\"maxLength\":200}",
            "Enter the exact name as it appears on registration documents"
        ));

        requirements.Add(new Requirement(
            "TRADING_NAME",
            "Trading Name",
            "Business or trading name (if different from legal name)",
            RequirementType.Information,
            FieldType.Text,
            "{\"maxLength\":200}",
            "Enter your business/trading name if applicable"
        ));

        requirements.Add(new Requirement(
            "REGISTRATION_NUMBER",
            "Registration Number",
            "Official company/business registration number",
            RequirementType.Information,
            FieldType.Text,
            "{\"required\":true}",
            "Enter your official registration or incorporation number"
        ));

        requirements.Add(new Requirement(
            "TAX_NUMBER",
            "Tax Identification Number (TIN)",
            "Tax registration number",
            RequirementType.Information,
            FieldType.Text,
            "{\"required\":true}",
            "Enter your tax identification number"
        ));

        requirements.Add(new Requirement(
            "DATE_OF_INCORPORATION",
            "Date of Incorporation/Registration",
            "Official date when entity was registered",
            RequirementType.Information,
            FieldType.Date,
            "{\"required\":true}",
            "Select the date your business was officially registered"
        ));

        requirements.Add(new Requirement(
            "COUNTRY_OF_INCORPORATION",
            "Country of Incorporation",
            "Country where the entity is registered",
            RequirementType.Information,
            FieldType.Country,
            "{\"required\":true}",
            "Select the country where your business is registered"
        ));

        requirements.Add(new Requirement(
            "BUSINESS_ADDRESS",
            "Registered Business Address",
            "Official registered address of the business",
            RequirementType.Information,
            FieldType.Address,
            "{\"required\":true}",
            "Provide your official registered business address"
        ));

        requirements.Add(new Requirement(
            "PHYSICAL_ADDRESS",
            "Physical/Trading Address",
            "Actual location where business operates (if different)",
            RequirementType.Information,
            FieldType.Address,
            "{}",
            "Provide physical address if different from registered address"
        ));

        requirements.Add(new Requirement(
            "CONTACT_EMAIL",
            "Contact Email",
            "Primary email address for communication",
            RequirementType.Information,
            FieldType.Email,
            "{\"required\":true}",
            "Enter primary business email address"
        ));

        requirements.Add(new Requirement(
            "CONTACT_PHONE",
            "Contact Phone Number",
            "Primary phone number for contact",
            RequirementType.Information,
            FieldType.Phone,
            "{\"required\":true}",
            "Enter primary business phone number with country code"
        ));

        requirements.Add(new Requirement(
            "WEBSITE",
            "Website URL",
            "Company website address",
            RequirementType.Information,
            FieldType.Text,
            "{\"pattern\":\"^https?://.*\"}",
            "Enter your business website URL (optional)"
        ));

        requirements.Add(new Requirement(
            "NATURE_OF_BUSINESS",
            "Nature of Business",
            "Description of business activities",
            RequirementType.Information,
            FieldType.Textarea,
            "{\"required\":true,\"minLength\":10,\"maxLength\":1000}",
            "Describe your main business activities and industry"
        ));

        requirements.Add(new Requirement(
            "BUSINESS_SECTOR",
            "Business Sector/Industry",
            "Industry classification",
            RequirementType.Information,
            FieldType.Select,
            "{}",
            "Select your primary business sector"
        ));

        // Add options for business sector
        var businessSector = requirements.Last();
        businessSector.AddOption("FINANCIAL_SERVICES", "Financial Services", 1);
        businessSector.AddOption("RETAIL", "Retail/Wholesale Trade", 2);
        businessSector.AddOption("MANUFACTURING", "Manufacturing", 3);
        businessSector.AddOption("TECHNOLOGY", "Technology/IT", 4);
        businessSector.AddOption("HEALTHCARE", "Healthcare", 5);
        businessSector.AddOption("EDUCATION", "Education", 6);
        businessSector.AddOption("AGRICULTURE", "Agriculture", 7);
        businessSector.AddOption("CONSTRUCTION", "Construction/Real Estate", 8);
        businessSector.AddOption("TRANSPORT", "Transportation/Logistics", 9);
        businessSector.AddOption("HOSPITALITY", "Hospitality/Tourism", 10);
        businessSector.AddOption("NGO", "Non-Profit/NGO", 11);
        businessSector.AddOption("OTHER", "Other", 12);

        requirements.Add(new Requirement(
            "EXPECTED_TRANSACTION_VOLUME",
            "Expected Monthly Transaction Volume",
            "Estimated monthly transaction volume in USDC",
            RequirementType.Information,
            FieldType.Select,
            "{}",
            "Select your expected monthly transaction volume"
        ));

        var transVolume = requirements.Last();
        transVolume.AddOption("0-10K", "$0 - $10,000", 1);
        transVolume.AddOption("10K-50K", "$10,000 - $50,000", 2);
        transVolume.AddOption("50K-100K", "$50,000 - $100,000", 3);
        transVolume.AddOption("100K-500K", "$100,000 - $500,000", 4);
        transVolume.AddOption("500K+", "$500,000+", 5);

        // 2. DOCUMENT REQUIREMENTS
        requirements.Add(new Requirement(
            "CERTIFICATE_OF_INCORPORATION",
            "Certificate of Incorporation/Registration",
            "Official certificate issued by registrar",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":10485760}",
            "Upload your official certificate of incorporation (PDF, max 10MB)"
        ));

        requirements.Add(new Requirement(
            "MEMORANDUM_ARTICLES",
            "Memorandum and Articles of Association",
            "Company constitution and bylaws",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":10485760}",
            "Upload Memorandum and Articles of Association (PDF, max 10MB)"
        ));

        requirements.Add(new Requirement(
            "PARTNERSHIP_AGREEMENT",
            "Partnership Agreement",
            "Signed partnership agreement document",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":10485760}",
            "Upload signed partnership agreement (PDF, max 10MB)"
        ));

        requirements.Add(new Requirement(
            "TAX_CLEARANCE",
            "Tax Clearance Certificate",
            "Valid tax compliance certificate",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":10485760}",
            "Upload valid tax clearance certificate"
        ));

        requirements.Add(new Requirement(
            "BUSINESS_LICENSE",
            "Business License/Permit",
            "Valid business operating license",
            RequirementType.Document,
            FieldType.File,
            "{\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":10485760}",
            "Upload business license or operating permit if applicable"
        ));

        requirements.Add(new Requirement(
            "NGO_REGISTRATION_CERT",
            "NGO Registration Certificate",
            "Official NGO/Non-profit registration certificate",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":10485760}",
            "Upload NGO registration certificate"
        ));

        requirements.Add(new Requirement(
            "TRUST_DEED",
            "Trust Deed",
            "Registered trust deed document",
            RequirementType.Document,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":10485760}",
            "Upload registered trust deed"
        ));

        // 3. PROOF OF ADDRESS REQUIREMENTS
        requirements.Add(new Requirement(
            "UTILITY_BILL",
            "Utility Bill (Recent)",
            "Recent utility bill (water, electricity, gas) - not older than 3 months",
            RequirementType.ProofOfAddress,
            FieldType.File,
            "{\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":5242880}",
            "Upload recent utility bill (max 3 months old, PDF/image, max 5MB)"
        ));

        requirements.Add(new Requirement(
            "BANK_STATEMENT",
            "Bank Statement (Recent)",
            "Bank statement showing business address - not older than 3 months",
            RequirementType.ProofOfAddress,
            FieldType.File,
            "{\"fileTypes\":[\".pdf\"],\"maxSize\":5242880}",
            "Upload recent bank statement (max 3 months old, PDF, max 5MB)"
        ));

        requirements.Add(new Requirement(
            "LEASE_AGREEMENT",
            "Lease/Rental Agreement",
            "Current lease or rental agreement for business premises",
            RequirementType.ProofOfAddress,
            FieldType.File,
            "{\"fileTypes\":[\".pdf\"],\"maxSize\":10485760}",
            "Upload current lease/rental agreement"
        ));

        // 4. OWNERSHIP STRUCTURE REQUIREMENTS
        requirements.Add(new Requirement(
            "SHAREHOLDER_REGISTER",
            "Register of Shareholders/Members",
            "Complete list of all shareholders with ownership percentages",
            RequirementType.OwnershipStructure,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".xlsx\",\".csv\"],\"maxSize\":5242880}",
            "Upload shareholder register (PDF/Excel, max 5MB)"
        ));

        requirements.Add(new Requirement(
            "OWNERSHIP_STRUCTURE_CHART",
            "Ownership Structure Chart",
            "Visual diagram showing ownership structure and beneficial owners",
            RequirementType.OwnershipStructure,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":5242880}",
            "Upload ownership structure diagram"
        ));

        requirements.Add(new Requirement(
            "BENEFICIAL_OWNERS_INFO",
            "Beneficial Owners Information",
            "Details of all beneficial owners (25%+ ownership)",
            RequirementType.OwnershipStructure,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":5242880}",
            "Provide details of beneficial owners with 25% or more ownership"
        ));

        // 5. BOARD OF DIRECTORS REQUIREMENTS
        requirements.Add(new Requirement(
            "DIRECTORS_REGISTER",
            "Register of Directors",
            "Complete list of all directors",
            RequirementType.BoardDirectors,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".xlsx\"],\"maxSize\":5242880}",
            "Upload register of directors"
        ));

        requirements.Add(new Requirement(
            "BOARD_RESOLUTION",
            "Board Resolution",
            "Resolution authorizing account opening and appointing signatories",
            RequirementType.BoardDirectors,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":5242880}",
            "Upload board resolution for account authorization"
        ));

        // 6. AUTHORIZED SIGNATORIES REQUIREMENTS
        requirements.Add(new Requirement(
            "SIGNATORY_ID_PASSPORT",
            "ID/Passport of Authorized Signatories",
            "Valid government-issued ID for all authorized signatories",
            RequirementType.AuthorizedSignatories,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":5242880}",
            "Upload valid ID/passport for each authorized signatory"
        ));

        requirements.Add(new Requirement(
            "SIGNATORY_PROOF_ADDRESS",
            "Proof of Address - Authorized Signatories",
            "Proof of residential address for authorized signatories",
            RequirementType.AuthorizedSignatories,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":5242880}",
            "Upload proof of address for authorized signatories"
        ));

        requirements.Add(new Requirement(
            "SIGNATORY_SPECIMEN_SIGNATURE",
            "Specimen Signatures",
            "Specimen signatures of authorized signatories",
            RequirementType.AuthorizedSignatories,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\",\".jpg\",\".png\"],\"maxSize\":5242880}",
            "Upload specimen signatures of authorized persons"
        ));

        requirements.Add(new Requirement(
            "AUTHORIZATION_LETTER",
            "Letter of Authorization",
            "Letter authorizing specific individuals to act on behalf of the entity",
            RequirementType.AuthorizedSignatories,
            FieldType.File,
            "{\"required\":true,\"fileTypes\":[\".pdf\"],\"maxSize\":5242880}",
            "Upload letter of authorization"
        ));

        return requirements;
    }

    private static List<EntityType> CreateEntityTypes()
    {
        return new List<EntityType>
        {
            new EntityType(
                "PRIVATE_COMPANY",
                "Private Company / Limited Liability Company (LLC)",
                "Private limited companies and LLCs with shareholders"
            ),
            new EntityType(
                "PUBLIC_COMPANY",
                "Public Company",
                "Publicly listed companies with traded shares"
            ),
            new EntityType(
                "PARTNERSHIP",
                "Partnership",
                "General or limited partnerships with two or more partners"
            ),
            new EntityType(
                "SOLE_PROPRIETOR",
                "Sole Proprietor/Sole Trader",
                "Individual business owner operating as sole trader"
            ),
            new EntityType(
                "NGO",
                "Non-Governmental Organization (NGO)",
                "Registered non-profit organizations and charities"
            ),
            new EntityType(
                "TRUST",
                "Trust",
                "Registered trusts with trustees"
            ),
            new EntityType(
                "COOPERATIVE",
                "Cooperative Society",
                "Member-owned cooperative organizations"
            ),
            new EntityType(
                "GOVERNMENT_ENTITY",
                "Government Entity/Parastatal",
                "Government departments and state-owned enterprises"
            )
        };
    }

    private static void MapRequirementsToEntityTypes(List<EntityType> entityTypes, List<Requirement> requirements)
    {
        var reqDict = requirements.ToDictionary(r => r.Code);

        // Helper to add requirement
        void AddReq(EntityType et, string code, bool required, int order)
        {
            if (reqDict.TryGetValue(code, out var req))
            {
                et.AddRequirement(req, required, order);
            }
        }

        // PRIVATE COMPANY / LLC Requirements
        var privateCompany = entityTypes.First(e => e.Code == "PRIVATE_COMPANY");
        AddReq(privateCompany, "LEGAL_NAME", true, 1);
        AddReq(privateCompany, "TRADING_NAME", false, 2);
        AddReq(privateCompany, "REGISTRATION_NUMBER", true, 3);
        AddReq(privateCompany, "TAX_NUMBER", true, 4);
        AddReq(privateCompany, "DATE_OF_INCORPORATION", true, 5);
        AddReq(privateCompany, "COUNTRY_OF_INCORPORATION", true, 6);
        AddReq(privateCompany, "BUSINESS_ADDRESS", true, 7);
        AddReq(privateCompany, "PHYSICAL_ADDRESS", false, 8);
        AddReq(privateCompany, "CONTACT_EMAIL", true, 9);
        AddReq(privateCompany, "CONTACT_PHONE", true, 10);
        AddReq(privateCompany, "WEBSITE", false, 11);
        AddReq(privateCompany, "NATURE_OF_BUSINESS", true, 12);
        AddReq(privateCompany, "BUSINESS_SECTOR", true, 13);
        AddReq(privateCompany, "EXPECTED_TRANSACTION_VOLUME", true, 14);
        AddReq(privateCompany, "CERTIFICATE_OF_INCORPORATION", true, 15);
        AddReq(privateCompany, "MEMORANDUM_ARTICLES", true, 16);
        AddReq(privateCompany, "TAX_CLEARANCE", true, 17);
        AddReq(privateCompany, "BUSINESS_LICENSE", false, 18);
        AddReq(privateCompany, "UTILITY_BILL", true, 19);
        AddReq(privateCompany, "BANK_STATEMENT", false, 20);
        AddReq(privateCompany, "LEASE_AGREEMENT", false, 21);
        AddReq(privateCompany, "SHAREHOLDER_REGISTER", true, 22);
        AddReq(privateCompany, "OWNERSHIP_STRUCTURE_CHART", true, 23);
        AddReq(privateCompany, "BENEFICIAL_OWNERS_INFO", true, 24);
        AddReq(privateCompany, "DIRECTORS_REGISTER", true, 25);
        AddReq(privateCompany, "BOARD_RESOLUTION", true, 26);
        AddReq(privateCompany, "SIGNATORY_ID_PASSPORT", true, 27);
        AddReq(privateCompany, "SIGNATORY_PROOF_ADDRESS", true, 28);
        AddReq(privateCompany, "SIGNATORY_SPECIMEN_SIGNATURE", true, 29);
        AddReq(privateCompany, "AUTHORIZATION_LETTER", true, 30);

        // PUBLIC COMPANY Requirements (similar to private but more stringent)
        var publicCompany = entityTypes.First(e => e.Code == "PUBLIC_COMPANY");
        AddReq(publicCompany, "LEGAL_NAME", true, 1);
        AddReq(publicCompany, "TRADING_NAME", false, 2);
        AddReq(publicCompany, "REGISTRATION_NUMBER", true, 3);
        AddReq(publicCompany, "TAX_NUMBER", true, 4);
        AddReq(publicCompany, "DATE_OF_INCORPORATION", true, 5);
        AddReq(publicCompany, "COUNTRY_OF_INCORPORATION", true, 6);
        AddReq(publicCompany, "BUSINESS_ADDRESS", true, 7);
        AddReq(publicCompany, "PHYSICAL_ADDRESS", false, 8);
        AddReq(publicCompany, "CONTACT_EMAIL", true, 9);
        AddReq(publicCompany, "CONTACT_PHONE", true, 10);
        AddReq(publicCompany, "WEBSITE", true, 11);
        AddReq(publicCompany, "NATURE_OF_BUSINESS", true, 12);
        AddReq(publicCompany, "BUSINESS_SECTOR", true, 13);
        AddReq(publicCompany, "EXPECTED_TRANSACTION_VOLUME", true, 14);
        AddReq(publicCompany, "CERTIFICATE_OF_INCORPORATION", true, 15);
        AddReq(publicCompany, "MEMORANDUM_ARTICLES", true, 16);
        AddReq(publicCompany, "TAX_CLEARANCE", true, 17);
        AddReq(publicCompany, "BUSINESS_LICENSE", true, 18);
        AddReq(publicCompany, "UTILITY_BILL", true, 19);
        AddReq(publicCompany, "BANK_STATEMENT", true, 20);
        AddReq(publicCompany, "SHAREHOLDER_REGISTER", true, 21);
        AddReq(publicCompany, "OWNERSHIP_STRUCTURE_CHART", true, 22);
        AddReq(publicCompany, "BENEFICIAL_OWNERS_INFO", true, 23);
        AddReq(publicCompany, "DIRECTORS_REGISTER", true, 24);
        AddReq(publicCompany, "BOARD_RESOLUTION", true, 25);
        AddReq(publicCompany, "SIGNATORY_ID_PASSPORT", true, 26);
        AddReq(publicCompany, "SIGNATORY_PROOF_ADDRESS", true, 27);
        AddReq(publicCompany, "SIGNATORY_SPECIMEN_SIGNATURE", true, 28);
        AddReq(publicCompany, "AUTHORIZATION_LETTER", true, 29);

        // PARTNERSHIP Requirements
        var partnership = entityTypes.First(e => e.Code == "PARTNERSHIP");
        AddReq(partnership, "LEGAL_NAME", true, 1);
        AddReq(partnership, "TRADING_NAME", false, 2);
        AddReq(partnership, "REGISTRATION_NUMBER", true, 3);
        AddReq(partnership, "TAX_NUMBER", true, 4);
        AddReq(partnership, "DATE_OF_INCORPORATION", true, 5);
        AddReq(partnership, "COUNTRY_OF_INCORPORATION", true, 6);
        AddReq(partnership, "BUSINESS_ADDRESS", true, 7);
        AddReq(partnership, "CONTACT_EMAIL", true, 8);
        AddReq(partnership, "CONTACT_PHONE", true, 9);
        AddReq(partnership, "NATURE_OF_BUSINESS", true, 10);
        AddReq(partnership, "BUSINESS_SECTOR", true, 11);
        AddReq(partnership, "PARTNERSHIP_AGREEMENT", true, 12);
        AddReq(partnership, "TAX_CLEARANCE", true, 13);
        AddReq(partnership, "UTILITY_BILL", true, 14);
        AddReq(partnership, "SIGNATORY_ID_PASSPORT", true, 15);
        AddReq(partnership, "SIGNATORY_PROOF_ADDRESS", true, 16);
        AddReq(partnership, "SIGNATORY_SPECIMEN_SIGNATURE", true, 17);

        // SOLE PROPRIETOR Requirements
        var soleProprietor = entityTypes.First(e => e.Code == "SOLE_PROPRIETOR");
        AddReq(soleProprietor, "LEGAL_NAME", true, 1);
        AddReq(soleProprietor, "TRADING_NAME", false, 2);
        AddReq(soleProprietor, "REGISTRATION_NUMBER", true, 3);
        AddReq(soleProprietor, "TAX_NUMBER", true, 4);
        AddReq(soleProprietor, "BUSINESS_ADDRESS", true, 5);
        AddReq(soleProprietor, "CONTACT_EMAIL", true, 6);
        AddReq(soleProprietor, "CONTACT_PHONE", true, 7);
        AddReq(soleProprietor, "NATURE_OF_BUSINESS", true, 8);
        AddReq(soleProprietor, "BUSINESS_SECTOR", true, 9);
        AddReq(soleProprietor, "TAX_CLEARANCE", true, 10);
        AddReq(soleProprietor, "BUSINESS_LICENSE", false, 11);
        AddReq(soleProprietor, "UTILITY_BILL", true, 12);
        AddReq(soleProprietor, "SIGNATORY_ID_PASSPORT", true, 13);
        AddReq(soleProprietor, "SIGNATORY_PROOF_ADDRESS", true, 14);

        // NGO Requirements
        var ngo = entityTypes.First(e => e.Code == "NGO");
        AddReq(ngo, "LEGAL_NAME", true, 1);
        AddReq(ngo, "REGISTRATION_NUMBER", true, 2);
        AddReq(ngo, "TAX_NUMBER", false, 3);
        AddReq(ngo, "DATE_OF_INCORPORATION", true, 4);
        AddReq(ngo, "COUNTRY_OF_INCORPORATION", true, 5);
        AddReq(ngo, "BUSINESS_ADDRESS", true, 6);
        AddReq(ngo, "CONTACT_EMAIL", true, 7);
        AddReq(ngo, "CONTACT_PHONE", true, 8);
        AddReq(ngo, "WEBSITE", false, 9);
        AddReq(ngo, "NATURE_OF_BUSINESS", true, 10);
        AddReq(ngo, "NGO_REGISTRATION_CERT", true, 11);
        AddReq(ngo, "MEMORANDUM_ARTICLES", true, 12);
        AddReq(ngo, "TAX_CLEARANCE", false, 13);
        AddReq(ngo, "UTILITY_BILL", true, 14);
        AddReq(ngo, "DIRECTORS_REGISTER", true, 15);
        AddReq(ngo, "BOARD_RESOLUTION", true, 16);
        AddReq(ngo, "SIGNATORY_ID_PASSPORT", true, 17);
        AddReq(ngo, "SIGNATORY_PROOF_ADDRESS", true, 18);
        AddReq(ngo, "AUTHORIZATION_LETTER", true, 19);

        // TRUST Requirements
        var trust = entityTypes.First(e => e.Code == "TRUST");
        AddReq(trust, "LEGAL_NAME", true, 1);
        AddReq(trust, "REGISTRATION_NUMBER", true, 2);
        AddReq(trust, "TAX_NUMBER", true, 3);
        AddReq(trust, "DATE_OF_INCORPORATION", true, 4);
        AddReq(trust, "BUSINESS_ADDRESS", true, 5);
        AddReq(trust, "CONTACT_EMAIL", true, 6);
        AddReq(trust, "CONTACT_PHONE", true, 7);
        AddReq(trust, "TRUST_DEED", true, 8);
        AddReq(trust, "TAX_CLEARANCE", true, 9);
        AddReq(trust, "UTILITY_BILL", true, 10);
        AddReq(trust, "BENEFICIAL_OWNERS_INFO", true, 11);
        AddReq(trust, "SIGNATORY_ID_PASSPORT", true, 12);
        AddReq(trust, "SIGNATORY_PROOF_ADDRESS", true, 13);
        AddReq(trust, "AUTHORIZATION_LETTER", true, 14);

        // COOPERATIVE Requirements
        var cooperative = entityTypes.First(e => e.Code == "COOPERATIVE");
        AddReq(cooperative, "LEGAL_NAME", true, 1);
        AddReq(cooperative, "REGISTRATION_NUMBER", true, 2);
        AddReq(cooperative, "TAX_NUMBER", true, 3);
        AddReq(cooperative, "DATE_OF_INCORPORATION", true, 4);
        AddReq(cooperative, "BUSINESS_ADDRESS", true, 5);
        AddReq(cooperative, "CONTACT_EMAIL", true, 6);
        AddReq(cooperative, "CONTACT_PHONE", true, 7);
        AddReq(cooperative, "NATURE_OF_BUSINESS", true, 8);
        AddReq(cooperative, "CERTIFICATE_OF_INCORPORATION", true, 9);
        AddReq(cooperative, "MEMORANDUM_ARTICLES", true, 10);
        AddReq(cooperative, "TAX_CLEARANCE", true, 11);
        AddReq(cooperative, "UTILITY_BILL", true, 12);
        AddReq(cooperative, "DIRECTORS_REGISTER", true, 13);
        AddReq(cooperative, "BOARD_RESOLUTION", true, 14);
        AddReq(cooperative, "SIGNATORY_ID_PASSPORT", true, 15);
        AddReq(cooperative, "SIGNATORY_PROOF_ADDRESS", true, 16);

        // GOVERNMENT ENTITY Requirements
        var govEntity = entityTypes.First(e => e.Code == "GOVERNMENT_ENTITY");
        AddReq(govEntity, "LEGAL_NAME", true, 1);
        AddReq(govEntity, "REGISTRATION_NUMBER", true, 2);
        AddReq(govEntity, "BUSINESS_ADDRESS", true, 3);
        AddReq(govEntity, "CONTACT_EMAIL", true, 4);
        AddReq(govEntity, "CONTACT_PHONE", true, 5);
        AddReq(govEntity, "NATURE_OF_BUSINESS", true, 6);
        AddReq(govEntity, "CERTIFICATE_OF_INCORPORATION", true, 7);
        AddReq(govEntity, "BOARD_RESOLUTION", true, 8);
        AddReq(govEntity, "SIGNATORY_ID_PASSPORT", true, 9);
        AddReq(govEntity, "AUTHORIZATION_LETTER", true, 10);
    }
}

