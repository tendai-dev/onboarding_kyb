using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OnboardingApi.Domain.Aggregates;
using OnboardingApi.Domain.ValueObjects;
using System.Text.Json;

namespace OnboardingApi.Infrastructure.Persistence.Configurations;

/// <summary>
/// EF Core entity configuration for OnboardingCase
/// </summary>
public class OnboardingCaseConfiguration : IEntityTypeConfiguration<OnboardingCase>
{
    public void Configure(EntityTypeBuilder<OnboardingCase> builder)
    {
        builder.ToTable("onboarding_cases");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(e => e.CaseNumber)
            .HasColumnName("case_number")
            .HasMaxLength(50)
            .IsRequired();

        builder.HasIndex(e => e.CaseNumber)
            .IsUnique();

        builder.Property(e => e.Type)
            .HasColumnName("type")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(e => e.PartnerId)
            .HasColumnName("partner_id")
            .IsRequired();

        builder.HasIndex(e => e.PartnerId);

        builder.Property(e => e.PartnerReferenceId)
            .HasColumnName("partner_reference_id")
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(e => e.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("updated_at")
            .IsRequired();

        builder.Property(e => e.CreatedBy)
            .HasColumnName("created_by")
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(e => e.UpdatedBy)
            .HasColumnName("updated_by")
            .HasMaxLength(255);

        // Owned types for value objects
        builder.OwnsOne(e => e.Applicant, applicant =>
        {
            applicant.Property(a => a.FirstName).HasColumnName("applicant_first_name").HasMaxLength(100).IsRequired();
            applicant.Property(a => a.LastName).HasColumnName("applicant_last_name").HasMaxLength(100).IsRequired();
            applicant.Property(a => a.MiddleName).HasColumnName("applicant_middle_name").HasMaxLength(100);
            applicant.Property(a => a.DateOfBirth).HasColumnName("applicant_date_of_birth").IsRequired();
            applicant.Property(a => a.Email).HasColumnName("applicant_email").HasMaxLength(255).IsRequired();
            applicant.Property(a => a.PhoneNumber).HasColumnName("applicant_phone_number").HasMaxLength(50).IsRequired();
            applicant.Property(a => a.Nationality).HasColumnName("applicant_nationality").HasMaxLength(2).IsRequired();
            applicant.Property(a => a.TaxId).HasColumnName("applicant_tax_id").HasMaxLength(50);
            applicant.Property(a => a.PassportNumber).HasColumnName("applicant_passport_number").HasMaxLength(50);
            applicant.Property(a => a.DriversLicenseNumber).HasColumnName("applicant_drivers_license").HasMaxLength(50);

            applicant.OwnsOne(a => a.ResidentialAddress, address =>
            {
                address.Property(ad => ad.Street).HasColumnName("applicant_address_street").HasMaxLength(255).IsRequired();
                address.Property(ad => ad.Street2).HasColumnName("applicant_address_street2").HasMaxLength(255);
                address.Property(ad => ad.City).HasColumnName("applicant_address_city").HasMaxLength(100).IsRequired();
                address.Property(ad => ad.State).HasColumnName("applicant_address_state").HasMaxLength(100).IsRequired();
                address.Property(ad => ad.PostalCode).HasColumnName("applicant_address_postal_code").HasMaxLength(20).IsRequired();
                address.Property(ad => ad.Country).HasColumnName("applicant_address_country").HasMaxLength(2).IsRequired();
            });
        });

        builder.OwnsOne(e => e.Business, business =>
        {
            business.Property(b => b.LegalName).HasColumnName("business_legal_name").HasMaxLength(255);
            business.Property(b => b.TradeName).HasColumnName("business_trade_name").HasMaxLength(255);
            business.Property(b => b.RegistrationNumber).HasColumnName("business_registration_number").HasMaxLength(100);
            business.Property(b => b.RegistrationCountry).HasColumnName("business_registration_country").HasMaxLength(2);
            business.Property(b => b.IncorporationDate).HasColumnName("business_incorporation_date");
            business.Property(b => b.BusinessType).HasColumnName("business_type").HasMaxLength(100);
            business.Property(b => b.Industry).HasColumnName("business_industry").HasMaxLength(100);
            business.Property(b => b.TaxId).HasColumnName("business_tax_id").HasMaxLength(50);
            business.Property(b => b.VatNumber).HasColumnName("business_vat_number").HasMaxLength(50);
            business.Property(b => b.Website).HasColumnName("business_website").HasMaxLength(255);
            business.Property(b => b.NumberOfEmployees).HasColumnName("business_number_of_employees");
            business.Property(b => b.EstimatedAnnualRevenue).HasColumnName("business_estimated_annual_revenue").HasPrecision(18, 2);

            business.OwnsOne(b => b.RegisteredAddress, address =>
            {
                address.Property(ad => ad.Street).HasColumnName("business_registered_address_street").HasMaxLength(255);
                address.Property(ad => ad.Street2).HasColumnName("business_registered_address_street2").HasMaxLength(255);
                address.Property(ad => ad.City).HasColumnName("business_registered_address_city").HasMaxLength(100);
                address.Property(ad => ad.State).HasColumnName("business_registered_address_state").HasMaxLength(100);
                address.Property(ad => ad.PostalCode).HasColumnName("business_registered_address_postal_code").HasMaxLength(20);
                address.Property(ad => ad.Country).HasColumnName("business_registered_address_country").HasMaxLength(2);
            });

            business.OwnsOne(b => b.OperatingAddress, address =>
            {
                address.Property(ad => ad.Street).HasColumnName("business_operating_address_street").HasMaxLength(255);
                address.Property(ad => ad.Street2).HasColumnName("business_operating_address_street2").HasMaxLength(255);
                address.Property(ad => ad.City).HasColumnName("business_operating_address_city").HasMaxLength(100);
                address.Property(ad => ad.State).HasColumnName("business_operating_address_state").HasMaxLength(100);
                address.Property(ad => ad.PostalCode).HasColumnName("business_operating_address_postal_code").HasMaxLength(20);
                address.Property(ad => ad.Country).HasColumnName("business_operating_address_country").HasMaxLength(2);
            });
        });

        // JSON columns for collections and metadata
        builder.Property(e => e.DocumentRequests)
            .HasColumnName("document_requests")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<DocumentRequest>>(v, (JsonSerializerOptions?)null) ?? new List<DocumentRequest>());

        builder.Property(e => e.ChecklistItems)
            .HasColumnName("checklist_items")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<ChecklistItem>>(v, (JsonSerializerOptions?)null) ?? new List<ChecklistItem>());

        builder.Property(e => e.Metadata)
            .HasColumnName("metadata")
            .HasColumnType("jsonb")
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, string>());

        // Ignore domain events (not persisted)
        builder.Ignore(e => e.DomainEvents);
    }
}

