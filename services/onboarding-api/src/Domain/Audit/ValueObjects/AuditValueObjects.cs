namespace OnboardingApi.Domain.Audit.ValueObjects;

public record AuditLogEntryId(Guid Value)
{
    public static AuditLogEntryId New() => new(Guid.NewGuid());
    public static AuditLogEntryId From(Guid value) => new(value);
    public static AuditLogEntryId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(AuditLogEntryId id) => id.Value;
    public static implicit operator AuditLogEntryId(Guid value) => new(value);
}

public enum AuditAction
{
    Create,
    Read,
    Update,
    Delete,
    Login,
    Logout,
    Approve,
    Reject,
    Submit,
    Cancel,
    Export,
    Import,
    Download,
    Upload,
    Send,
    Receive,
    Configure,
    Execute,
    Other
}

public enum AuditSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ComplianceCategory
{
    General,
    KYC,
    KYB,
    AML,
    DataProtection,
    Financial,
    Authentication,
    Authorization,
    SystemAccess,
    DataExport,
    Configuration,
    RiskManagement,
    DocumentManagement,
    Communication,
    Reporting
}

