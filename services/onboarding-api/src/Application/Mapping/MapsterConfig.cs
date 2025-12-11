using Mapster;
using OnboardingApi.Application.Commands;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Mapping;

/// <summary>
/// Mapster configuration for object mapping between DTOs and domain models
/// Provides centralized, type-safe mapping configuration following best practices
/// </summary>
public static class MapsterConfig
{
    /// <summary>
    /// Configures Mapster type adapters for all DTO to domain model mappings
    /// </summary>
    public static void Configure()
    {
        // Configure AddressDto to Address mapping
        // Properties match exactly, so automatic mapping works
        TypeAdapterConfig<AddressDto, Address>
            .NewConfig()
            .Map(dest => dest.Street, src => src.Street)
            .Map(dest => dest.Street2, src => src.Street2)
            .Map(dest => dest.City, src => src.City)
            .Map(dest => dest.State, src => src.State)
            .Map(dest => dest.PostalCode, src => src.PostalCode)
            .Map(dest => dest.Country, src => src.Country);

        // Configure ApplicantDetailsDto to ApplicantDetails mapping
        TypeAdapterConfig<ApplicantDetailsDto, ApplicantDetails>
            .NewConfig()
            .Map(dest => dest.ResidentialAddress, src => src.ResidentialAddress != null ? src.ResidentialAddress.Adapt<Address>() : null)
            .Map(dest => dest, src => src);

        // Configure BusinessDetailsDto to BusinessDetails mapping
        TypeAdapterConfig<BusinessDetailsDto, BusinessDetails>
            .NewConfig()
            .Map(dest => dest.RegisteredAddress, src => src.RegisteredAddress != null ? src.RegisteredAddress.Adapt<Address>() : null)
            .Map(dest => dest.OperatingAddress, src => src.OperatingAddress != null ? src.OperatingAddress.Adapt<Address>() : null)
            .Map(dest => dest, src => src);

        // Compile configurations for better performance
        TypeAdapterConfig.GlobalSettings.Compile();
    }
}

