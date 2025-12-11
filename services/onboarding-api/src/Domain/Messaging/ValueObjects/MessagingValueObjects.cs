namespace OnboardingApi.Domain.Messaging.ValueObjects;

public enum MessageType
{
    Text = 1,
    SystemNotification = 2,
    StatusUpdate = 3
}

public enum MessageStatus
{
    Sent = 1,
    Delivered = 2,
    Read = 3,
    Deleted = 4
}

public enum UserRole
{
    Applicant = 1,
    Admin = 2,
    Reviewer = 3,
    ComplianceManager = 4
}

