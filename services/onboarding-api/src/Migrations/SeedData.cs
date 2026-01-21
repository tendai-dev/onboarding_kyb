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
            // Check if requirements already exist (more specific check)
            var existingRequirements = await context.Requirements.CountAsync();
            if (existingRequirements > 0)
            {
                logger.LogInformation("Requirements already exist. Skipping seed.");
                return;
            }
            
            // Check if entity types exist
            var existingEntityTypes = await context.EntityTypes.CountAsync();
            var entityTypesExist = existingEntityTypes > 0;

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

            // Only add entity types if they don't exist
            if (!entityTypesExist)
            {
                context.EntityTypes.AddRange(entityTypes);
                await context.SaveChangesAsync();
                logger.LogInformation("Created {Count} entity types", entityTypes.Count);
            }
            else
            {
                // Load existing entity types from database with tracking disabled
                entityTypes = await context.EntityTypes
                    .AsNoTracking()
                    .ToListAsync();
                logger.LogInformation("Using {Count} existing entity types", entityTypes.Count);
                
                // Detach all tracked entities to avoid concurrency issues
                context.ChangeTracker.Clear();
            }

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

            // Use raw SQL to insert entity type requirements to avoid concurrency issues
            // This bypasses EF Core's change tracking and UpdatedAt timestamp checks
            var now = DateTime.UtcNow;
            
            // Helper function to insert requirement
            async Task AddRequirementToEntityType(string entityTypeCode, string requirementCode, bool isRequired, int displayOrder)
            {
                var entityType = entityTypes.First(e => e.Code == entityTypeCode);
                var requirementId = requirementIds[requirementCode];
                var id = Guid.NewGuid();
                
                await context.Database.ExecuteSqlInterpolatedAsync($@"
                    INSERT INTO entity_configuration.entity_type_requirements 
                    (""Id"", entity_type_id, requirement_id, is_required, display_order, created_at, updated_at)
                    VALUES 
                    ({id}, {entityType.Id}, {requirementId}, {isRequired}, {displayOrder}, {now}, {now})
                    ON CONFLICT DO NOTHING");
            }

            // 1. PRIVATE COMPANY / LIMITED LIABILITY COMPANY
            logger.LogInformation("Adding requirements for PRIVATE_COMPANY...");
            await AddRequirementToEntityType("PRIVATE_COMPANY", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "REGISTRATION_NUMBER", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "DATE_OF_REGISTRATION", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "COUNTRY_OF_INCORPORATION", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "TRADING_OPERATING_NAME", isRequired: false, displayOrder: 5);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "REGISTERED_ADDRESS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "OPERATING_ADDRESS", isRequired: false, displayOrder: 7);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "BOARD_OF_DIRECTORS", isRequired: true, displayOrder: 8);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "OWNERSHIP_CONTROL_STRUCTURE", isRequired: true, displayOrder: 9);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "SHAREHOLDERS_25_PERCENT", isRequired: true, displayOrder: 10);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 11);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 12);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "COMPANY_REGISTRATION_DOCS", isRequired: true, displayOrder: 13);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "CERTIFICATE_INCORPORATION", isRequired: true, displayOrder: 14);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "PROOF_OF_TRADING_NAME", isRequired: false, displayOrder: 15);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "PROOF_OF_ADDRESS", isRequired: true, displayOrder: 16);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "PROOF_OF_OPERATING_ADDRESS", isRequired: false, displayOrder: 17);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "DIRECTORS_LIST", isRequired: true, displayOrder: 18);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "OWNERSHIP_STRUCTURE_DOCS", isRequired: true, displayOrder: 19);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "ID_DOCUMENTS", isRequired: true, displayOrder: 20);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 21);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "AML_POLICY", isRequired: false, displayOrder: 22);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "ANTI_BRIBERY_POLICY", isRequired: false, displayOrder: 23);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "SANCTIONS_POLICY", isRequired: false, displayOrder: 24);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "RELEVANT_LICENCE", isRequired: false, displayOrder: 25);
            await AddRequirementToEntityType("PRIVATE_COMPANY", "WOLFSBERG_QUESTIONNAIRE", isRequired: false, displayOrder: 26);

            // 2. PUBLICLY LISTED ENTITY
            logger.LogInformation("Adding requirements for PUBLIC_COMPANY...");
            await AddRequirementToEntityType("PUBLIC_COMPANY", "PROOF_OF_LISTING", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "BOARD_OF_DIRECTORS", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "DIRECTORS_LIST", isRequired: true, displayOrder: 5);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "ID_DOCUMENTS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("PUBLIC_COMPANY", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 7);

            // 3. GOVERNMENT / STATE-OWNED ENTITY
            logger.LogInformation("Adding requirements for GOVERNMENT_ENTITY...");
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "REGISTRATION_NUMBER", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "DATE_OF_REGISTRATION", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "COUNTRY_OF_INCORPORATION", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "BOARD_OF_DIRECTORS", isRequired: true, displayOrder: 5);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 7);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "COMPANY_REGISTRATION_DOCS", isRequired: true, displayOrder: 8);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "CERTIFICATE_INCORPORATION", isRequired: true, displayOrder: 9);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "DIRECTORS_LIST", isRequired: true, displayOrder: 10);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "ID_DOCUMENTS", isRequired: true, displayOrder: 11);
            await AddRequirementToEntityType("GOVERNMENT_ENTITY", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 12);

            // 4. NON-PROFIT ORGANISATION / NGO / PVO
            logger.LogInformation("Adding requirements for NGO...");
            await AddRequirementToEntityType("NGO", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("NGO", "REGISTRATION_NUMBER", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("NGO", "GOVERNING_DOCUMENT", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("NGO", "NPO_NGO_CERTIFICATE", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("NGO", "TRADING_OPERATING_NAME", isRequired: false, displayOrder: 5);
            await AddRequirementToEntityType("NGO", "REGISTERED_ADDRESS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("NGO", "OPERATING_ADDRESS", isRequired: false, displayOrder: 7);
            await AddRequirementToEntityType("NGO", "KEY_CONTROLLERS", isRequired: true, displayOrder: 8);
            await AddRequirementToEntityType("NGO", "SHAREHOLDERS_25_PERCENT", isRequired: false, displayOrder: 9);
            await AddRequirementToEntityType("NGO", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 10);
            await AddRequirementToEntityType("NGO", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 11);
            await AddRequirementToEntityType("NGO", "COMPANY_REGISTRATION_DOCS", isRequired: true, displayOrder: 12);
            await AddRequirementToEntityType("NGO", "CERTIFICATE_INCORPORATION", isRequired: true, displayOrder: 13);
            await AddRequirementToEntityType("NGO", "PROOF_OF_TRADING_NAME", isRequired: false, displayOrder: 14);
            await AddRequirementToEntityType("NGO", "PROOF_OF_ADDRESS", isRequired: true, displayOrder: 15);
            await AddRequirementToEntityType("NGO", "PROOF_OF_OPERATING_ADDRESS", isRequired: false, displayOrder: 16);
            await AddRequirementToEntityType("NGO", "DIRECTORS_LIST", isRequired: true, displayOrder: 17);
            await AddRequirementToEntityType("NGO", "ID_DOCUMENTS", isRequired: true, displayOrder: 18);
            await AddRequirementToEntityType("NGO", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 19);

            // 5. NON-REGISTERED ASSOCIATION / SOCIETY / CHARITY / FOUNDATION
            logger.LogInformation("Adding requirements for ASSOCIATION...");
            await AddRequirementToEntityType("ASSOCIATION", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("ASSOCIATION", "GOVERNING_DOCUMENT", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("ASSOCIATION", "REGISTERED_ADDRESS", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("ASSOCIATION", "KEY_CONTROLLERS", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("ASSOCIATION", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 5);
            await AddRequirementToEntityType("ASSOCIATION", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("ASSOCIATION", "PROOF_OF_ADDRESS", isRequired: true, displayOrder: 7);
            await AddRequirementToEntityType("ASSOCIATION", "DIRECTORS_LIST", isRequired: true, displayOrder: 8);
            await AddRequirementToEntityType("ASSOCIATION", "ID_DOCUMENTS", isRequired: true, displayOrder: 9);
            await AddRequirementToEntityType("ASSOCIATION", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 10);

            // 6. TRUST
            logger.LogInformation("Adding requirements for TRUST...");
            await AddRequirementToEntityType("TRUST", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("TRUST", "REGISTRATION_NUMBER", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("TRUST", "DATE_OF_REGISTRATION", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("TRUST", "COUNTRY_OF_INCORPORATION", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("TRUST", "TRADING_OPERATING_NAME", isRequired: false, displayOrder: 5);
            await AddRequirementToEntityType("TRUST", "REGISTERED_ADDRESS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("TRUST", "OPERATING_ADDRESS", isRequired: false, displayOrder: 7);
            await AddRequirementToEntityType("TRUST", "TRUSTEES_FOUNDERS_BENEFICIARIES", isRequired: true, displayOrder: 8);
            await AddRequirementToEntityType("TRUST", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 9);
            await AddRequirementToEntityType("TRUST", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 10);
            await AddRequirementToEntityType("TRUST", "TRUST_DEED", isRequired: true, displayOrder: 11);
            await AddRequirementToEntityType("TRUST", "PROOF_OF_TRADING_NAME", isRequired: false, displayOrder: 12);
            await AddRequirementToEntityType("TRUST", "PROOF_OF_ADDRESS", isRequired: true, displayOrder: 13);
            await AddRequirementToEntityType("TRUST", "PROOF_OF_OPERATING_ADDRESS", isRequired: false, displayOrder: 14);
            await AddRequirementToEntityType("TRUST", "ID_DOCUMENTS", isRequired: true, displayOrder: 15);
            await AddRequirementToEntityType("TRUST", "TRUST_RESOLUTION", isRequired: true, displayOrder: 16);

            // 7. SUPRANATIONAL / INTER-GOVERNMENTAL / SOVEREIGN
            logger.LogInformation("Adding requirements for SUPRANATIONAL...");
            await AddRequirementToEntityType("SUPRANATIONAL", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("SUPRANATIONAL", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("SUPRANATIONAL", "CONSTITUTIONAL_DOCUMENT", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("SUPRANATIONAL", "ID_DOCUMENTS", isRequired: true, displayOrder: 4);

            // 8. SOLE PROPRIETOR
            logger.LogInformation("Adding requirements for SOLE_PROPRIETORSHIP...");
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "REGISTERED_LEGAL_NAME", isRequired: true, displayOrder: 1);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "REGISTRATION_NUMBER", isRequired: true, displayOrder: 2);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "DATE_OF_REGISTRATION", isRequired: true, displayOrder: 3);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "COUNTRY_OF_INCORPORATION", isRequired: true, displayOrder: 4);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "TRADING_OPERATING_NAME", isRequired: false, displayOrder: 5);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "REGISTERED_ADDRESS", isRequired: true, displayOrder: 6);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "OPERATING_ADDRESS", isRequired: false, displayOrder: 7);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "BOARD_OF_DIRECTORS", isRequired: false, displayOrder: 8);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "SHAREHOLDERS_25_PERCENT", isRequired: true, displayOrder: 9);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "AUTHORISED_PERSONS", isRequired: true, displayOrder: 10);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "PROOF_OF_AUTHORITY", isRequired: true, displayOrder: 11);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "PROOF_OF_INCOME", isRequired: true, displayOrder: 12);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "CERTIFICATE_INCORPORATION", isRequired: true, displayOrder: 13);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "PROOF_OF_TRADING_NAME", isRequired: false, displayOrder: 14);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "PROOF_OF_ADDRESS", isRequired: true, displayOrder: 15);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "PROOF_OF_OPERATING_ADDRESS", isRequired: false, displayOrder: 16);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "DIRECTORS_LIST", isRequired: false, displayOrder: 17);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "OWNERSHIP_STRUCTURE_DOCS", isRequired: true, displayOrder: 18);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "ID_DOCUMENTS", isRequired: true, displayOrder: 19);
            await AddRequirementToEntityType("SOLE_PROPRIETORSHIP", "MANDATE_RESOLUTION", isRequired: true, displayOrder: 20);

            // No need for SaveChangesAsync since we're using raw SQL inserts
            logger.LogInformation("All entity type requirements added successfully via raw SQL");
            logger.LogInformation("Successfully seeded entity configuration data with {EntityTypeCount} entity types and their requirements", entityTypes.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding entity configuration data");
            throw;
        }
    }

    public static async Task SeedRolesAndUsersAsync(
        EntityConfigurationDbContext context,
        ILogger logger)
    {
        logger.LogInformation("Starting roles and users seed...");

        try
        {
            // Check if data already exists - check roles, users, permissions, and assignments
            var existingRoles = await context.Roles.CountAsync();
            var existingUsers = await context.Users.CountAsync();
            var existingPermissions = await context.Roles
                .SelectMany(r => r.Permissions)
                .CountAsync();
            var existingAssignments = await context.Users
                .SelectMany(u => u.RoleAssignments)
                .CountAsync();
            
            if (existingRoles > 0 && existingUsers > 0 && existingPermissions > 0 && existingAssignments > 0)
            {
                logger.LogInformation("Roles, users, permissions, and assignments already exist. Skipping seed.");
                return;
            }

            if (existingRoles > 0)
            {
                logger.LogInformation("Roles already exist ({Count} roles). Will create/update users, permissions, and assignments.", existingRoles);
            }
            else
            {
                logger.LogInformation("No roles found. Will create roles, users, and assignments.");
            }

            // Create Roles with specific GUIDs (only if they don't exist)
            List<Role> roles;
            if (existingRoles == 0)
            {
            var roleData = new[]
            {
                (Guid.Parse("550e8400-e29b-41d4-a716-446655440001"), "due-diligence-compliance-specialist", "Due Diligence Compliance Specialist", "Full access to compliance operations"),
                (Guid.Parse("550e8400-e29b-41d4-a716-446655440002"), "head-of-financial-crime", "Head of Financial Crime", "Full access to financial crime operations"),
                (Guid.Parse("550e8400-e29b-41d4-a716-446655440003"), "head-of-compliance", "Head of Compliance", "Full access to compliance management"),
                    (Guid.Parse("550e8400-e29b-41d4-a716-446655440004"), "group-legal-counsel", "Group Legal Counsel", "View Access, Internal Comments"),
                    (Guid.Parse("550e8400-e29b-41d4-a716-446655440005"), "commercial-team", "Commercial Team", "View Access, Internal Comments"),
                    (Guid.Parse("550e8400-e29b-41d4-a716-446655440006"), "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)", "View documents, provide comments on the High Risk Form and Sign / tick approve or decline"),
                (Guid.Parse("550e8400-e29b-41d4-a716-446655440007"), "due-diligence-compliance-administrator", "Due Diligence Compliance Administrator", "View submissions, allocate/assign cases, send canned responses, internal comments"),
                    (Guid.Parse("550e8400-e29b-41d4-a716-446655440008"), "amlco-mlro", "Anti Money Laundering Compliance Officers and Money Laundering Reporting Officers", "Corridor Specific - View documents, provide comments on the High Risk Form and Sign / tick approve or decline")
            };

                roles = new List<Role>();
            foreach (var (id, name, displayName, description) in roleData)
            {
                var role = new Role(name, displayName, description);
                roles.Add(role);
            }

            context.Roles.AddRange(roles);
            
            // Set IDs after adding to context so EF Core tracks them
            foreach (var (role, (id, _, _, _)) in roles.Zip(roleData))
            {
                var entry = context.Entry(role);
                entry.Property("Id").CurrentValue = id;
            }
            await context.SaveChangesAsync();
            logger.LogInformation("Created {Count} roles", roles.Count);

                // Reload roles fresh from database to avoid concurrency issues when adding permissions
                roles = await context.Roles.ToListAsync();
            }
            else
            {
                // Load existing roles - use tracking if we need to add permissions
                if (existingPermissions == 0)
                {
                    // Need to add permissions, so load with tracking
                    roles = await context.Roles
                        .Include(r => r.Permissions)
                        .ToListAsync();
                    logger.LogInformation("Using existing {Count} roles (will add permissions)", roles.Count);
                }
                else
                {
                    // Permissions already exist, no tracking needed
                    roles = await context.Roles
                        .AsNoTracking()
                        .ToListAsync();
                    logger.LogInformation("Using existing {Count} roles", roles.Count);
                }
            }

            // Add permissions to roles based on Required Access
            // Add permissions if roles were just created OR if permissions don't exist
            if (existingRoles == 0 || existingPermissions == 0)
            {
                var roleDict = roles.ToDictionary(r => r.Name, r => r);

                // Due Diligence Compliance Specialist - Full access
            var ddComplianceSpecialist = roleDict["due-diligence-compliance-specialist"];
            ddComplianceSpecialist.AddPermission("admin_access");
            ddComplianceSpecialist.AddPermission("view_dashboard");
            ddComplianceSpecialist.AddPermission("view_applications");
            ddComplianceSpecialist.AddPermission("view_work_queue");
            ddComplianceSpecialist.AddPermission("view_reports");
            ddComplianceSpecialist.AddPermission("view_audit_log");
            ddComplianceSpecialist.AddPermission("view_entity_types");
            ddComplianceSpecialist.AddPermission("view_users");
            ddComplianceSpecialist.AddPermission("view_roles");
            ddComplianceSpecialist.AddPermission("view_requirements");
            ddComplianceSpecialist.AddPermission("view_checklists");
            ddComplianceSpecialist.AddPermission("view_notifications");
            ddComplianceSpecialist.AddPermission("view_risk_review");
            ddComplianceSpecialist.AddPermission("view_approvals");
            ddComplianceSpecialist.AddPermission("create_application");
            ddComplianceSpecialist.AddPermission("edit_application");
            ddComplianceSpecialist.AddPermission("approve_application");
            ddComplianceSpecialist.AddPermission("reject_application");
            ddComplianceSpecialist.AddPermission("assign_work_item");
            ddComplianceSpecialist.AddPermission("complete_work_item");
            ddComplianceSpecialist.AddPermission("internal_comments");

            // Head of Financial Crime - Full access
            var headOfFinancialCrime = roleDict["head-of-financial-crime"];
            headOfFinancialCrime.AddPermission("admin_access");
            headOfFinancialCrime.AddPermission("view_dashboard");
            headOfFinancialCrime.AddPermission("view_applications");
            headOfFinancialCrime.AddPermission("view_work_queue");
            headOfFinancialCrime.AddPermission("view_reports");
            headOfFinancialCrime.AddPermission("view_audit_log");
            headOfFinancialCrime.AddPermission("view_entity_types");
            headOfFinancialCrime.AddPermission("view_users");
            headOfFinancialCrime.AddPermission("view_roles");
            headOfFinancialCrime.AddPermission("view_requirements");
            headOfFinancialCrime.AddPermission("view_checklists");
            headOfFinancialCrime.AddPermission("view_notifications");
            headOfFinancialCrime.AddPermission("view_risk_review");
            headOfFinancialCrime.AddPermission("view_approvals");
            headOfFinancialCrime.AddPermission("create_application");
            headOfFinancialCrime.AddPermission("edit_application");
            headOfFinancialCrime.AddPermission("approve_application");
            headOfFinancialCrime.AddPermission("reject_application");
            headOfFinancialCrime.AddPermission("assign_work_item");
            headOfFinancialCrime.AddPermission("complete_work_item");
            headOfFinancialCrime.AddPermission("internal_comments");

            // Head of Compliance - Full access
            var headOfCompliance = roleDict["head-of-compliance"];
            headOfCompliance.AddPermission("admin_access");
            headOfCompliance.AddPermission("view_dashboard");
            headOfCompliance.AddPermission("view_applications");
            headOfCompliance.AddPermission("view_work_queue");
            headOfCompliance.AddPermission("view_reports");
            headOfCompliance.AddPermission("view_audit_log");
            headOfCompliance.AddPermission("view_entity_types");
            headOfCompliance.AddPermission("view_users");
            headOfCompliance.AddPermission("view_roles");
            headOfCompliance.AddPermission("view_requirements");
            headOfCompliance.AddPermission("view_checklists");
            headOfCompliance.AddPermission("view_notifications");
            headOfCompliance.AddPermission("view_risk_review");
            headOfCompliance.AddPermission("view_approvals");
            headOfCompliance.AddPermission("create_application");
            headOfCompliance.AddPermission("edit_application");
            headOfCompliance.AddPermission("approve_application");
            headOfCompliance.AddPermission("reject_application");
            headOfCompliance.AddPermission("assign_work_item");
            headOfCompliance.AddPermission("complete_work_item");
            headOfCompliance.AddPermission("internal_comments");

            // Group Legal Counsel - View Access, Internal Comments
            var groupLegalCounsel = roleDict["group-legal-counsel"];
            groupLegalCounsel.AddPermission("view_dashboard");
            groupLegalCounsel.AddPermission("view_applications");
            groupLegalCounsel.AddPermission("view_work_queue");
            groupLegalCounsel.AddPermission("view_reports");
            groupLegalCounsel.AddPermission("view_audit_log");
            groupLegalCounsel.AddPermission("view_entity_types");
            groupLegalCounsel.AddPermission("view_requirements");
            groupLegalCounsel.AddPermission("view_checklists");
            groupLegalCounsel.AddPermission("view_notifications");
            groupLegalCounsel.AddPermission("view_risk_review");
            groupLegalCounsel.AddPermission("view_approvals");
            groupLegalCounsel.AddPermission("internal_comments");

            // Commercial Team - View Access, Internal Comments
            var commercialTeam = roleDict["commercial-team"];
            commercialTeam.AddPermission("view_dashboard");
            commercialTeam.AddPermission("view_applications");
            commercialTeam.AddPermission("view_work_queue");
            commercialTeam.AddPermission("view_reports");
            commercialTeam.AddPermission("view_audit_log");
            commercialTeam.AddPermission("view_entity_types");
            commercialTeam.AddPermission("view_requirements");
            commercialTeam.AddPermission("view_checklists");
            commercialTeam.AddPermission("view_notifications");
            commercialTeam.AddPermission("view_risk_review");
            commercialTeam.AddPermission("view_approvals");
            commercialTeam.AddPermission("internal_comments");

            // High Risk Signatory / AMLCO / MLRO - View documents, Provide comments on the High Risk Form and Sign / tick approve or decline
            var highRiskSignatory = roleDict["high-risk-signatory-amlco-mlro"];
            highRiskSignatory.AddPermission("view_applications");
            highRiskSignatory.AddPermission("view_documents");
            highRiskSignatory.AddPermission("view_risk_review");
            highRiskSignatory.AddPermission("comment_high_risk_form");
            highRiskSignatory.AddPermission("approve_application");
            highRiskSignatory.AddPermission("reject_application");

            // Due Diligence Compliance Administrator - View submissions, allocate/assign cases, send canned responses, internal comments
            var ddComplianceAdmin = roleDict["due-diligence-compliance-administrator"];
            ddComplianceAdmin.AddPermission("view_applications");
            ddComplianceAdmin.AddPermission("view_work_queue");
            ddComplianceAdmin.AddPermission("view_submissions");
            ddComplianceAdmin.AddPermission("assign_work_item");
            ddComplianceAdmin.AddPermission("send_canned_response");
            ddComplianceAdmin.AddPermission("internal_comments");

            // AMLCO / MLRO - View documents, Provide comments on the High Risk Form and Sign / tick approve or decline
            var amlcoMlro = roleDict["amlco-mlro"];
            amlcoMlro.AddPermission("view_applications");
            amlcoMlro.AddPermission("view_documents");
            amlcoMlro.AddPermission("view_risk_review");
            amlcoMlro.AddPermission("comment_high_risk_form");
            amlcoMlro.AddPermission("approve_application");
            amlcoMlro.AddPermission("reject_application");

            // Save permissions separately to avoid concurrency issues with role UpdatedAt
            try
            {
                await context.SaveChangesAsync();
                logger.LogInformation("Added permissions to roles");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // If concurrency exception, permissions might already be added
                // Try to insert permissions directly via SQL
                logger.LogWarning("Concurrency exception when saving permissions. Inserting permissions directly via SQL.");
                await InsertPermissionsViaSql(context, roleDict, logger);
            }
            }
            else
            {
                logger.LogInformation("Roles already exist with permissions. Skipping permission assignment.");
            }

            // Create Users with specific GUIDs (only if they don't exist)
            List<User> users;
            if (existingUsers == 0)
            {
            var now = DateTime.UtcNow;
            var userData = new[]
            {
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440001"), "monique@mukuru.com", "Monique Ebrahim"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440002"), "shumirai@mukuru.com", "Shumirai Mawoneke"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440003"), "leeann.pretorius@mukuru.com", "Lee-Ann Pretorius"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440004"), "phumelela.maliza@mukuru.com", "Phumelela Maliza"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440005"), "david@mukuru.com", "David Isenegger"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440006"), "nishan@mukuru.com", "Nishan Sing"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440007"), "dougal@mukuru.com", "Dougal Bennett"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440008"), "andy@mukuru.com", "Andy Jury"),
                (Guid.Parse("660e8400-e29b-41d4-a716-446655440009"), "lizl@mukuru.com", "Lizl")
            };

                users = new List<User>();
            foreach (var (id, email, name) in userData)
            {
                var user = new User(email, name);
                users.Add(user);
            }

            context.Users.AddRange(users);
            
            // Set IDs and login times after adding to context so EF Core tracks them
            foreach (var (user, (id, _, _)) in users.Zip(userData))
            {
                var entry = context.Entry(user);
                entry.Property("Id").CurrentValue = id;
                entry.Property("FirstLoginAt").CurrentValue = now;
                entry.Property("LastLoginAt").CurrentValue = now;
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Created {Count} users", users.Count);

                // Reload users fresh from database to avoid concurrency issues when assigning roles
                users = await context.Users.ToListAsync();
            }
            else
            {
                // Load existing users
                users = await context.Users.ToListAsync();
                logger.LogInformation("Using existing {Count} users", users.Count);
            }

            // Create role ID lookup - use AsNoTracking roles to avoid concurrency issues
            var roleIds = roles.ToDictionary(r => r.Name, r => r.Id);

            // Assign roles to users based on the provided data
            // Monique Ebrahim - Due Diligence Compliance Specialist
            var monique = users.First(u => u.Email == "monique@mukuru.com");
            monique.AssignRole(roleIds["due-diligence-compliance-specialist"], "due-diligence-compliance-specialist", "Due Diligence Compliance Specialist");

            // Shumirai Mawoneke - Due Diligence Compliance Specialist
            var shumirai = users.First(u => u.Email == "shumirai@mukuru.com");
            shumirai.AssignRole(roleIds["due-diligence-compliance-specialist"], "due-diligence-compliance-specialist", "Due Diligence Compliance Specialist");

            // Lee-Ann Pretorius - Head of Financial Crime / Head of Compliance
            var leeann = users.First(u => u.Email == "leeann.pretorius@mukuru.com");
            leeann.AssignRole(roleIds["head-of-financial-crime"], "head-of-financial-crime", "Head of Financial Crime");
            leeann.AssignRole(roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");

            // Phumelela Maliza - Head of Compliance / Acting Administrator / High-Risk Signatory
            var phumelela = users.First(u => u.Email == "phumelela.maliza@mukuru.com");
            phumelela.AssignRole(roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");
            phumelela.AssignRole(roleIds["due-diligence-compliance-administrator"], "due-diligence-compliance-administrator", "Due Diligence Compliance Administrator");
            phumelela.AssignRole(roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

            // David Isenegger - Group Legal Counsel / High-Risk Signatory
            var david = users.First(u => u.Email == "david@mukuru.com");
            david.AssignRole(roleIds["group-legal-counsel"], "group-legal-counsel", "Group Legal Counsel");
            david.AssignRole(roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

            // Nishan Sing - High-Risk Signatory
            var nishan = users.First(u => u.Email == "nishan@mukuru.com");
            nishan.AssignRole(roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

            // Dougal Bennett - High-Risk Signatory
            var dougal = users.First(u => u.Email == "dougal@mukuru.com");
            dougal.AssignRole(roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

            // Andy Jury - High-Risk Signatory
            var andy = users.First(u => u.Email == "andy@mukuru.com");
            andy.AssignRole(roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

            // Lizl - Full Admin Access (Head of Compliance)
            var lizl = users.First(u => u.Email == "lizl@mukuru.com");
            lizl.AssignRole(roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");

            // Save role assignments - handle concurrency exception by using SQL
            try
            {
            await context.SaveChangesAsync();
                logger.LogInformation("Successfully seeded roles and users with role assignments and permissions");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
            {
                // If concurrency exception, insert assignments directly via SQL
                logger.LogWarning("Concurrency exception when saving role assignments. Inserting assignments directly via SQL.");
                await InsertRoleAssignmentsViaSql(context, users, roleIds, logger);
                logger.LogInformation("Successfully seeded roles and users with role assignments and permissions");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding roles and users data");
            throw;
        }
    }

    public static async Task SeedWizardConfigurationsAsync(
        EntityConfigurationDbContext context,
        ILogger logger)
    {
        logger.LogInformation("Starting wizard configurations seed...");

        try
        {
            // Check if data already exists
            var existingConfigs = await context.WizardConfigurations.CountAsync();
            if (existingConfigs > 0)
            {
                logger.LogInformation("Wizard configurations already exist. Skipping seed.");
                return;
            }

            // Get all active entity types
            var entityTypes = await context.EntityTypes
                .Where(et => et.IsActive)
                .ToListAsync();

            if (!entityTypes.Any())
            {
                logger.LogWarning("No active entity types found. Skipping wizard configuration seed.");
                return;
            }

            // Create wizard configurations for each entity type
            foreach (var entityType in entityTypes)
            {
                var wizardConfig = new WizardConfiguration(entityType.Id);
                context.WizardConfigurations.Add(wizardConfig);

                // Create default wizard steps
                var steps = new List<WizardStep>
                {
                    new WizardStep(
                        wizardConfig.Id,
                        "Business Information",
                        "Company details and registration information",
                        "[\"INFORMATION\"]",
                        "Compliance",
                        1),
                    new WizardStep(
                        wizardConfig.Id,
                        "Identity Verification",
                        "Proof of identity documents and verification",
                        "[\"PROOF_OF_IDENTITY\"]",
                        "Identity",
                        2),
                    new WizardStep(
                        wizardConfig.Id,
                        "Address Verification",
                        "Proof of address documents",
                        "[\"PROOF_OF_ADDRESS\"]",
                        "Address",
                        3),
                    new WizardStep(
                        wizardConfig.Id,
                        "Ownership & Control",
                        "Shareholders, beneficial owners, and ownership structure",
                        "[\"OWNERSHIP_STRUCTURE\"]",
                        "Compliance",
                        4),
                    new WizardStep(
                        wizardConfig.Id,
                        "Management & Directors",
                        "Board of directors and key management personnel",
                        "[\"BOARD_DIRECTORS\"]",
                        "Compliance",
                        5),
                    new WizardStep(
                        wizardConfig.Id,
                        "Authorized Signatories",
                        "Persons authorized to sign on behalf of the entity",
                        "[\"AUTHORIZED_SIGNATORIES\"]",
                        "Compliance",
                        6),
                    new WizardStep(
                        wizardConfig.Id,
                        "Additional Documents",
                        "Any additional required documents and certificates",
                        "[\"DOCUMENTATION\"]",
                        "Documentation",
                        7)
                };

                wizardConfig.UpdateSteps(steps);
            }

            await context.SaveChangesAsync();
            logger.LogInformation("Successfully seeded wizard configurations for {Count} entity types", entityTypes.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error seeding wizard configurations data");
            throw;
        }
    }

    private static async Task InsertPermissionsViaSql(
        EntityConfigurationDbContext context,
        Dictionary<string, Role> roleDict,
        ILogger logger)
    {
        var permissionsByRole = new Dictionary<string, List<(string permission, string? resource)>>();
        
        // Due Diligence Compliance Specialist
        permissionsByRole["due-diligence-compliance-specialist"] = new List<(string, string?)>
        {
            ("admin_access", null), ("view_dashboard", null), ("view_applications", null),
            ("view_work_queue", null), ("view_reports", null), ("view_audit_log", null),
            ("view_entity_types", null), ("view_users", null), ("view_roles", null),
            ("view_requirements", null), ("view_checklists", null), ("view_notifications", null),
            ("view_risk_review", null), ("view_approvals", null), ("create_application", null),
            ("edit_application", null), ("approve_application", null), ("reject_application", null),
            ("assign_work_item", null), ("complete_work_item", null), ("internal_comments", null)
        };
        
        // Head of Financial Crime
        permissionsByRole["head-of-financial-crime"] = new List<(string, string?)>
        {
            ("admin_access", null), ("view_dashboard", null), ("view_applications", null),
            ("view_work_queue", null), ("view_reports", null), ("view_audit_log", null),
            ("view_entity_types", null), ("view_users", null), ("view_roles", null),
            ("view_requirements", null), ("view_checklists", null), ("view_notifications", null),
            ("view_risk_review", null), ("view_approvals", null), ("create_application", null),
            ("edit_application", null), ("approve_application", null), ("reject_application", null),
            ("assign_work_item", null), ("complete_work_item", null), ("internal_comments", null)
        };
        
        // Head of Compliance
        permissionsByRole["head-of-compliance"] = new List<(string, string?)>
        {
            ("admin_access", null), ("view_dashboard", null), ("view_applications", null),
            ("view_work_queue", null), ("view_reports", null), ("view_audit_log", null),
            ("view_entity_types", null), ("view_users", null), ("view_roles", null),
            ("view_requirements", null), ("view_checklists", null), ("view_notifications", null),
            ("view_risk_review", null), ("view_approvals", null), ("create_application", null),
            ("edit_application", null), ("approve_application", null), ("reject_application", null),
            ("assign_work_item", null), ("complete_work_item", null), ("internal_comments", null)
        };
        
        // Group Legal Counsel
        permissionsByRole["group-legal-counsel"] = new List<(string, string?)>
        {
            ("view_dashboard", null), ("view_applications", null), ("view_work_queue", null),
            ("view_reports", null), ("view_audit_log", null), ("view_entity_types", null),
            ("view_requirements", null), ("view_checklists", null), ("view_notifications", null),
            ("view_risk_review", null), ("view_approvals", null), ("internal_comments", null)
        };
        
        // Commercial Team
        permissionsByRole["commercial-team"] = new List<(string, string?)>
        {
            ("view_dashboard", null), ("view_applications", null), ("view_work_queue", null),
            ("view_reports", null), ("view_audit_log", null), ("view_entity_types", null),
            ("view_requirements", null), ("view_checklists", null), ("view_notifications", null),
            ("view_risk_review", null), ("view_approvals", null), ("internal_comments", null)
        };
        
        // High Risk Signatory
        permissionsByRole["high-risk-signatory-amlco-mlro"] = new List<(string, string?)>
        {
            ("view_applications", null), ("view_documents", null), ("view_risk_review", null),
            ("comment_high_risk_form", null), ("approve_application", null), ("reject_application", null)
        };
        
        // Due Diligence Compliance Administrator
        permissionsByRole["due-diligence-compliance-administrator"] = new List<(string, string?)>
        {
            ("view_applications", null), ("view_work_queue", null), ("view_submissions", null),
            ("assign_work_item", null), ("send_canned_response", null), ("internal_comments", null)
        };
        
        // AMLCO / MLRO
        permissionsByRole["amlco-mlro"] = new List<(string, string?)>
        {
            ("view_applications", null), ("view_documents", null), ("view_risk_review", null),
            ("comment_high_risk_form", null), ("approve_application", null), ("reject_application", null)
        };

        foreach (var (roleName, permissions) in permissionsByRole)
        {
            if (!roleDict.ContainsKey(roleName)) continue;
            var role = roleDict[roleName];
            
            foreach (var (permission, resource) in permissions)
            {
                if (resource == null)
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO entity_configuration.role_permissions (""Id"", role_id, permission_name, resource, is_active, created_at)
                        VALUES (gen_random_uuid(), {0}::uuid, {1}, NULL, true, NOW())
                        ON CONFLICT DO NOTHING",
                        role.Id, permission);
                }
                else
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO entity_configuration.role_permissions (""Id"", role_id, permission_name, resource, is_active, created_at)
                        VALUES (gen_random_uuid(), {0}::uuid, {1}, {2}, true, NOW())
                        ON CONFLICT DO NOTHING",
                        role.Id, permission, resource);
                }
            }
        }
        
        logger.LogInformation("Inserted permissions via SQL for all roles");
    }

    private static async Task InsertRoleAssignmentsViaSql(
        EntityConfigurationDbContext context,
        List<User> users,
        Dictionary<string, Guid> roleIds,
        ILogger logger)
    {
        // Monique Ebrahim - Due Diligence Compliance Specialist
        var monique = users.First(u => u.Email == "monique@mukuru.com");
        await InsertUserRoleAssignment(context, monique.Id, roleIds["due-diligence-compliance-specialist"], "due-diligence-compliance-specialist", "Due Diligence Compliance Specialist");

        // Shumirai Mawoneke - Due Diligence Compliance Specialist
        var shumirai = users.First(u => u.Email == "shumirai@mukuru.com");
        await InsertUserRoleAssignment(context, shumirai.Id, roleIds["due-diligence-compliance-specialist"], "due-diligence-compliance-specialist", "Due Diligence Compliance Specialist");

        // Lee-Ann Pretorius - Head of Financial Crime / Head of Compliance
        var leeann = users.First(u => u.Email == "leeann.pretorius@mukuru.com");
        await InsertUserRoleAssignment(context, leeann.Id, roleIds["head-of-financial-crime"], "head-of-financial-crime", "Head of Financial Crime");
        await InsertUserRoleAssignment(context, leeann.Id, roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");

        // Phumelela Maliza - Head of Compliance / Acting Administrator / High-Risk Signatory
        var phumelela = users.First(u => u.Email == "phumelela.maliza@mukuru.com");
        await InsertUserRoleAssignment(context, phumelela.Id, roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");
        await InsertUserRoleAssignment(context, phumelela.Id, roleIds["due-diligence-compliance-administrator"], "due-diligence-compliance-administrator", "Due Diligence Compliance Administrator");
        await InsertUserRoleAssignment(context, phumelela.Id, roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

        // David Isenegger - Group Legal Counsel / High-Risk Signatory
        var david = users.First(u => u.Email == "david@mukuru.com");
        await InsertUserRoleAssignment(context, david.Id, roleIds["group-legal-counsel"], "group-legal-counsel", "Group Legal Counsel");
        await InsertUserRoleAssignment(context, david.Id, roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

        // Nishan Sing - High-Risk Signatory
        var nishan = users.First(u => u.Email == "nishan@mukuru.com");
        await InsertUserRoleAssignment(context, nishan.Id, roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

        // Dougal Bennett - High-Risk Signatory
        var dougal = users.First(u => u.Email == "dougal@mukuru.com");
        await InsertUserRoleAssignment(context, dougal.Id, roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

        // Andy Jury - High-Risk Signatory
        var andy = users.First(u => u.Email == "andy@mukuru.com");
        await InsertUserRoleAssignment(context, andy.Id, roleIds["high-risk-signatory-amlco-mlro"], "high-risk-signatory-amlco-mlro", "High Risk Signatory / AMLCO / MLRO (Corridor Specific)");

        // Lizl - Full Admin Access (Head of Compliance)
        var lizl = users.First(u => u.Email == "lizl@mukuru.com");
        await InsertUserRoleAssignment(context, lizl.Id, roleIds["head-of-compliance"], "head-of-compliance", "Head of Compliance");

        logger.LogInformation("Inserted role assignments via SQL for all users");
    }

    private static async Task InsertUserRoleAssignment(
        EntityConfigurationDbContext context,
        Guid userId,
        Guid roleId,
        string roleName,
        string roleDisplayName)
    {
        await context.Database.ExecuteSqlRawAsync(@"
            INSERT INTO entity_configuration.user_role_assignments (""Id"", user_id, role_id, role_name, role_display_name, is_active, created_at)
            VALUES (gen_random_uuid(), {0}::uuid, {1}::uuid, {2}, {3}, true, NOW())
            ON CONFLICT DO NOTHING",
            userId, roleId, roleName, roleDisplayName);
    }

}
