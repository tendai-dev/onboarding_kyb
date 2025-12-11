using OnboardingApi.Domain.Messaging.Events;
using OnboardingApi.Domain.Messaging.ValueObjects;

namespace OnboardingApi.Domain.Messaging.Aggregates;

/// <summary>
/// Message Aggregate Root
/// Represents a message in a conversation thread between users and admins
/// </summary>
public class Message
{
    private readonly List<IDomainEvent> _domainEvents = new();
    
    public Guid Id { get; private set; }
    public Guid ThreadId { get; private set; }
    public Guid ApplicationId { get; private set; }
    
    // Sender information
    public Guid SenderId { get; private set; }
    public string SenderName { get; private set; } = string.Empty;
    public UserRole SenderRole { get; private set; }
    
    // Receiver information
    public Guid? ReceiverId { get; private set; }
    public string? ReceiverName { get; private set; }
    
    // Message content
    public string Content { get; private set; } = string.Empty;
    public MessageType Type { get; private set; }
    public Guid? ReplyToMessageId { get; private set; } // For reply functionality
    
    // Attachments
    private readonly List<MessageAttachment> _attachments = new();
    public IReadOnlyCollection<MessageAttachment> Attachments => _attachments.AsReadOnly();
    
    // Status
    public MessageStatus Status { get; private set; }
    public DateTime SentAt { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public DateTime? DeletedAt { get; private set; }
    
    // Metadata
    public bool IsRead => ReadAt.HasValue;
    public bool IsDeleted => DeletedAt.HasValue;
    public bool IsStarred { get; private set; } // For star functionality
    
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    private Message() { }
    
    public static Message Create(
        Guid threadId,
        Guid applicationId,
        Guid senderId,
        string senderName,
        UserRole senderRole,
        string content,
        Guid? receiverId = null,
        string? receiverName = null,
        Guid? replyToMessageId = null,
        IEnumerable<MessageAttachment>? attachments = null)
    {
        // Allow empty content if there are attachments
        if (string.IsNullOrWhiteSpace(content) && (attachments == null || !attachments.Any()))
            throw new ArgumentException("Message content cannot be empty if no attachments provided", nameof(content));
        
        if (content.Length > 5000)
            throw new ArgumentException("Message content cannot exceed 5000 characters", nameof(content));
        
        var message = new Message
        {
            Id = Guid.NewGuid(),
            ThreadId = threadId,
            ApplicationId = applicationId,
            SenderId = senderId,
            SenderName = senderName,
            SenderRole = senderRole,
            ReceiverId = receiverId,
            ReceiverName = receiverName,
            Content = content ?? string.Empty,
            ReplyToMessageId = replyToMessageId,
            Type = MessageType.Text,
            Status = MessageStatus.Sent,
            SentAt = DateTime.UtcNow,
            IsStarred = false
        };
        
        // Add attachments if provided
        if (attachments != null)
        {
            foreach (var attachment in attachments)
            {
                message._attachments.Add(attachment);
            }
        }
        
        message.AddDomainEvent(new MessageSentEvent(
            message.Id,
            message.ThreadId,
            message.ApplicationId,
            message.SenderId,
            message.ReceiverId,
            DateTime.UtcNow
        ));
        
        return message;
    }
    
    public void AddAttachment(MessageAttachment attachment)
    {
        if (attachment == null)
            throw new ArgumentNullException(nameof(attachment));
        
        if (attachment.MessageId != Id)
            throw new ArgumentException("Attachment must belong to this message", nameof(attachment));
        
        _attachments.Add(attachment);
    }
    
    public void ToggleStar()
    {
        IsStarred = !IsStarred;
    }
    
    public void MarkAsRead(Guid readByUserId)
    {
        if (IsRead)
            return;
        
        if (readByUserId != SenderId && readByUserId != ReceiverId)
            throw new UnauthorizedAccessException("User not authorized to read this message");
        
        ReadAt = DateTime.UtcNow;
        Status = MessageStatus.Read;
        
        AddDomainEvent(new MessageReadEvent(
            Id,
            ThreadId,
            readByUserId,
            DateTime.UtcNow
        ));
    }
    
    public void Delete(Guid deletedByUserId)
    {
        if (IsDeleted)
            throw new InvalidOperationException("Message is already deleted");
        
        if (deletedByUserId != SenderId)
            throw new UnauthorizedAccessException("Only sender can delete their message");
        
        DeletedAt = DateTime.UtcNow;
        Status = MessageStatus.Deleted;
        
        AddDomainEvent(new MessageDeletedEvent(
            Id,
            ThreadId,
            deletedByUserId,
            DateTime.UtcNow
        ));
    }
    
    public bool CanBeReadBy(Guid userId, UserRole userRole)
    {
        // Sender can always read their own message
        if (userId == SenderId)
            return true;
        
        // Receiver can read message sent to them
        if (ReceiverId.HasValue && userId == ReceiverId.Value)
            return true;
        
        // Admins can read all messages in the system
        if (userRole is UserRole.Admin or UserRole.ComplianceManager)
            return true;
        
        return false;
    }
    
    public void ClearDomainEvents() => _domainEvents.Clear();
    
    private void AddDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);
}

/// <summary>
/// Message Thread - groups messages by application
/// </summary>
public class MessageThread
{
    public Guid Id { get; private set; }
    public Guid ApplicationId { get; private set; }
    public string ApplicationReference { get; private set; } = string.Empty;
    
    // Participants
    public Guid ApplicantId { get; private set; }
    public string ApplicantName { get; private set; } = string.Empty;
    public Guid? AssignedAdminId { get; private set; }
    public string? AssignedAdminName { get; private set; }
    
    // Status
    public bool IsActive { get; private set; }
    public bool IsArchived { get; private set; } // For archive functionality
    public bool IsStarred { get; private set; } // For star functionality
    public DateTime CreatedAt { get; private set; }
    public DateTime? ClosedAt { get; private set; }
    public DateTime LastMessageAt { get; private set; }
    
    // Statistics
    public int MessageCount { get; private set; }
    public int UnreadCountApplicant { get; private set; }
    public int UnreadCountAdmin { get; private set; }
    
    private MessageThread() { }
    
    public static MessageThread Create(
        Guid applicationId,
        string applicationReference,
        Guid applicantId,
        string applicantName)
    {
        return new MessageThread
        {
            Id = Guid.NewGuid(),
            ApplicationId = applicationId,
            ApplicationReference = applicationReference,
            ApplicantId = applicantId,
            ApplicantName = applicantName,
            IsActive = true,
            IsArchived = false,
            IsStarred = false,
            CreatedAt = DateTime.UtcNow,
            LastMessageAt = DateTime.UtcNow,
            MessageCount = 0,
            UnreadCountApplicant = 0,
            UnreadCountAdmin = 0
        };
    }
    
    public void AssignAdmin(Guid adminId, string adminName)
    {
        AssignedAdminId = adminId;
        AssignedAdminName = adminName;
    }
    
    public void IncrementMessageCount()
    {
        MessageCount++;
        LastMessageAt = DateTime.UtcNow;
    }
    
    public void IncrementUnreadCount(UserRole recipientRole)
    {
        if (recipientRole == UserRole.Applicant)
            UnreadCountApplicant++;
        else
            UnreadCountAdmin++;
    }
    
    public void MarkAsRead(UserRole userRole)
    {
        if (userRole == UserRole.Applicant)
            UnreadCountApplicant = 0;
        else
            UnreadCountAdmin = 0;
    }
    
    public void Close()
    {
        IsActive = false;
        ClosedAt = DateTime.UtcNow;
    }
    
    public void Archive()
    {
        IsArchived = true;
    }
    
    public void Unarchive()
    {
        IsArchived = false;
    }
    
    public void ToggleStar()
    {
        IsStarred = !IsStarred;
    }
}

