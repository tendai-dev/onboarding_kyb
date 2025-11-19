using NotificationService.Domain.ValueObjects;

namespace NotificationService.Domain.Aggregates;

public class NotificationTemplate
{
    public NotificationTemplateId Id { get; private set; }
    public string Name { get; private set; }
    public string Description { get; private set; }
    public NotificationType Type { get; private set; }
    public NotificationChannel Channel { get; private set; }
    public string Subject { get; private set; }
    public string Content { get; private set; }
    public List<string> Recipients { get; private set; } = new();
    public string Trigger { get; private set; }
    public NotificationPriority Priority { get; private set; }
    public bool IsActive { get; private set; }
    public NotificationFrequency Frequency { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }
    public string? CreatedBy { get; private set; }

    private NotificationTemplate() { } // EF Core

    public static NotificationTemplate Create(
        string name,
        string description,
        NotificationType type,
        NotificationChannel channel,
        string subject,
        string content,
        List<string> recipients,
        string trigger,
        NotificationPriority priority = NotificationPriority.Medium,
        NotificationFrequency frequency = NotificationFrequency.Immediate,
        string? createdBy = null)
    {
        var template = new NotificationTemplate
        {
            Id = NotificationTemplateId.New(),
            Name = name,
            Description = description,
            Type = type,
            Channel = channel,
            Subject = subject,
            Content = content,
            Recipients = recipients ?? new List<string>(),
            Trigger = trigger,
            Priority = priority,
            Frequency = frequency,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = createdBy
        };

        return template;
    }

    public void Update(
        string? name = null,
        string? description = null,
        string? subject = null,
        string? content = null,
        List<string>? recipients = null,
        string? trigger = null,
        NotificationPriority? priority = null,
        NotificationFrequency? frequency = null)
    {
        if (!string.IsNullOrWhiteSpace(name))
            Name = name;
        if (!string.IsNullOrWhiteSpace(description))
            Description = description;
        if (!string.IsNullOrWhiteSpace(subject))
            Subject = subject;
        if (!string.IsNullOrWhiteSpace(content))
            Content = content;
        if (recipients != null)
            Recipients = recipients;
        if (!string.IsNullOrWhiteSpace(trigger))
            Trigger = trigger;
        if (priority.HasValue)
            Priority = priority.Value;
        if (frequency.HasValue)
            Frequency = frequency.Value;
        
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        IsActive = true;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
        UpdatedAt = DateTime.UtcNow;
    }
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

