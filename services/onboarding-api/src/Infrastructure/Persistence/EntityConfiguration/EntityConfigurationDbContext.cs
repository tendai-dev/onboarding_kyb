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
    public DbSet<EntityTypeRequirement> EntityTypeRequirements => Set<EntityTypeRequirement>();
    public DbSet<WizardConfiguration> WizardConfigurations => Set<WizardConfiguration>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Ensure all DateTime values are UTC before saving
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
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
    }
}
