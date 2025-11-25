namespace OnboardingApi.Domain.Risk.ValueObjects;

public record RiskAssessmentId(Guid Value)
{
    public static RiskAssessmentId New() => new(Guid.NewGuid());
    public static RiskAssessmentId From(Guid value) => new(value);
    public static RiskAssessmentId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(RiskAssessmentId id) => id.Value;
    public static implicit operator RiskAssessmentId(Guid value) => new(value);
}

public record RiskFactorId(Guid Value)
{
    public static RiskFactorId New() => new(Guid.NewGuid());
    public static RiskFactorId From(Guid value) => new(value);
    public static RiskFactorId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(RiskFactorId id) => id.Value;
    public static implicit operator RiskFactorId(Guid value) => new(value);
}

public enum RiskLevel
{
    Unknown = 0,
    Low = 1,
    MediumLow = 2,
    Medium = 3,
    MediumHigh = 4,
    High = 5
}

public enum RiskAssessmentStatus
{
    InProgress,
    Completed,
    Rejected,
    RequiresReview
}

public enum RiskFactorType
{
    PEP,                    // Politically Exposed Person
    Sanctions,              // Sanctions screening
    AdverseMedia,           // Negative news/media
    Geography,              // Country/jurisdiction risk
    Industry,               // Business sector risk
    TransactionPattern,     // Unusual transaction patterns
    PartnerProfile,        // Partner behavior/profile
    DocumentRisk,           // Document authenticity/quality
    Other
}

