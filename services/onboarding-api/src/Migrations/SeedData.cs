using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

namespace OnboardingApi.Migrations;

/// <summary>
/// Seeds the database with initial entity types and requirements data
/// Based on KYB requirements documentation
/// </summary>
public static class SeedData
{
    public static async Task SeedEntityConfigurationAsync(
        EntityConfigurationDbContext context,
        ILogger logger)
    {
        logger.LogInformation("Starting entity configuration seed...");

        try
        {
            // Check if data already exists
            var existingEntityTypes = await context.EntityTypes.CountAsync();
            if (existingEntityTypes > 0)
            {
                logger.LogInformation("Entity types already exist. Skipping seed.");
                return;
            }

            // Create Entity Types
            var entityTypes = new List<EntityType>
            {
                new EntityType(
                    code: "PRIVATE_COMPANY",
                    displayName: "Private Company / Limited Liability Company",
                    description: "A privately held business entity with limited liability",
                    icon: "FiBriefcase"
                ),
                new EntityType(
                    code: "PUBLIC_COMPANY",
                    displayName: "Publicly Listed Entity",
                    description: "A company whose shares are publicly traded on a stock exchange",
                    icon: "FiBuilding"
                ),
                new EntityType(
                    code: "GOVERNMENT_ENTITY",
                    displayName: "Government / State-Owned Entity / Organ of State",
                    description: "Government and state-owned entities or organs of state",
                    icon: "FiShield"
                ),
                new EntityType(
                    code: "NGO",
                    displayName: "Non-Profit Organisation / NGO / PVO",
                    description: "A non-profit organization operating independently of government",
                    icon: "FiHeart"
                ),
                new EntityType(
                    code: "ASSOCIATION",
                    displayName: "Non-Registered Association / Society / Charity / Foundation",
                    description: "An organization of people with a common purpose, not formally registered",
                    icon: "FiUsers"
                ),
                new EntityType(
                    code: "TRUST",
                    displayName: "Trust",
                    description: "A legal arrangement where assets are held by a trustee for beneficiaries",
                    icon: "FiShield"
                ),
                new EntityType(
                    code: "SUPRANATIONAL",
                    displayName: "Supranational / Inter-Governmental / Sovereign",
                    description: "International organizations and sovereign entities",
                    icon: "FiGlobe"
                ),
                new EntityType(
                    code: "SOLE_PROPRIETORSHIP",
                    displayName: "Sole Proprietor",
                    description: "A business owned and operated by a single individual",
                    icon: "FiUser"
                )
            };

            context.EntityTypes.AddRange(entityTypes);
            await context.SaveChangesAsync();
            logger.LogInformation("Created {Count} entity types", entityTypes.Count);

            // Create actual Requirement records
            var requirements = new List<Requirement>
            {
                // Information requirements
                new Requirement("REGISTERED_LEGAL_NAME", "Registered / Legal Name", "Official registered name of the entity", "INFORMATION", "text"),
                new Requirement("REGISTRATION_NUMBER", "Registration Number", "Official registration or incorporation number", "INFORMATION", "text"),
                new Requirement("DATE_OF_REGISTRATION", "Date of Registration", "Date when the entity was registered", "INFORMATION", "date"),
                new Requirement("COUNTRY_OF_INCORPORATION", "Country of Incorporation", "Country where the entity was incorporated", "INFORMATION", "text"),
                new Requirement("TRADING_OPERATING_NAME", "Trading/Operating Name", "Trading or operating name if different from legal name", "INFORMATION", "text"),
                new Requirement("REGISTERED_ADDRESS", "Registered Address", "Official registered address of the entity", "INFORMATION", "text"),
                new Requirement("OPERATING_ADDRESS", "Operating / Head Office Address", "Operating or head office address if different from registered address", "INFORMATION", "text"),
                new Requirement("BOARD_OF_DIRECTORS", "Board of Directors", "Full names of Board of Directors", "INFORMATION", "text"),
                new Requirement("OWNERSHIP_CONTROL_STRUCTURE", "Ownership & Control Structure", "Ownership and control structure of the entity", "INFORMATION", "text"),
                new Requirement("SHAREHOLDERS_25_PERCENT", "Shareholders ≥25%", "Individuals with ≥25% shareholding / voting rights", "INFORMATION", "text"),
                new Requirement("AUTHORISED_PERSONS", "Authorised Persons", "Identity of all authorised persons", "INFORMATION", "text"),
                new Requirement("PROOF_OF_AUTHORITY", "Proof of Authority", "Proof of authority for mandated persons (if EPP)", "INFORMATION", "file"),
                new Requirement("KEY_CONTROLLERS", "Key Controllers", "Key controllers (trustees / exec members)", "INFORMATION", "text"),
                new Requirement("TRUSTEES_FOUNDERS_BENEFICIARIES", "Trustees, Founders & Beneficiaries", "All trustees, founders and beneficiaries", "INFORMATION", "text"),
                
                // Documentation requirements
                new Requirement("COMPANY_REGISTRATION_DOCS", "Company Registration Documents", "Registration Certificate / Certificate of Incorporation", "DOCUMENTATION", "file"),
                new Requirement("CERTIFICATE_INCORPORATION", "Certificate of Incorporation", "Official certificate of incorporation document", "DOCUMENTATION", "file"),
                new Requirement("PROOF_OF_TRADING_NAME", "Proof of Trading Name", "Letterhead, business invoice, website extract", "DOCUMENTATION", "file"),
                new Requirement("PROOF_OF_ADDRESS", "Proof of Address", "Lease, utility bill, bank statement, municipal bill (<3 months)", "DOCUMENTATION", "file"),
                new Requirement("PROOF_OF_OPERATING_ADDRESS", "Proof of Operating Address", "Same as proof of address, or Site Visit Report", "DOCUMENTATION", "file"),
                new Requirement("DIRECTORS_LIST", "Directors List", "Annual report, financial statements, company register", "DOCUMENTATION", "file"),
                new Requirement("OWNERSHIP_STRUCTURE_DOCS", "Ownership Structure Documents", "MOI, Share Register / Certificates, authorised letter", "DOCUMENTATION", "file"),
                new Requirement("ID_DOCUMENTS", "ID Documents", "Clear valid ID/passport for shareholders & authorised persons", "DOCUMENTATION", "file"),
                new Requirement("MANDATE_RESOLUTION", "Mandate / Resolution", "Signed by executive director", "DOCUMENTATION", "file"),
                new Requirement("GOVERNING_DOCUMENT", "Governing Document / Constitution", "Constitution or bylaws of the organization", "DOCUMENTATION", "file"),
                new Requirement("NPO_NGO_CERTIFICATE", "NPO/NGO Certificate", "Valid NPO/NGO certificate or licence", "DOCUMENTATION", "file"),
                new Requirement("TRUST_DEED", "Trust Deed", "Legal trust deed document", "DOCUMENTATION", "file"),
                new Requirement("TRUST_RESOLUTION", "Trust Resolution", "Trust resolution / Power of attorney", "DOCUMENTATION", "file"),
                new Requirement("CONSTITUTIONAL_DOCUMENT", "Constitutional Document", "Constitutional / founding document of organisation", "DOCUMENTATION", "file"),
                new Requirement("PROOF_OF_INCOME", "Proof of Income", "Business bank statements", "DOCUMENTATION", "file"),
                new Requirement("PROOF_OF_LISTING", "Proof of Listing", "Stock exchange website printout", "DOCUMENTATION", "file"),
                new Requirement("AML_POLICY", "AML Policy", "Anti-Money Laundering policy document", "DOCUMENTATION", "file"),
                new Requirement("ANTI_BRIBERY_POLICY", "Anti-Bribery Policy", "Anti-bribery policy document", "DOCUMENTATION", "file"),
                new Requirement("SANCTIONS_POLICY", "Sanctions Policy", "Sanctions policy document", "DOCUMENTATION", "file"),
                new Requirement("RELEVANT_LICENCE", "Relevant Licence", "Banking / Insurance / ADLA licence", "DOCUMENTATION", "file"),
                new Requirement("WOLFSBERG_QUESTIONNAIRE", "Wolfsberg Questionnaire", "Wolfsberg Questionnaire for Financial Institutions", "DOCUMENTATION", "file")
            };

            context.Requirements.AddRange(requirements);
            await context.SaveChangesAsync();
            logger.LogInformation("Created {Count} requirements", requirements.Count);

            // Create requirement ID lookup
            var requirementIds = requirements.ToDictionary(r => r.Code, r => r.Id);

            // 1. PRIVATE COMPANY / LIMITED LIABILITY COMPANY
            var privateCompany = entityTypes.First(e => e.Code == "PRIVATE_COMPANY");
            privateCompany.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            privateCompany.AddRequirement(requirementIds["REGISTRATION_NUMBER"], isRequired: true, displayOrder: 2);
            privateCompany.AddRequirement(requirementIds["DATE_OF_REGISTRATION"], isRequired: true, displayOrder: 3);
            privateCompany.AddRequirement(requirementIds["COUNTRY_OF_INCORPORATION"], isRequired: true, displayOrder: 4);
            privateCompany.AddRequirement(requirementIds["TRADING_OPERATING_NAME"], isRequired: false, displayOrder: 5);
            privateCompany.AddRequirement(requirementIds["REGISTERED_ADDRESS"], isRequired: true, displayOrder: 6);
            privateCompany.AddRequirement(requirementIds["OPERATING_ADDRESS"], isRequired: false, displayOrder: 7);
            privateCompany.AddRequirement(requirementIds["BOARD_OF_DIRECTORS"], isRequired: true, displayOrder: 8);
            privateCompany.AddRequirement(requirementIds["OWNERSHIP_CONTROL_STRUCTURE"], isRequired: true, displayOrder: 9);
            privateCompany.AddRequirement(requirementIds["SHAREHOLDERS_25_PERCENT"], isRequired: true, displayOrder: 10);
            privateCompany.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 11);
            privateCompany.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 12);
            privateCompany.AddRequirement(requirementIds["COMPANY_REGISTRATION_DOCS"], isRequired: true, displayOrder: 13);
            privateCompany.AddRequirement(requirementIds["CERTIFICATE_INCORPORATION"], isRequired: true, displayOrder: 14);
            privateCompany.AddRequirement(requirementIds["PROOF_OF_TRADING_NAME"], isRequired: false, displayOrder: 15);
            privateCompany.AddRequirement(requirementIds["PROOF_OF_ADDRESS"], isRequired: true, displayOrder: 16);
            privateCompany.AddRequirement(requirementIds["PROOF_OF_OPERATING_ADDRESS"], isRequired: false, displayOrder: 17);
            privateCompany.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: true, displayOrder: 18);
            privateCompany.AddRequirement(requirementIds["OWNERSHIP_STRUCTURE_DOCS"], isRequired: true, displayOrder: 19);
            privateCompany.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 20);
            privateCompany.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 21);
            privateCompany.AddRequirement(requirementIds["AML_POLICY"], isRequired: false, displayOrder: 22);
            privateCompany.AddRequirement(requirementIds["ANTI_BRIBERY_POLICY"], isRequired: false, displayOrder: 23);
            privateCompany.AddRequirement(requirementIds["SANCTIONS_POLICY"], isRequired: false, displayOrder: 24);
            privateCompany.AddRequirement(requirementIds["RELEVANT_LICENCE"], isRequired: false, displayOrder: 25);
            privateCompany.AddRequirement(requirementIds["WOLFSBERG_QUESTIONNAIRE"], isRequired: false, displayOrder: 26);

            // 2. PUBLICLY LISTED ENTITY
            var publicCompany = entityTypes.First(e => e.Code == "PUBLIC_COMPANY");
            publicCompany.AddRequirement(requirementIds["PROOF_OF_LISTING"], isRequired: true, displayOrder: 1);
            publicCompany.AddRequirement(requirementIds["BOARD_OF_DIRECTORS"], isRequired: true, displayOrder: 2);
            publicCompany.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 3);
            publicCompany.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 4);
            publicCompany.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: true, displayOrder: 5);
            publicCompany.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 6);
            publicCompany.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 7);

            // 3. GOVERNMENT / STATE-OWNED ENTITY
            var governmentEntity = entityTypes.First(e => e.Code == "GOVERNMENT_ENTITY");
            governmentEntity.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            governmentEntity.AddRequirement(requirementIds["REGISTRATION_NUMBER"], isRequired: true, displayOrder: 2);
            governmentEntity.AddRequirement(requirementIds["DATE_OF_REGISTRATION"], isRequired: true, displayOrder: 3);
            governmentEntity.AddRequirement(requirementIds["COUNTRY_OF_INCORPORATION"], isRequired: true, displayOrder: 4);
            governmentEntity.AddRequirement(requirementIds["BOARD_OF_DIRECTORS"], isRequired: true, displayOrder: 5);
            governmentEntity.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 6);
            governmentEntity.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 7);
            governmentEntity.AddRequirement(requirementIds["COMPANY_REGISTRATION_DOCS"], isRequired: true, displayOrder: 8);
            governmentEntity.AddRequirement(requirementIds["CERTIFICATE_INCORPORATION"], isRequired: true, displayOrder: 9);
            governmentEntity.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: true, displayOrder: 10);
            governmentEntity.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 11);
            governmentEntity.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 12);

            // 4. NON-PROFIT ORGANISATION / NGO / PVO
            var ngo = entityTypes.First(e => e.Code == "NGO");
            ngo.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            ngo.AddRequirement(requirementIds["REGISTRATION_NUMBER"], isRequired: true, displayOrder: 2);
            ngo.AddRequirement(requirementIds["GOVERNING_DOCUMENT"], isRequired: true, displayOrder: 3);
            ngo.AddRequirement(requirementIds["NPO_NGO_CERTIFICATE"], isRequired: true, displayOrder: 4);
            ngo.AddRequirement(requirementIds["TRADING_OPERATING_NAME"], isRequired: false, displayOrder: 5);
            ngo.AddRequirement(requirementIds["REGISTERED_ADDRESS"], isRequired: true, displayOrder: 6);
            ngo.AddRequirement(requirementIds["OPERATING_ADDRESS"], isRequired: false, displayOrder: 7);
            ngo.AddRequirement(requirementIds["KEY_CONTROLLERS"], isRequired: true, displayOrder: 8);
            ngo.AddRequirement(requirementIds["SHAREHOLDERS_25_PERCENT"], isRequired: false, displayOrder: 9);
            ngo.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 10);
            ngo.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 11);
            ngo.AddRequirement(requirementIds["COMPANY_REGISTRATION_DOCS"], isRequired: true, displayOrder: 12);
            ngo.AddRequirement(requirementIds["CERTIFICATE_INCORPORATION"], isRequired: true, displayOrder: 13);
            ngo.AddRequirement(requirementIds["PROOF_OF_TRADING_NAME"], isRequired: false, displayOrder: 14);
            ngo.AddRequirement(requirementIds["PROOF_OF_ADDRESS"], isRequired: true, displayOrder: 15);
            ngo.AddRequirement(requirementIds["PROOF_OF_OPERATING_ADDRESS"], isRequired: false, displayOrder: 16);
            ngo.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: true, displayOrder: 17);
            ngo.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 18);
            ngo.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 19);

            // 5. NON-REGISTERED ASSOCIATION / SOCIETY / CHARITY / FOUNDATION
            var association = entityTypes.First(e => e.Code == "ASSOCIATION");
            association.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            association.AddRequirement(requirementIds["GOVERNING_DOCUMENT"], isRequired: true, displayOrder: 2);
            association.AddRequirement(requirementIds["REGISTERED_ADDRESS"], isRequired: true, displayOrder: 3);
            association.AddRequirement(requirementIds["KEY_CONTROLLERS"], isRequired: true, displayOrder: 4);
            association.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 5);
            association.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 6);
            association.AddRequirement(requirementIds["PROOF_OF_ADDRESS"], isRequired: true, displayOrder: 7);
            association.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: true, displayOrder: 8);
            association.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 9);
            association.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 10);

            // 6. TRUST
            var trust = entityTypes.First(e => e.Code == "TRUST");
            trust.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            trust.AddRequirement(requirementIds["REGISTRATION_NUMBER"], isRequired: true, displayOrder: 2);
            trust.AddRequirement(requirementIds["DATE_OF_REGISTRATION"], isRequired: true, displayOrder: 3);
            trust.AddRequirement(requirementIds["COUNTRY_OF_INCORPORATION"], isRequired: true, displayOrder: 4);
            trust.AddRequirement(requirementIds["TRADING_OPERATING_NAME"], isRequired: false, displayOrder: 5);
            trust.AddRequirement(requirementIds["REGISTERED_ADDRESS"], isRequired: true, displayOrder: 6);
            trust.AddRequirement(requirementIds["OPERATING_ADDRESS"], isRequired: false, displayOrder: 7);
            trust.AddRequirement(requirementIds["TRUSTEES_FOUNDERS_BENEFICIARIES"], isRequired: true, displayOrder: 8);
            trust.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 9);
            trust.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 10);
            trust.AddRequirement(requirementIds["TRUST_DEED"], isRequired: true, displayOrder: 11);
            trust.AddRequirement(requirementIds["PROOF_OF_TRADING_NAME"], isRequired: false, displayOrder: 12);
            trust.AddRequirement(requirementIds["PROOF_OF_ADDRESS"], isRequired: true, displayOrder: 13);
            trust.AddRequirement(requirementIds["PROOF_OF_OPERATING_ADDRESS"], isRequired: false, displayOrder: 14);
            trust.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 15);
            trust.AddRequirement(requirementIds["TRUST_RESOLUTION"], isRequired: true, displayOrder: 16);

            // 7. SUPRANATIONAL / INTER-GOVERNMENTAL / SOVEREIGN
            var supranational = entityTypes.First(e => e.Code == "SUPRANATIONAL");
            supranational.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 1);
            supranational.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 2);
            supranational.AddRequirement(requirementIds["CONSTITUTIONAL_DOCUMENT"], isRequired: true, displayOrder: 3);
            supranational.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 4);

            // 8. SOLE PROPRIETOR
            var soleProprietor = entityTypes.First(e => e.Code == "SOLE_PROPRIETORSHIP");
            soleProprietor.AddRequirement(requirementIds["REGISTERED_LEGAL_NAME"], isRequired: true, displayOrder: 1);
            soleProprietor.AddRequirement(requirementIds["REGISTRATION_NUMBER"], isRequired: true, displayOrder: 2);
            soleProprietor.AddRequirement(requirementIds["DATE_OF_REGISTRATION"], isRequired: true, displayOrder: 3);
            soleProprietor.AddRequirement(requirementIds["COUNTRY_OF_INCORPORATION"], isRequired: true, displayOrder: 4);
            soleProprietor.AddRequirement(requirementIds["TRADING_OPERATING_NAME"], isRequired: false, displayOrder: 5);
            soleProprietor.AddRequirement(requirementIds["REGISTERED_ADDRESS"], isRequired: true, displayOrder: 6);
            soleProprietor.AddRequirement(requirementIds["OPERATING_ADDRESS"], isRequired: false, displayOrder: 7);
            soleProprietor.AddRequirement(requirementIds["BOARD_OF_DIRECTORS"], isRequired: false, displayOrder: 8);
            soleProprietor.AddRequirement(requirementIds["SHAREHOLDERS_25_PERCENT"], isRequired: true, displayOrder: 9);
            soleProprietor.AddRequirement(requirementIds["AUTHORISED_PERSONS"], isRequired: true, displayOrder: 10);
            soleProprietor.AddRequirement(requirementIds["PROOF_OF_AUTHORITY"], isRequired: true, displayOrder: 11);
            soleProprietor.AddRequirement(requirementIds["PROOF_OF_INCOME"], isRequired: true, displayOrder: 12);
            soleProprietor.AddRequirement(requirementIds["CERTIFICATE_INCORPORATION"], isRequired: true, displayOrder: 13);
            soleProprietor.AddRequirement(requirementIds["PROOF_OF_TRADING_NAME"], isRequired: false, displayOrder: 14);
            soleProprietor.AddRequirement(requirementIds["PROOF_OF_ADDRESS"], isRequired: true, displayOrder: 15);
            soleProprietor.AddRequirement(requirementIds["PROOF_OF_OPERATING_ADDRESS"], isRequired: false, displayOrder: 16);
            soleProprietor.AddRequirement(requirementIds["DIRECTORS_LIST"], isRequired: false, displayOrder: 17);
            soleProprietor.AddRequirement(requirementIds["OWNERSHIP_STRUCTURE_DOCS"], isRequired: true, displayOrder: 18);
            soleProprietor.AddRequirement(requirementIds["ID_DOCUMENTS"], isRequired: true, displayOrder: 19);
            soleProprietor.AddRequirement(requirementIds["MANDATE_RESOLUTION"], isRequired: true, displayOrder: 20);

            await context.SaveChangesAsync();
            logger.LogInformation("Successfully seeded entity configuration data with {EntityTypeCount} entity types and their requirements", entityTypes.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding entity configuration data");
            throw;
        }
    }
}
