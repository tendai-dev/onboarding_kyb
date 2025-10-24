using MediatR;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.Text;

namespace OnboardingApi.Application.Commands;

/// <summary>
/// Command to anonymize user data for GDPR/POPIA compliance
/// Replaces PII with hashed or placeholder values while maintaining referential integrity
/// </summary>
public record AnonymizeUserCommand(
    Guid UserId,
    string Reason,
    string RequestedBy
) : IRequest<AnonymizeUserResult>;

public record AnonymizeUserResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime? AnonymizedAt { get; init; }
    public List<string> AnonymizedFields { get; init; } = new();
    
    public static AnonymizeUserResult Successful(DateTime anonymizedAt, List<string> fields) => new()
    {
        Success = true,
        AnonymizedAt = anonymizedAt,
        AnonymizedFields = fields
    };
    
    public static AnonymizeUserResult Failed(string error) => new()
    {
        Success = false,
        ErrorMessage = error
    };
}

/// <summary>
/// Handler for user anonymization
/// </summary>
public class AnonymizeUserHandler : IRequestHandler<AnonymizeUserCommand, AnonymizeUserResult>
{
    private readonly ILogger<AnonymizeUserHandler> _logger;
    private readonly IApplicationRepository _repository;
    private readonly IEventPublisher _eventPublisher;
    
    // PII fields to anonymize (from data-residency.yaml)
    private readonly string[] _piiFields = new[]
    {
        "email", "phone_number", "name", "date_of_birth",
        "identification_number", "address", "bank_account_number", "tax_number"
    };
    
    public AnonymizeUserHandler(
        ILogger<AnonymizeUserHandler> logger,
        IApplicationRepository repository,
        IEventPublisher eventPublisher)
    {
        _logger = logger;
        _repository = repository;
        _eventPublisher = eventPublisher;
    }
    
    public async Task<AnonymizeUserResult> Handle(
        AnonymizeUserCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation(
                "Starting anonymization for user {UserId}. Reason: {Reason}, Requested by: {RequestedBy}",
                request.UserId, request.Reason, request.RequestedBy);
            
            // 1. Find all applications for this user
            var applications = await _repository.GetApplicationsByUserIdAsync(request.UserId, cancellationToken);
            
            if (!applications.Any())
            {
                _logger.LogWarning("No applications found for user {UserId}", request.UserId);
                return AnonymizeUserResult.Failed($"User not found: {request.UserId}");
            }
            
            var anonymizedFields = new List<string>();
            var anonymizedAt = DateTime.UtcNow;
            
            // 2. Anonymize each application
            foreach (var application in applications)
            {
                // Anonymize email
                if (!string.IsNullOrEmpty(application.Email))
                {
                    application.Email = $"deleted-{application.Id}@anonymized.mukuru.com";
                    anonymizedFields.Add("email");
                }
                
                // Anonymize phone
                if (!string.IsNullOrEmpty(application.PhoneNumber))
                {
                    application.PhoneNumber = "REDACTED";
                    anonymizedFields.Add("phone_number");
                }
                
                // Anonymize name
                if (!string.IsNullOrEmpty(application.ApplicantName))
                {
                    application.ApplicantName = $"User-{application.Id.ToString().Substring(0, 8)}";
                    anonymizedFields.Add("name");
                }
                
                // Hash identification number (one-way, for potential re-identification prevention)
                if (!string.IsNullOrEmpty(application.IdentificationNumber))
                {
                    application.IdentificationNumber = HashSensitiveData(application.IdentificationNumber);
                    anonymizedFields.Add("identification_number");
                }
                
                // Anonymize address
                if (!string.IsNullOrEmpty(application.Address))
                {
                    application.Address = "REDACTED";
                    anonymizedFields.Add("address");
                }
                
                // Anonymize date of birth (keep year for analytics, redact month/day)
                if (application.DateOfBirth.HasValue)
                {
                    application.DateOfBirth = new DateTime(application.DateOfBirth.Value.Year, 1, 1);
                    anonymizedFields.Add("date_of_birth");
                }
                
                // Anonymize bank details
                if (!string.IsNullOrEmpty(application.BankAccountNumber))
                {
                    application.BankAccountNumber = HashSensitiveData(application.BankAccountNumber);
                    anonymizedFields.Add("bank_account_number");
                }
                
                // Anonymize tax number
                if (!string.IsNullOrEmpty(application.TaxNumber))
                {
                    application.TaxNumber = HashSensitiveData(application.TaxNumber);
                    anonymizedFields.Add("tax_number");
                }
                
                // Mark as anonymized
                application.IsAnonymized = true;
                application.AnonymizedAt = anonymizedAt;
                application.AnonymizationReason = request.Reason;
                
                await _repository.UpdateAsync(application, cancellationToken);
            }
            
            // 3. Publish event for audit trail
            await _eventPublisher.PublishAsync(new UserDataAnonymizedEvent
            {
                UserId = request.UserId,
                Reason = request.Reason,
                RequestedBy = request.RequestedBy,
                AnonymizedAt = anonymizedAt,
                ApplicationCount = applications.Count,
                AnonymizedFields = anonymizedFields.Distinct().ToList()
            }, cancellationToken);
            
            _logger.LogInformation(
                "Successfully anonymized {Count} applications for user {UserId}. Fields: {Fields}",
                applications.Count, request.UserId, string.Join(", ", anonymizedFields.Distinct()));
            
            return AnonymizeUserResult.Successful(anonymizedAt, anonymizedFields.Distinct().ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error anonymizing user {UserId}", request.UserId);
            return AnonymizeUserResult.Failed($"Anonymization failed: {ex.Message}");
        }
    }
    
    /// <summary>
    /// One-way hash for sensitive data
    /// Uses SHA256 with salt for security
    /// </summary>
    private string HashSensitiveData(string data)
    {
        if (string.IsNullOrEmpty(data))
            return "REDACTED";
        
        // Use application ID as salt (consistent per application)
        var salt = "mukuru-anonymization-salt-2025";
        var combined = $"{data}{salt}";
        
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
        var hash = Convert.ToBase64String(hashBytes);
        
        // Return first 16 characters for readability
        return $"HASH-{hash.Substring(0, 16)}";
    }
}

/// <summary>
/// Event published when user data is anonymized
/// </summary>
public record UserDataAnonymizedEvent
{
    public Guid UserId { get; init; }
    public string Reason { get; init; } = string.Empty;
    public string RequestedBy { get; init; } = string.Empty;
    public DateTime AnonymizedAt { get; init; }
    public int ApplicationCount { get; init; }
    public List<string> AnonymizedFields { get; init; } = new();
    public Guid EventId { get; init; } = Guid.NewGuid();
}

// Repository interfaces (assumed to exist)
public interface IApplicationRepository
{
    Task<List<Application>> GetApplicationsByUserIdAsync(Guid userId, CancellationToken cancellationToken);
    Task UpdateAsync(Application application, CancellationToken cancellationToken);
}

public interface IEventPublisher
{
    Task PublishAsync<T>(T domainEvent, CancellationToken cancellationToken) where T : class;
}

// Simplified Application model
public class Application
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ApplicantName { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string BankAccountNumber { get; set; } = string.Empty;
    public string TaxNumber { get; set; } = string.Empty;
    public bool IsAnonymized { get; set; }
    public DateTime? AnonymizedAt { get; set; }
    public string? AnonymizationReason { get; set; }
}

