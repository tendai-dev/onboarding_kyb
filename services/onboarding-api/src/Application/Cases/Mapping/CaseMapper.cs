using OnboardingApi.Application.Cases.Commands;
using OnboardingApi.Application.Cases.Interfaces;
using OnboardingApi.Domain.ValueObjects;

namespace OnboardingApi.Application.Cases.Mapping;

/// <summary>
/// Maps request DTOs to domain value objects
/// </summary>
public static class CaseMapper
{
    public static ApplicantDetails MapApplicant(ApplicantRequest? request, EntityTypeConfiguration? entityConfig)
    {
        if (request == null)
        {
            return new ApplicantDetails
            {
                FirstName = string.Empty,
                LastName = string.Empty,
                Email = string.Empty,
                PhoneNumber = string.Empty,
                DateOfBirth = default,
                Nationality = string.Empty,
                ResidentialAddress = new Address()
            };
        }

        return new ApplicantDetails
        {
            FirstName = request.FirstName ?? string.Empty,
            LastName = request.LastName ?? string.Empty,
            Email = request.Email ?? string.Empty,
            PhoneNumber = request.Phone ?? string.Empty,
            DateOfBirth = ParseDate(request.DateOfBirth) ?? default,
            Nationality = request.Nationality ?? string.Empty,
            PassportNumber = request.IdType?.ToLower() == "passport" ? request.IdNumber : null,
            DriversLicenseNumber = request.IdType?.ToLower() == "drivers_license" ? request.IdNumber : null,
            ResidentialAddress = MapAddress(request.ResidentialAddress) ?? new Address()
        };
    }

    public static BusinessDetails? MapBusiness(BusinessRequest? request, EntityTypeConfiguration? entityConfig)
    {
        if (request == null)
            return null;

        return new BusinessDetails
        {
            LegalName = request.LegalName ?? string.Empty,
            TradeName = request.TradingName,
            RegistrationNumber = request.RegistrationNumber ?? string.Empty,
            TaxId = request.TaxId,
            Industry = request.Industry ?? string.Empty,
            Website = request.Website ?? string.Empty,
            RegisteredAddress = MapAddress(request.RegisteredAddress) ?? new Address()
        };
    }

    public static Address? MapAddress(AddressRequest? request)
    {
        if (request == null)
            return null;

        // Only create address if at least one field has a value
        if (string.IsNullOrWhiteSpace(request.Street) &&
            string.IsNullOrWhiteSpace(request.City) &&
            string.IsNullOrWhiteSpace(request.State) &&
            string.IsNullOrWhiteSpace(request.PostalCode) &&
            string.IsNullOrWhiteSpace(request.Country))
        {
            return null;
        }

        return new Address
        {
            Street = request.Street ?? string.Empty,
            City = request.City ?? string.Empty,
            State = request.State ?? string.Empty,
            PostalCode = request.PostalCode ?? string.Empty,
            Country = request.Country ?? string.Empty
        };
    }

    private static DateTime? ParseDate(string? dateString)
    {
        if (string.IsNullOrWhiteSpace(dateString))
            return null;

        if (DateTime.TryParse(dateString, out var date))
            return date;

        return null;
    }
}
