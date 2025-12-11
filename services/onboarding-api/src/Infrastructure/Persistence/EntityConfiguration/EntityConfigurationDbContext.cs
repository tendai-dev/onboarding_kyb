using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using OnboardingApi.Domain.EntityConfiguration.Aggregates;
using System;

namespace OnboardingApi.Infrastructure.Persistence.EntityConfiguration;

public class EntityConfigurationDbContext : DbContext
{
    public EntityConfigurationDbContext(DbContextOptions<EntityConfigurationDbContext> options)
        : base(options)
    {
    }

    public DbSet<EntityType> EntityTypes => Set<EntityType>();
    public DbSet<Requirement> Requirements => Set<Requirement>();
    // EntityTypeRequirement is an owned entity, accessed through EntityType.Requirements
    public DbSet<WizardConfiguration> WizardConfigurations => Set<WizardConfiguration>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    
    // Country Configuration entities
    public DbSet<CountryProfile> CountryProfiles => Set<CountryProfile>();
    public DbSet<CountryEntityTypeOverride> CountryEntityTypeOverrides => Set<CountryEntityTypeOverride>();
    public DbSet<CountryTerminologyOverride> CountryTerminologyOverrides => Set<CountryTerminologyOverride>();
    public DbSet<CountryFormBundle> CountryFormBundles => Set<CountryFormBundle>();
    public DbSet<CountryFieldVisibilityRule> CountryFieldVisibilityRules => Set<CountryFieldVisibilityRule>();
    public DbSet<CountryComplianceToggle> CountryComplianceToggles => Set<CountryComplianceToggle>();
    public DbSet<ConfigurationTag> ConfigurationTags => Set<ConfigurationTag>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Ensure all DateTime values are UTC before saving and auto-update UpdatedAt
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            // Auto-update UpdatedAt for modified entities
            // Only update if there are actual property changes (not just owned collection changes)
            if (entry.State == EntityState.Modified)
            {
                var updatedAtProperty = entry.Properties.FirstOrDefault(p => p.Metadata.Name == "UpdatedAt");
                if (updatedAtProperty != null)
                {
                    // Check if any non-navigation, non-UpdatedAt properties are actually modified
                    // Exclude: primary keys, foreign keys, and UpdatedAt itself
                    var hasPropertyChanges = entry.Properties
                        .Any(p => p.IsModified && 
                             !p.Metadata.IsPrimaryKey() && 
                             p.Metadata.Name != "UpdatedAt" &&
                             !p.Metadata.IsForeignKey());
                    
                    // Only update UpdatedAt if there are actual property changes
                    // For owned collection changes (EntityTypeRequirement, etc.), we don't update UpdatedAt
                    // to avoid concurrency issues when adding requirements sequentially
                    if (hasPropertyChanges)
                    {
                        updatedAtProperty.CurrentValue = DateTime.UtcNow;
                    }
                    else
                    {
                        // For owned collection-only changes, mark UpdatedAt as not modified
                        // This prevents EF Core from including it in the UPDATE statement
                        // The original value will be used for any concurrency checks, but since we
                        // reload the entity fresh before each save, we have the latest value
                        updatedAtProperty.IsModified = false;
                    }
                }
            }
            
            foreach (var property in entry.Properties)
            {
                var clrType = Nullable.GetUnderlyingType(property.Metadata.ClrType) ?? property.Metadata.ClrType;
                
                if (clrType == typeof(DateTime) && property.CurrentValue != null)
                {
                    var dateTime = (DateTime)property.CurrentValue;
                    if (dateTime.Kind != DateTimeKind.Utc)
                    {
                        property.CurrentValue = dateTime.Kind == DateTimeKind.Unspecified
                            ? DateTime.SpecifyKind(dateTime, DateTimeKind.Utc)
                            : dateTime.ToUniversalTime();
                    }
                }
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Use entity_configuration schema for separation
        modelBuilder.HasDefaultSchema("entity_configuration");

        // EntityType configuration
        modelBuilder.Entity<EntityType>(entity =>
        {
            entity.ToTable("entity_types", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("code");
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("display_name");
            
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("description");
            
            entity.Property(e => e.Icon)
                .HasMaxLength(100)
                .HasColumnName("icon");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.HasIndex(e => e.Code)
                .IsUnique();

            // Configure the backing field for Requirements
            entity.OwnsMany(e => e.Requirements, requirement =>
            {
                requirement.ToTable("entity_type_requirements", "entity_configuration");
                requirement.HasKey(r => r.Id);
                requirement.Property(r => r.EntityTypeId).HasColumnName("entity_type_id");
                requirement.Property(r => r.RequirementId).HasColumnName("requirement_id");
                requirement.Property(r => r.IsRequired).HasColumnName("is_required");
                requirement.Property(r => r.DisplayOrder).HasColumnName("display_order");
                requirement.Property(r => r.CreatedAt).HasColumnName("created_at");
                requirement.Property(r => r.UpdatedAt).HasColumnName("updated_at");
            });
        });

        // Requirement configuration
        modelBuilder.Entity<Requirement>(entity =>
        {
            entity.ToTable("requirements", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("code");
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("display_name");
            
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000)
                .HasColumnName("description");
            
            entity.Property(e => e.Type)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("type");
            
            entity.Property(e => e.FieldType)
                .IsRequired()
                .HasMaxLength(50)
                .HasColumnName("field_type");
            
            entity.Property(e => e.ValidationRules)
                .HasMaxLength(2000)
                .HasColumnName("validation_rules");
            
            entity.Property(e => e.HelpText)
                .HasMaxLength(500)
                .HasColumnName("help_text");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.HasIndex(e => e.Code)
                .IsUnique();
        });

        // WizardConfiguration configuration
        modelBuilder.Entity<WizardConfiguration>(entity =>
        {
            entity.ToTable("wizard_configurations", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.EntityTypeId)
                .IsRequired()
                .HasColumnName("entity_type_id");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.HasIndex(e => e.EntityTypeId)
                .IsUnique();

            // Configure the backing field for Steps
            entity.OwnsMany(e => e.Steps, step =>
            {
                step.ToTable("wizard_steps", "entity_configuration");
                step.HasKey(s => s.Id);
                step.Property(s => s.WizardConfigurationId).HasColumnName("wizard_configuration_id");
                step.Property(s => s.Title).IsRequired().HasMaxLength(200).HasColumnName("title");
                step.Property(s => s.Subtitle).IsRequired().HasMaxLength(500).HasColumnName("subtitle");
                step.Property(s => s.RequirementTypes).IsRequired().HasMaxLength(2000).HasColumnName("requirement_types");
                step.Property(s => s.ChecklistCategory).IsRequired().HasMaxLength(100).HasColumnName("checklist_category");
                step.Property(s => s.StepNumber).IsRequired().HasColumnName("step_number");
                step.Property(s => s.IsActive).IsRequired().HasColumnName("is_active");
                step.Property(s => s.CreatedAt).IsRequired().HasColumnName("created_at");
                step.Property(s => s.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });
        });

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(100)
                .HasColumnName("name");
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("display_name");
            
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.HasIndex(e => e.Name)
                .IsUnique();

            // Configure the backing field for Permissions
            entity.OwnsMany(e => e.Permissions, permission =>
            {
                permission.ToTable("role_permissions", "entity_configuration");
                permission.HasKey(p => p.Id);
                permission.Property(p => p.RoleId).HasColumnName("role_id");
                permission.Property(p => p.PermissionName).IsRequired().HasMaxLength(200).HasColumnName("permission_name");
                permission.Property(p => p.Resource).HasMaxLength(200).HasColumnName("resource");
                permission.Property(p => p.IsActive).IsRequired().HasColumnName("is_active");
                permission.Property(p => p.CreatedAt).IsRequired().HasColumnName("created_at");
            });
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("email");
            
            entity.Property(e => e.Name)
                .HasMaxLength(200)
                .HasColumnName("name");
            
            entity.Property(e => e.FirstLoginAt)
                .HasColumnName("first_login_at");
            
            entity.Property(e => e.LastLoginAt)
                .HasColumnName("last_login_at");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");

            entity.HasIndex(e => e.Email)
                .IsUnique();

            // Configure the backing field for Permissions
            entity.OwnsMany(e => e.Permissions, permission =>
            {
                permission.ToTable("user_permissions", "entity_configuration");
                permission.HasKey(p => p.Id);
                permission.Property(p => p.UserId).HasColumnName("user_id");
                permission.Property(p => p.PermissionName).IsRequired().HasMaxLength(200).HasColumnName("permission_name");
                permission.Property(p => p.Resource).HasMaxLength(200).HasColumnName("resource");
                permission.Property(p => p.Description).HasMaxLength(1000).HasColumnName("description");
                permission.Property(p => p.IsActive).IsRequired().HasColumnName("is_active");
                permission.Property(p => p.CreatedAt).IsRequired().HasColumnName("created_at");
                permission.Property(p => p.CreatedBy).HasMaxLength(255).HasColumnName("created_by");
            });

            // Configure the backing field for RoleAssignments
            entity.OwnsMany(e => e.RoleAssignments, assignment =>
            {
                assignment.ToTable("user_role_assignments", "entity_configuration");
                assignment.HasKey(a => a.Id);
                assignment.Property(a => a.UserId).HasColumnName("user_id");
                assignment.Property(a => a.RoleId).HasColumnName("role_id");
                assignment.Property(a => a.RoleName).IsRequired().HasMaxLength(100).HasColumnName("role_name");
                assignment.Property(a => a.RoleDisplayName).IsRequired().HasMaxLength(200).HasColumnName("role_display_name");
                assignment.Property(a => a.IsActive).IsRequired().HasColumnName("is_active");
                assignment.Property(a => a.CreatedAt).IsRequired().HasColumnName("created_at");
            });
        });

        // CountryProfile configuration
        modelBuilder.Entity<CountryProfile>(entity =>
        {
            entity.ToTable("country_profiles", "entity_configuration");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.CountryCode)
                .IsRequired()
                .HasMaxLength(10)
                .HasColumnName("country_code");
            
            entity.Property(e => e.CountryName)
                .IsRequired()
                .HasMaxLength(200)
                .HasColumnName("country_name");
            
            entity.Property(e => e.Description)
                .HasMaxLength(1000)
                .HasColumnName("description");
            
            entity.Property(e => e.IsActive)
                .IsRequired()
                .HasColumnName("is_active");
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasColumnName("created_at");
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasColumnName("updated_at");
            
            entity.Property(e => e.CreatedBy)
                .IsRequired()
                .HasMaxLength(255)
                .HasColumnName("created_by");
            
            entity.Property(e => e.UpdatedBy)
                .HasMaxLength(255)
                .HasColumnName("updated_by");

            entity.HasIndex(e => e.CountryCode)
                .IsUnique();

            // Configure owned collections
            entity.OwnsMany(e => e.EntityTypeOverrides, overrideConfig =>
            {
                overrideConfig.ToTable("country_entity_type_overrides", "entity_configuration");
                overrideConfig.HasKey(o => o.Id);
                overrideConfig.Property(o => o.CountryProfileId).HasColumnName("country_profile_id");
                overrideConfig.Property(o => o.EntityTypeId).HasColumnName("entity_type_id");
                overrideConfig.Property(o => o.IsEnabled).IsRequired().HasColumnName("is_enabled");
                overrideConfig.Property(o => o.CustomDisplayName).HasMaxLength(200).HasColumnName("custom_display_name");
                overrideConfig.Property(o => o.CustomDescription).HasMaxLength(1000).HasColumnName("custom_description");
                overrideConfig.Property(o => o.DisplayOrder).IsRequired().HasColumnName("display_order");
                overrideConfig.Property(o => o.CreatedAt).IsRequired().HasColumnName("created_at");
                overrideConfig.Property(o => o.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });

            entity.OwnsMany(e => e.TerminologyOverrides, overrideConfig =>
            {
                overrideConfig.ToTable("country_terminology_overrides", "entity_configuration");
                overrideConfig.HasKey(o => o.Id);
                overrideConfig.Property(o => o.CountryProfileId).HasColumnName("country_profile_id");
                overrideConfig.Property(o => o.TargetType).IsRequired().HasMaxLength(50).HasColumnName("target_type");
                overrideConfig.Property(o => o.TargetCode).IsRequired().HasMaxLength(100).HasColumnName("target_code");
                overrideConfig.Property(o => o.OverrideDisplayName).HasMaxLength(200).HasColumnName("override_display_name");
                overrideConfig.Property(o => o.OverrideDescription).HasMaxLength(1000).HasColumnName("override_description");
                overrideConfig.Property(o => o.OverrideHelpText).HasMaxLength(500).HasColumnName("override_help_text");
                overrideConfig.Property(o => o.OverridePlaceholder).HasMaxLength(200).HasColumnName("override_placeholder");
                overrideConfig.Property(o => o.CreatedAt).IsRequired().HasColumnName("created_at");
                overrideConfig.Property(o => o.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });

            entity.OwnsMany(e => e.FormBundles, bundle =>
            {
                bundle.ToTable("country_form_bundles", "entity_configuration");
                bundle.HasKey(b => b.Id);
                bundle.Property(b => b.CountryProfileId).HasColumnName("country_profile_id");
                bundle.Property(b => b.EntityTypeId).HasColumnName("entity_type_id");
                bundle.Property(b => b.BundleName).IsRequired().HasMaxLength(200).HasColumnName("bundle_name");
                bundle.Property(b => b.Description).HasMaxLength(1000).HasColumnName("description");
                bundle.Property(b => b.IsActive).IsRequired().HasColumnName("is_active");
                bundle.Property(b => b.FieldConfigurationJson).IsRequired().HasColumnType("jsonb").HasColumnName("field_configuration_json");
                bundle.Property(b => b.CreatedAt).IsRequired().HasColumnName("created_at");
                bundle.Property(b => b.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });

            entity.OwnsMany(e => e.FieldVisibilityRules, rule =>
            {
                rule.ToTable("country_field_visibility_rules", "entity_configuration");
                rule.HasKey(r => r.Id);
                rule.Property(r => r.CountryProfileId).HasColumnName("country_profile_id");
                rule.Property(r => r.TargetFieldCode).IsRequired().HasMaxLength(100).HasColumnName("target_field_code");
                rule.Property(r => r.EntityTypeId).HasColumnName("entity_type_id");
                rule.Property(r => r.RuleExpression).IsRequired().HasColumnType("jsonb").HasColumnName("rule_expression");
                rule.Property(r => r.IsVisible).IsRequired().HasColumnName("is_visible");
                rule.Property(r => r.Priority).IsRequired().HasColumnName("priority");
                rule.Property(r => r.IsActive).IsRequired().HasColumnName("is_active");
                rule.Property(r => r.CreatedAt).IsRequired().HasColumnName("created_at");
                rule.Property(r => r.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });

            entity.OwnsMany(e => e.ComplianceToggles, toggle =>
            {
                toggle.ToTable("country_compliance_toggles", "entity_configuration");
                toggle.HasKey(t => t.Id);
                toggle.Property(t => t.CountryProfileId).HasColumnName("country_profile_id");
                toggle.Property(t => t.ComplianceCode).IsRequired().HasMaxLength(100).HasColumnName("compliance_code");
                toggle.Property(t => t.ComplianceName).IsRequired().HasMaxLength(200).HasColumnName("compliance_name");
                toggle.Property(t => t.Description).HasMaxLength(1000).HasColumnName("description");
                toggle.Property(t => t.IsEnabled).IsRequired().HasColumnName("is_enabled");
                toggle.Property(t => t.ConfigurationJson).HasColumnType("jsonb").HasColumnName("configuration_json");
                toggle.Property(t => t.CreatedAt).IsRequired().HasColumnName("created_at");
                toggle.Property(t => t.UpdatedAt).IsRequired().HasColumnName("updated_at");
            });

            entity.OwnsMany(e => e.Tags, tag =>
            {
                tag.ToTable("configuration_tags", "entity_configuration");
                tag.HasKey(t => t.Id);
                tag.Property(t => t.CountryProfileId).HasColumnName("country_profile_id");
                tag.Property(t => t.TagName).IsRequired().HasMaxLength(100).HasColumnName("tag_name");
                tag.Property(t => t.TagValue).HasMaxLength(200).HasColumnName("tag_value");
                tag.Property(t => t.CreatedAt).IsRequired().HasColumnName("created_at");
            });
        });
    }
}
