namespace OnboardingApi.Domain.Notification.ValueObjects;

public record NotificationId(Guid Value)
{
    public static NotificationId New() => new(Guid.NewGuid());
    public static NotificationId From(Guid value) => new(value);
    public static NotificationId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
    
    public static implicit operator Guid(NotificationId id) => id.Value;
    public static implicit operator NotificationId(Guid value) => new(value);
}

public enum NotificationType
{
    Welcome,
    StatusUpdate,
    DocumentRequest,
    DocumentApproved,
    DocumentRejected,
    CaseApproved,
    CaseRejected,
    ComplianceAlert,
    RiskAlert,
    Reminder,
    SystemAlert,
    Other
}

public enum NotificationChannel
{
    Email,
    SMS,
    Push,
    InApp,
    Webhook
}

public enum NotificationStatus
{
    Pending,
    Scheduled,
    Sending,
    Sent,
    Delivered,
    Failed,
    Cancelled
}

public enum NotificationPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public record NotificationTemplateId(Guid Value)
{
    public static NotificationTemplateId New() => new(Guid.NewGuid());
    public static NotificationTemplateId From(Guid value) => new(value);
    public static NotificationTemplateId From(string value) => new(Guid.Parse(value));
    
    public override string ToString() => Value.ToString();
}

public enum NotificationFrequency
{
    Immediate,
    Daily,
    Weekly,
    Monthly
}

