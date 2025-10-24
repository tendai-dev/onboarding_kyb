using EntityConfigurationService.Domain.Aggregates;
using Microsoft.EntityFrameworkCore;

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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // EntityType configuration
        modelBuilder.Entity<EntityType>(entity =>
        {
            entity.ToTable("entity_types");
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
            
            entity.Property(e => e.IsActive)
                .IsRequired();
            
            entity.Property(e => e.CreatedAt)
                .IsRequired();
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired();

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
            entity.ToTable("requirements");
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
                .IsRequired();
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired();

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
            entity.ToTable("entity_type_requirements");
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
                .IsRequired();
            
            entity.Property(e => e.UpdatedAt)
                .IsRequired();

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
            entity.ToTable("requirement_options");
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
    }
}
