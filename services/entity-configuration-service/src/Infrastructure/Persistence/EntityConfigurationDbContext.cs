using EntityConfigurationService.Domain.Aggregates;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;

namespace EntityConfigurationService.Infrastructure.Persistence;

public class EntityConfigurationDbContext : DbContext
{
    public EntityConfigurationDbContext(DbContextOptions<EntityConfigurationDbContext> options)
        : base(options)
    {
    }

    public DbSet<EntityType> EntityTypes => Set<EntityType>();
    public DbSet<Requirement> Requirements => Set<Requirement>();
    public DbSet<EntityTypeRequirement> EntityTypeRequirements => Set<EntityTypeRequirement>();
    public DbSet<RequirementOption> RequirementOptions => Set<RequirementOption>();
    public DbSet<WizardConfiguration> WizardConfigurations => Set<WizardConfiguration>();
    public DbSet<WizardStep> WizardSteps => Set<WizardStep>();
    public DbSet<WizardStepRequirementType> WizardStepRequirementTypes => Set<WizardStepRequirementType>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserPermission> UserPermissions => Set<UserPermission>();
    public DbSet<PermissionRule> PermissionRules => Set<PermissionRule>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();

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

        // EntityType configuration
        modelBuilder.Entity<EntityType>(entity =>
        {
            entity.ToTable("EntityTypes");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000);
            
            entity.Property(e => e.Icon)
                .HasColumnName("icon")
                .HasColumnType("varchar(100)");
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.Code)
                .IsUnique();

            // Configure the backing field for Requirements
            entity.HasMany(e => e.Requirements)
                .WithOne(etr => etr.EntityType)
                .HasForeignKey(etr => etr.EntityTypeId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Requirement configuration
        modelBuilder.Entity<Requirement>(entity =>
        {
            entity.ToTable("Requirements");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Code)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(1000);
            
            entity.Property(e => e.Type)
                .IsRequired()
                .HasConversion<int>();
            
            entity.Property(e => e.FieldType)
                .IsRequired()
                .HasConversion<int>();
            
            entity.Property(e => e.ValidationRules)
                .HasMaxLength(2000);
            
            entity.Property(e => e.HelpText)
                .HasMaxLength(500);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.Code)
                .IsUnique();

            // Configure the backing field for Options
            entity.HasMany(e => e.Options)
                .WithOne(o => o.Requirement)
                .HasForeignKey(o => o.RequirementId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EntityTypeRequirement configuration (join table)
        modelBuilder.Entity<EntityTypeRequirement>(entity =>
        {
            entity.ToTable("EntityTypeRequirements");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.EntityTypeId)
                .IsRequired();
            
            entity.Property(e => e.RequirementId)
                .IsRequired();
            
            entity.Property(e => e.IsRequired)
                .IsRequired();
            
            entity.Property(e => e.DisplayOrder)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => new { e.EntityTypeId, e.RequirementId })
                .IsUnique();

            entity.HasOne(e => e.Requirement)
                .WithMany()
                .HasForeignKey(e => e.RequirementId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // RequirementOption configuration
        modelBuilder.Entity<RequirementOption>(entity =>
        {
            entity.ToTable("RequirementOptions");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.RequirementId)
                .IsRequired();
            
            entity.Property(e => e.Value)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.DisplayText)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.DisplayOrder)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.HasIndex(e => new { e.RequirementId, e.Value })
                .IsUnique();
        });

        // WizardConfiguration configuration
        modelBuilder.Entity<WizardConfiguration>(entity =>
        {
            entity.ToTable("WizardConfigurations");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.EntityTypeId)
                .IsRequired();
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.EntityTypeId)
                .IsUnique();

            entity.HasOne(e => e.EntityType)
                .WithMany()
                .HasForeignKey(e => e.EntityTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Steps)
                .WithOne(s => s.WizardConfiguration)
                .HasForeignKey(s => s.WizardConfigurationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WizardStep configuration
        modelBuilder.Entity<WizardStep>(entity =>
        {
            entity.ToTable("WizardSteps");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.WizardConfigurationId)
                .IsRequired();
            
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Subtitle)
                .IsRequired()
                .HasMaxLength(500);
            
            entity.Property(e => e.ChecklistCategory)
                .IsRequired()
                .HasMaxLength(100);
            
            entity.Property(e => e.StepNumber)
                .IsRequired();
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasMany(e => e.RequirementTypes)
                .WithOne(rt => rt.WizardStep)
                .HasForeignKey(rt => rt.WizardStepId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WizardStepRequirementType configuration
        modelBuilder.Entity<WizardStepRequirementType>(entity =>
        {
            entity.ToTable("WizardStepRequirementTypes");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.WizardStepId)
                .IsRequired();
            
            entity.Property(e => e.RequirementType)
                .IsRequired()
                .HasMaxLength(100);

            entity.HasIndex(e => new { e.WizardStepId, e.RequirementType })
                .IsUnique();
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Email)
                .IsRequired()
                .HasMaxLength(255);
            
            entity.Property(e => e.Name)
                .HasMaxLength(200);
            
            entity.Property(e => e.FirstLoginAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.LastLoginAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.Email)
                .IsUnique();

            entity.HasMany(e => e.Permissions)
                .WithOne(p => p.User)
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasMany(e => e.Roles)
                .WithOne(ur => ur.User)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserPermission configuration
        modelBuilder.Entity<UserPermission>(entity =>
        {
            entity.ToTable("UserPermissions");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.UserId)
                .IsRequired();
            
            entity.Property(e => e.PermissionName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Resource)
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .HasMaxLength(500);
            
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(255);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => new { e.UserId, e.PermissionName, e.Resource })
                .IsUnique();
        });

        // PermissionRule configuration
        modelBuilder.Entity<PermissionRule>(entity =>
        {
            entity.ToTable("PermissionRules");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .HasMaxLength(500);
            
            entity.Property(e => e.Category)
                .HasMaxLength(100);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.Name)
                .IsUnique();
        });

        // Role configuration
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Name)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.DisplayName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Description)
                .HasMaxLength(500);
            
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(255);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => e.Name)
                .IsUnique();

            entity.HasMany(e => e.Permissions)
                .WithOne(rp => rp.Role)
                .HasForeignKey(rp => rp.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasMany(e => e.UserRoles)
                .WithOne(ur => ur.Role)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RolePermission configuration
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("RolePermissions");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.RoleId)
                .IsRequired();
            
            entity.Property(e => e.PermissionName)
                .IsRequired()
                .HasMaxLength(200);
            
            entity.Property(e => e.Resource)
                .HasMaxLength(200);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => new { e.RoleId, e.PermissionName, e.Resource })
                .IsUnique();
        });

        // UserRole configuration
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("UserRoles");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.UserId)
                .IsRequired();
            
            entity.Property(e => e.RoleId)
                .IsRequired();
            
            entity.Property(e => e.CreatedBy)
                .HasMaxLength(255);
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired()
                .HasConversion(
                    v => v.Kind == DateTimeKind.Unspecified ? DateTime.SpecifyKind(v, DateTimeKind.Utc) : v.ToUniversalTime(),
                    v => DateTime.SpecifyKind(v, DateTimeKind.Utc));

            entity.HasIndex(e => new { e.UserId, e.RoleId })
                .IsUnique();
        });
    }
}
