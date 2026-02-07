using OnboardingApi.Application.Cases.Commands;
using OnboardingApi.Application.Cases.Interfaces;

namespace OnboardingApi.Application.Cases.Validation;

/// <summary>
/// Validates case data against entity configuration schemas
/// </summary>
public static class CaseValidator
{
    public static List<string> ValidateAgainstEntityConfiguration(
        EntityTypeConfiguration entityConfig,
        ApplicantRequest? applicant,
        BusinessRequest? business)
    {
        var errors = new List<string>();

        foreach (var requirement in entityConfig.Requirements)
        {
            if (!requirement.IsRequired)
                continue;

            var fieldPath = requirement.FieldPath?.ToLowerInvariant() ?? "";
            var hasValue = false;

            // Check applicant fields
            if (fieldPath.StartsWith("applicant.") && applicant != null)
            {
                hasValue = CheckApplicantField(applicant, fieldPath.Replace("applicant.", ""));
            }
            // Check business fields
            else if (fieldPath.StartsWith("business.") && business != null)
            {
                hasValue = CheckBusinessField(business, fieldPath.Replace("business.", ""));
            }
            // Check top-level fields
            else
            {
                hasValue = CheckTopLevelField(applicant, business, fieldPath);
            }

            if (!hasValue)
            {
                errors.Add($"Required field '{requirement.FieldPath}' is missing or empty");
            }
        }

        return errors;
    }

    private static bool CheckApplicantField(ApplicantRequest applicant, string field)
    {
        return field switch
        {
            "firstname" or "first_name" => !string.IsNullOrWhiteSpace(applicant.FirstName),
            "lastname" or "last_name" => !string.IsNullOrWhiteSpace(applicant.LastName),
            "email" => !string.IsNullOrWhiteSpace(applicant.Email),
            "phone" => !string.IsNullOrWhiteSpace(applicant.Phone),
            "dateofbirth" or "date_of_birth" => !string.IsNullOrWhiteSpace(applicant.DateOfBirth),
            "nationality" => !string.IsNullOrWhiteSpace(applicant.Nationality),
            "idnumber" or "id_number" => !string.IsNullOrWhiteSpace(applicant.IdNumber),
            "idtype" or "id_type" => !string.IsNullOrWhiteSpace(applicant.IdType),
            _ when field.StartsWith("residentialaddress.") || field.StartsWith("residential_address.") => 
                CheckAddressField(applicant.ResidentialAddress, field.Split('.').Last()),
            _ => false
        };
    }

    private static bool CheckBusinessField(BusinessRequest business, string field)
    {
        return field switch
        {
            "legalname" or "legal_name" => !string.IsNullOrWhiteSpace(business.LegalName),
            "tradingname" or "trading_name" => !string.IsNullOrWhiteSpace(business.TradingName),
            "registrationnumber" or "registration_number" => !string.IsNullOrWhiteSpace(business.RegistrationNumber),
            "taxid" or "tax_id" => !string.IsNullOrWhiteSpace(business.TaxId),
            "industry" => !string.IsNullOrWhiteSpace(business.Industry),
            "website" => !string.IsNullOrWhiteSpace(business.Website),
            _ when field.StartsWith("registeredaddress.") || field.StartsWith("registered_address.") => 
                CheckAddressField(business.RegisteredAddress, field.Split('.').Last()),
            _ => false
        };
    }

    private static bool CheckAddressField(AddressRequest? address, string field)
    {
        if (address == null) return false;
        
        return field switch
        {
            "street" => !string.IsNullOrWhiteSpace(address.Street),
            "city" => !string.IsNullOrWhiteSpace(address.City),
            "state" => !string.IsNullOrWhiteSpace(address.State),
            "postalcode" or "postal_code" => !string.IsNullOrWhiteSpace(address.PostalCode),
            "country" => !string.IsNullOrWhiteSpace(address.Country),
            _ => false
        };
    }

    private static bool CheckTopLevelField(ApplicantRequest? applicant, BusinessRequest? business, string field)
    {
        // Handle common top-level field mappings
        return field switch
        {
            "firstname" or "first_name" => applicant != null && !string.IsNullOrWhiteSpace(applicant.FirstName),
            "lastname" or "last_name" => applicant != null && !string.IsNullOrWhiteSpace(applicant.LastName),
            "email" => applicant != null && !string.IsNullOrWhiteSpace(applicant.Email),
            "legalname" or "legal_name" => business != null && !string.IsNullOrWhiteSpace(business.LegalName),
            _ => false
        };
    }
}
