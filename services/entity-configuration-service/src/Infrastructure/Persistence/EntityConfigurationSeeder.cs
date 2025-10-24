using EntityConfigurationService.Domain.Aggregates;

namespace EntityConfigurationService.Infrastructure.Persistence;

/// <summary>
/// Seeds the database with entity types and requirements based on Annexure A
/// Corporate Digital Onboarding Requirements
/// </summary>
public static class EntityConfigurationSeeder
{
    public static async Task SeedAsync(EntityConfigurationDbContext context)
    {
        // Skip if already seeded
        if (context.EntityTypes.Any() || context.Requirements.Any())
            return;

        // ============================================
        // STEP 1: Create all Requirements
        // ============================================
        
        // Information Requirements
        var legalNameReq = new Requirement(
            "LEGAL_NAME",
            "Registered or Full Legal Name",
            "Official registered name of the entity as per registration documents",
            RequirementType.Information,
            FieldType.Text,
            validationRules: "{\"required\": true, \"minLength\": 2, \"maxLength\": 200}",
            helpText: "Enter the full legal name exactly as it appears on registration documents"
        );

        var registrationNumberReq = new Requirement(
            "REGISTRATION_NUMBER",
            "Registration Number",
            "Official company/entity registration number",
            RequirementType.Information,
            FieldType.Text,
            validationRules: "{\"required\": true, \"pattern\": \"^[A-Z0-9/-]+$\"}",
            helpText: "Enter the registration number from your certificate of incorporation"
        );

        var taxIdReq = new Requirement(
            "TAX_ID",
            "Tax Identification Number (TIN)",
            "Tax identification number issued by revenue authority",
            RequirementType.Information,
            FieldType.Text,
            validationRules: "{\"minLength\": 8, \"maxLength\": 20}",
            helpText: "Enter your TIN if applicable"
        );

        var incorporationDateReq = new Requirement(
            "INCORPORATION_DATE",
            "Date of Incorporation/Registration",
            "Date when the entity was officially registered",
            RequirementType.Information,
            FieldType.Date,
            validationRules: "{\"required\": true, \"maxDate\": \"today\"}",
            helpText: "Select the date from your incorporation certificate"
        );

        var businessAddressReq = new Requirement(
            "BUSINESS_ADDRESS",
            "Registered Business Address",
            "Physical address where the business is registered",
            RequirementType.Information,
            FieldType.Address,
            validationRules: "{\"required\": true}",
            helpText: "Enter the complete business address including city and postal code"
        );

        var countryOfIncorporationReq = new Requirement(
            "COUNTRY_OF_INCORPORATION",
            "Country of Incorporation",
            "Country where the entity is registered",
            RequirementType.Information,
            FieldType.Country,
            validationRules: "{\"required\": true}",
            helpText: "Select the country of incorporation"
        );

        var businessNatureReq = new Requirement(
            "NATURE_OF_BUSINESS",
            "Nature of Business",
            "Description of primary business activities",
            RequirementType.Information,
            FieldType.Textarea,
            validationRules: "{\"required\": true, \"maxLength\": 1000}",
            helpText: "Describe your main business activities and industry"
        );

        var contactPersonReq = new Requirement(
            "CONTACT_PERSON",
            "Primary Contact Person",
            "Full name of the main contact person",
            RequirementType.Information,
            FieldType.Text,
            validationRules: "{\"required\": true}",
            helpText: "Name of person authorized to communicate with us"
        );

        var contactEmailReq = new Requirement(
            "CONTACT_EMAIL",
            "Contact Email Address",
            "Email address for official communications",
            RequirementType.Information,
            FieldType.Email,
            validationRules: "{\"required\": true, \"email\": true}",
            helpText: "Enter a valid business email address"
        );

        var contactPhoneReq = new Requirement(
            "CONTACT_PHONE",
            "Contact Phone Number",
            "Phone number for official communications",
            RequirementType.Information,
            FieldType.Phone,
            validationRules: "{\"required\": true}",
            helpText: "Enter phone number with country code"
        );

        // Document Requirements
        var certificateOfIncorporationReq = new Requirement(
            "CERTIFICATE_OF_INCORPORATION",
            "Certificate of Incorporation",
            "Official certificate of incorporation or registration issued by relevant authority",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload a clear copy of your incorporation certificate (PDF, JPG, or PNG, max 10MB)"
        );

        var registrationCertificateReq = new Requirement(
            "REGISTRATION_CERTIFICATE",
            "Business Registration Certificate",
            "Current registration certificate showing active status",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload your current business registration certificate"
        );

        var memorandumReq = new Requirement(
            "MEMORANDUM_ARTICLES",
            "Memorandum and Articles of Association",
            "Company memorandum and articles of association or equivalent constitutional documents",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\"], \"maxSize\": 20971520}",
            helpText: "Upload M&A or constitutional documents (PDF, max 20MB)"
        );

        var proofOfAddressReq = new Requirement(
            "PROOF_OF_ADDRESS",
            "Proof of Business Address",
            "Recent utility bill, lease agreement, or property ownership document",
            RequirementType.ProofOfAddress,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload a document not older than 3 months showing business address"
        );

        var taxClearanceReq = new Requirement(
            "TAX_CLEARANCE_CERTIFICATE",
            "Tax Clearance Certificate",
            "Valid tax clearance or compliance certificate from revenue authority",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload current tax clearance certificate if available"
        );

        // Ownership Structure Requirements
        var ownershipStructureReq = new Requirement(
            "OWNERSHIP_STRUCTURE",
            "Ownership Structure Diagram",
            "Organizational chart showing ownership structure and percentages",
            RequirementType.OwnershipStructure,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\", \"doc\", \"docx\"], \"maxSize\": 10485760}",
            helpText: "Upload a diagram showing all shareholders and their ownership percentages"
        );

        var shareholderRegisterReq = new Requirement(
            "SHAREHOLDER_REGISTER",
            "Register of Shareholders",
            "Official register listing all shareholders with their details and shareholdings",
            RequirementType.OwnershipStructure,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"xlsx\", \"csv\"], \"maxSize\": 10485760}",
            helpText: "Upload the official shareholder register"
        );

        var beneficialOwnersReq = new Requirement(
            "BENEFICIAL_OWNERS",
            "Ultimate Beneficial Owners (UBOs)",
            "Details of individuals who ultimately own or control >25% of shares/voting rights",
            RequirementType.OwnershipStructure,
            FieldType.Textarea,
            validationRules: "{\"required\": true, \"maxLength\": 2000}",
            helpText: "List all UBOs with names, nationalities, and ownership percentages"
        );

        // Board of Directors Requirements
        var boardResolutionReq = new Requirement(
            "BOARD_RESOLUTION",
            "Board Resolution",
            "Board resolution authorizing onboarding and nominating authorized signatories",
            RequirementType.BoardDirectors,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\"], \"maxSize\": 10485760}",
            helpText: "Upload signed board resolution approving this onboarding"
        );

        var directorsRegisterReq = new Requirement(
            "DIRECTORS_REGISTER",
            "Register of Directors",
            "Official register listing all current directors with their details",
            RequirementType.BoardDirectors,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"xlsx\", \"csv\"], \"maxSize\": 10485760}",
            helpText: "Upload the official directors register"
        );

        // Authorized Signatories Requirements
        var authorizedSignatoriesReq = new Requirement(
            "AUTHORIZED_SIGNATORIES",
            "List of Authorized Signatories",
            "Names and details of persons authorized to sign on behalf of the entity",
            RequirementType.AuthorizedSignatories,
            FieldType.Textarea,
            validationRules: "{\"required\": true, \"maxLength\": 1000}",
            helpText: "List all authorized signatories with their full names and positions"
        );

        var signatoryIdReq = new Requirement(
            "SIGNATORY_ID_PASSPORT",
            "ID/Passport of Authorized Signatory",
            "Copy of national ID or passport of each authorized signatory",
            RequirementType.ProofOfIdentity,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload valid ID/passport for each authorized signatory"
        );

        var signatoryProofOfAddressReq = new Requirement(
            "SIGNATORY_PROOF_OF_ADDRESS",
            "Proof of Address for Signatory",
            "Recent proof of residential address for each authorized signatory",
            RequirementType.ProofOfAddress,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload recent utility bill or bank statement (not older than 3 months)"
        );

        // Bank Details Requirements
        var bankStatementReq = new Requirement(
            "BANK_STATEMENT",
            "Recent Bank Statement",
            "Bank statement from last 3 months showing business transactions",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\"], \"maxSize\": 10485760}",
            helpText: "Upload bank statement (PDF, last 3 months)"
        );

        var bankReferenceLetterReq = new Requirement(
            "BANK_REFERENCE_LETTER",
            "Bank Reference Letter",
            "Letter from your bank confirming your account and banking relationship",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"fileTypes\": [\"pdf\"], \"maxSize\": 10485760}",
            helpText: "Upload bank reference letter if available"
        );

        // Special Requirements for NGOs
        var ngoRegistrationReq = new Requirement(
            "NGO_REGISTRATION_CERTIFICATE",
            "NGO Registration Certificate",
            "Certificate of registration from NGO/NPO regulatory body",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload NGO registration certificate"
        );

        var ngoConstitutionReq = new Requirement(
            "NGO_CONSTITUTION",
            "NGO Constitution",
            "Constitution or founding document of the NGO",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\"], \"maxSize\": 20971520}",
            helpText: "Upload NGO constitution or founding documents"
        );

        var ngoTaxExemptionReq = new Requirement(
            "TAX_EXEMPTION_CERTIFICATE",
            "Tax Exemption Certificate",
            "Certificate of tax exemption if applicable",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload tax exemption certificate if your NGO has one"
        );

        // Special Requirements for Partnerships
        var partnershipDeedReq = new Requirement(
            "PARTNERSHIP_DEED",
            "Partnership Agreement/Deed",
            "Signed partnership agreement or deed",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\"], \"maxSize\": 20971520}",
            helpText: "Upload signed partnership deed"
        );

        var partnersRegisterReq = new Requirement(
            "PARTNERS_REGISTER",
            "Register of Partners",
            "List of all partners with their details and profit-sharing ratios",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"xlsx\", \"csv\"], \"maxSize\": 10485760}",
            helpText: "Upload register showing all partners"
        );

        // Special Requirements for Sole Proprietors
        var proprietorIdReq = new Requirement(
            "PROPRIETOR_ID",
            "Proprietor's ID/Passport",
            "Copy of proprietor's national ID or passport",
            RequirementType.ProofOfIdentity,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload valid ID/passport of the sole proprietor"
        );

        var tradingLicenseReq = new Requirement(
            "TRADING_LICENSE",
            "Trading License",
            "Business/trading license issued by local authority",
            RequirementType.Document,
            FieldType.File,
            validationRules: "{\"required\": true, \"fileTypes\": [\"pdf\", \"jpg\", \"png\"], \"maxSize\": 10485760}",
            helpText: "Upload current trading license"
        );

        // Add all requirements to context
        var allRequirements = new List<Requirement>
        {
            legalNameReq, registrationNumberReq, taxIdReq, incorporationDateReq, businessAddressReq,
            countryOfIncorporationReq, businessNatureReq, contactPersonReq, contactEmailReq, contactPhoneReq,
            certificateOfIncorporationReq, registrationCertificateReq, memorandumReq, proofOfAddressReq,
            taxClearanceReq, ownershipStructureReq, shareholderRegisterReq, beneficialOwnersReq,
            boardResolutionReq, directorsRegisterReq, authorizedSignatoriesReq, signatoryIdReq,
            signatoryProofOfAddressReq, bankStatementReq, bankReferenceLetterReq,
            ngoRegistrationReq, ngoConstitutionReq, ngoTaxExemptionReq,
            partnershipDeedReq, partnersRegisterReq,
            proprietorIdReq, tradingLicenseReq
        };

        await context.Requirements.AddRangeAsync(allRequirements);
        await context.SaveChangesAsync();

        // ============================================
        // STEP 2: Create Entity Types
        // ============================================

        // 1. Private Company / Limited Liability Company (Pty Ltd / LLC)
        var privateCompany = new EntityType(
            "PRIVATE_COMPANY",
            "Private Company / Limited Liability Company",
            "Private limited companies and LLCs - most common corporate structure for SMEs"
        );
        
        // Add requirements for Private Company
        var pcOrder = 1;
        privateCompany.AddRequirement(legalNameReq, true, pcOrder++);
        privateCompany.AddRequirement(registrationNumberReq, true, pcOrder++);
        privateCompany.AddRequirement(countryOfIncorporationReq, true, pcOrder++);
        privateCompany.AddRequirement(incorporationDateReq, true, pcOrder++);
        privateCompany.AddRequirement(businessAddressReq, true, pcOrder++);
        privateCompany.AddRequirement(businessNatureReq, true, pcOrder++);
        privateCompany.AddRequirement(taxIdReq, false, pcOrder++);
        privateCompany.AddRequirement(contactPersonReq, true, pcOrder++);
        privateCompany.AddRequirement(contactEmailReq, true, pcOrder++);
        privateCompany.AddRequirement(contactPhoneReq, true, pcOrder++);
        privateCompany.AddRequirement(certificateOfIncorporationReq, true, pcOrder++);
        privateCompany.AddRequirement(registrationCertificateReq, true, pcOrder++);
        privateCompany.AddRequirement(memorandumReq, true, pcOrder++);
        privateCompany.AddRequirement(proofOfAddressReq, true, pcOrder++);
        privateCompany.AddRequirement(taxClearanceReq, false, pcOrder++);
        privateCompany.AddRequirement(ownershipStructureReq, true, pcOrder++);
        privateCompany.AddRequirement(shareholderRegisterReq, true, pcOrder++);
        privateCompany.AddRequirement(beneficialOwnersReq, true, pcOrder++);
        privateCompany.AddRequirement(boardResolutionReq, true, pcOrder++);
        privateCompany.AddRequirement(directorsRegisterReq, true, pcOrder++);
        privateCompany.AddRequirement(authorizedSignatoriesReq, true, pcOrder++);
        privateCompany.AddRequirement(signatoryIdReq, true, pcOrder++);
        privateCompany.AddRequirement(signatoryProofOfAddressReq, true, pcOrder++);
        privateCompany.AddRequirement(bankStatementReq, true, pcOrder++);
        privateCompany.AddRequirement(bankReferenceLetterReq, false, pcOrder++);

        // 2. Public Company (Ltd/PLC)
        var publicCompany = new EntityType(
            "PUBLIC_COMPANY",
            "Public Limited Company (PLC)",
            "Publicly traded companies listed on stock exchanges"
        );
        
        var plcOrder = 1;
        publicCompany.AddRequirement(legalNameReq, true, plcOrder++);
        publicCompany.AddRequirement(registrationNumberReq, true, plcOrder++);
        publicCompany.AddRequirement(countryOfIncorporationReq, true, plcOrder++);
        publicCompany.AddRequirement(incorporationDateReq, true, plcOrder++);
        publicCompany.AddRequirement(businessAddressReq, true, plcOrder++);
        publicCompany.AddRequirement(businessNatureReq, true, plcOrder++);
        publicCompany.AddRequirement(taxIdReq, true, plcOrder++);
        publicCompany.AddRequirement(contactPersonReq, true, plcOrder++);
        publicCompany.AddRequirement(contactEmailReq, true, plcOrder++);
        publicCompany.AddRequirement(contactPhoneReq, true, plcOrder++);
        publicCompany.AddRequirement(certificateOfIncorporationReq, true, plcOrder++);
        publicCompany.AddRequirement(registrationCertificateReq, true, plcOrder++);
        publicCompany.AddRequirement(memorandumReq, true, plcOrder++);
        publicCompany.AddRequirement(proofOfAddressReq, true, plcOrder++);
        publicCompany.AddRequirement(taxClearanceReq, true, plcOrder++);
        publicCompany.AddRequirement(ownershipStructureReq, true, plcOrder++);
        publicCompany.AddRequirement(shareholderRegisterReq, true, plcOrder++);
        publicCompany.AddRequirement(beneficialOwnersReq, true, plcOrder++);
        publicCompany.AddRequirement(boardResolutionReq, true, plcOrder++);
        publicCompany.AddRequirement(directorsRegisterReq, true, plcOrder++);
        publicCompany.AddRequirement(authorizedSignatoriesReq, true, plcOrder++);
        publicCompany.AddRequirement(signatoryIdReq, true, plcOrder++);
        publicCompany.AddRequirement(signatoryProofOfAddressReq, true, plcOrder++);
        publicCompany.AddRequirement(bankStatementReq, true, plcOrder++);
        publicCompany.AddRequirement(bankReferenceLetterReq, true, plcOrder++);

        // 3. Partnership
        var partnership = new EntityType(
            "PARTNERSHIP",
            "Partnership / Limited Partnership",
            "Business partnerships including general and limited partnerships"
        );
        
        var partOrder = 1;
        partnership.AddRequirement(legalNameReq, true, partOrder++);
        partnership.AddRequirement(registrationNumberReq, true, partOrder++);
        partnership.AddRequirement(countryOfIncorporationReq, true, partOrder++);
        partnership.AddRequirement(incorporationDateReq, true, partOrder++);
        partnership.AddRequirement(businessAddressReq, true, partOrder++);
        partnership.AddRequirement(businessNatureReq, true, partOrder++);
        partnership.AddRequirement(taxIdReq, false, partOrder++);
        partnership.AddRequirement(contactPersonReq, true, partOrder++);
        partnership.AddRequirement(contactEmailReq, true, partOrder++);
        partnership.AddRequirement(contactPhoneReq, true, partOrder++);
        partnership.AddRequirement(partnershipDeedReq, true, partOrder++);
        partnership.AddRequirement(registrationCertificateReq, true, partOrder++);
        partnership.AddRequirement(partnersRegisterReq, true, partOrder++);
        partnership.AddRequirement(proofOfAddressReq, true, partOrder++);
        partnership.AddRequirement(authorizedSignatoriesReq, true, partOrder++);
        partnership.AddRequirement(signatoryIdReq, true, partOrder++);
        partnership.AddRequirement(signatoryProofOfAddressReq, true, partOrder++);
        partnership.AddRequirement(bankStatementReq, true, partOrder++);
        partnership.AddRequirement(taxClearanceReq, false, partOrder++);

        // 4. Sole Proprietorship
        var soleProprietor = new EntityType(
            "SOLE_PROPRIETOR",
            "Sole Proprietorship / Sole Trader",
            "Individual business owners operating as sole traders"
        );
        
        var spOrder = 1;
        soleProprietor.AddRequirement(legalNameReq, true, spOrder++);
        soleProprietor.AddRequirement(registrationNumberReq, false, spOrder++);
        soleProprietor.AddRequirement(countryOfIncorporationReq, true, spOrder++);
        soleProprietor.AddRequirement(businessAddressReq, true, spOrder++);
        soleProprietor.AddRequirement(businessNatureReq, true, spOrder++);
        soleProprietor.AddRequirement(taxIdReq, false, spOrder++);
        soleProprietor.AddRequirement(contactPersonReq, true, spOrder++);
        soleProprietor.AddRequirement(contactEmailReq, true, spOrder++);
        soleProprietor.AddRequirement(contactPhoneReq, true, spOrder++);
        soleProprietor.AddRequirement(proprietorIdReq, true, spOrder++);
        soleProprietor.AddRequirement(tradingLicenseReq, true, spOrder++);
        soleProprietor.AddRequirement(proofOfAddressReq, true, spOrder++);
        soleProprietor.AddRequirement(bankStatementReq, true, spOrder++);
        soleProprietor.AddRequirement(taxClearanceReq, false, spOrder++);

        // 5. Non-Governmental Organization (NGO)
        var ngo = new EntityType(
            "NGO",
            "Non-Governmental Organization (NGO/NPO)",
            "Non-profit organizations including charities and foundations"
        );
        
        var ngoOrder = 1;
        ngo.AddRequirement(legalNameReq, true, ngoOrder++);
        ngo.AddRequirement(registrationNumberReq, true, ngoOrder++);
        ngo.AddRequirement(countryOfIncorporationReq, true, ngoOrder++);
        ngo.AddRequirement(incorporationDateReq, true, ngoOrder++);
        ngo.AddRequirement(businessAddressReq, true, ngoOrder++);
        ngo.AddRequirement(businessNatureReq, true, ngoOrder++);
        ngo.AddRequirement(contactPersonReq, true, ngoOrder++);
        ngo.AddRequirement(contactEmailReq, true, ngoOrder++);
        ngo.AddRequirement(contactPhoneReq, true, ngoOrder++);
        ngo.AddRequirement(ngoRegistrationReq, true, ngoOrder++);
        ngo.AddRequirement(ngoConstitutionReq, true, ngoOrder++);
        ngo.AddRequirement(proofOfAddressReq, true, ngoOrder++);
        ngo.AddRequirement(ngoTaxExemptionReq, false, ngoOrder++);
        ngo.AddRequirement(directorsRegisterReq, true, ngoOrder++);
        ngo.AddRequirement(boardResolutionReq, true, ngoOrder++);
        ngo.AddRequirement(authorizedSignatoriesReq, true, ngoOrder++);
        ngo.AddRequirement(signatoryIdReq, true, ngoOrder++);
        ngo.AddRequirement(signatoryProofOfAddressReq, true, ngoOrder++);
        ngo.AddRequirement(bankStatementReq, true, ngoOrder++);

        // 6. Trust
        var trust = new EntityType(
            "TRUST",
            "Trust / Family Trust",
            "Trusts including family trusts and business trusts"
        );
        
        var trustOrder = 1;
        trust.AddRequirement(legalNameReq, true, trustOrder++);
        trust.AddRequirement(registrationNumberReq, true, trustOrder++);
        trust.AddRequirement(countryOfIncorporationReq, true, trustOrder++);
        trust.AddRequirement(incorporationDateReq, true, trustOrder++);
        trust.AddRequirement(businessAddressReq, true, trustOrder++);
        trust.AddRequirement(businessNatureReq, true, trustOrder++);
        trust.AddRequirement(taxIdReq, false, trustOrder++);
        trust.AddRequirement(contactPersonReq, true, trustOrder++);
        trust.AddRequirement(contactEmailReq, true, trustOrder++);
        trust.AddRequirement(contactPhoneReq, true, trustOrder++);
        trust.AddRequirement(registrationCertificateReq, true, trustOrder++);
        trust.AddRequirement(memorandumReq, true, trustOrder++); // Trust deed
        trust.AddRequirement(proofOfAddressReq, true, trustOrder++);
        trust.AddRequirement(beneficialOwnersReq, true, trustOrder++);
        trust.AddRequirement(authorizedSignatoriesReq, true, trustOrder++);
        trust.AddRequirement(signatoryIdReq, true, trustOrder++);
        trust.AddRequirement(signatoryProofOfAddressReq, true, trustOrder++);
        trust.AddRequirement(bankStatementReq, true, trustOrder++);

        // Add all entity types to context
        var allEntityTypes = new List<EntityType>
        {
            privateCompany,
            publicCompany,
            partnership,
            soleProprietor,
            ngo,
            trust
        };

        await context.EntityTypes.AddRangeAsync(allEntityTypes);
        await context.SaveChangesAsync();
    }
}

