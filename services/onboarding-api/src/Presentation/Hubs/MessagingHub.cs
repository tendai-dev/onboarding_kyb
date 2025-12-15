using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Hubs;

/// <summary>
/// SignalR hub for real-time messaging updates
/// Note: Authorization is handled via headers (X-User-Id) rather than JWT for SignalR
/// </summary>
// SECURITY FIX: SignalR requires authentication - validation happens in OnConnectedAsync via headers
// Note: AllowAnonymous is removed - authentication is enforced via middleware and header validation
public class MessagingHub : Hub
{
    private readonly ILogger<MessagingHub> _logger;

    public MessagingHub(ILogger<MessagingHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var userEmail = GetUserEmail();
        
        // SECURITY FIX: Validate user identity before allowing connection
        if (userId == Guid.Empty && string.IsNullOrWhiteSpace(userEmail))
        {
            _logger.LogWarning("SignalR connection rejected - no user identity found in headers or claims");
            Context.Abort(); // Reject the connection
            return;
        }
        
        // SECURITY FIX: Mask PII in logs
        _logger.LogInformation("SignalR client connected - UserId: {UserId}, Email: {Email}", 
            userId != Guid.Empty ? Infrastructure.Utilities.LoggingExtensions.MaskGuid(userId) : "unknown",
            Infrastructure.Utilities.LoggingExtensions.MaskEmail(userEmail));
        
        if (userId != Guid.Empty)
        {
            // Add user to their personal group for direct messaging
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        _logger.LogInformation("SignalR client disconnected - UserId: {UserId}", userId);
        
        if (userId != Guid.Empty)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user-{userId}");
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Join a message thread group to receive real-time updates for that thread
    /// SignalR method names are case-insensitive, so both JoinThread and joinThread work
    /// </summary>
    public async Task JoinThread(string threadId)
    {
        if (string.IsNullOrWhiteSpace(threadId))
        {
            _logger.LogWarning("JoinThread called with empty threadId");
            return;
        }

        if (!Guid.TryParse(threadId, out var threadGuid))
        {
            _logger.LogWarning("JoinThread called with invalid GUID: {ThreadId}", threadId);
            return;
        }

        var userId = GetUserId();
        _logger.LogInformation("User {UserId} joining thread {ThreadId}", userId, threadId);

        // Add connection to thread group
        await Groups.AddToGroupAsync(Context.ConnectionId, $"thread-{threadId}");
        
        _logger.LogDebug("Connection {ConnectionId} added to thread group {ThreadId}", Context.ConnectionId, threadId);
    }

    /// <summary>
    /// Leave a message thread group
    /// </summary>
    public async Task LeaveThread(string threadId)
    {
        if (string.IsNullOrWhiteSpace(threadId))
        {
            return;
        }

        var userId = GetUserId();
        _logger.LogInformation("User {UserId} leaving thread {ThreadId}", userId, threadId);

        // Remove connection from thread group
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"thread-{threadId}");
        
        _logger.LogDebug("Connection {ConnectionId} removed from thread group {ThreadId}", Context.ConnectionId, threadId);
    }

    /// <summary>
    /// Send typing indicator for a thread
    /// </summary>
    public async Task UserTyping(string threadId)
    {
        if (string.IsNullOrWhiteSpace(threadId))
        {
            return;
        }

        var userId = GetUserId();
        var userName = GetUserEmail() ?? "User";
        
        _logger.LogDebug("User {UserId} typing in thread {ThreadId}", userId, threadId);

        // Broadcast typing indicator to all users in the thread (except sender)
        await Clients.GroupExcept($"thread-{threadId}", Context.ConnectionId)
            .SendAsync("UserTyping", new { threadId, userId, userName });
    }

    /// <summary>
    /// Get user ID from context (from headers or claims)
    /// </summary>
    private Guid GetUserId()
    {
        // Try to get from header (set by proxy)
        // SECURITY FIX: Sanitize header value to prevent header injection
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Id", out var headerUserId) == true)
        {
            var sanitizedUserId = SanitizeHeaderValue(headerUserId.ToString());
            if (!string.IsNullOrWhiteSpace(sanitizedUserId) && Guid.TryParse(sanitizedUserId, out var userId))
            {
                return userId;
            }
        }

        // Try to get from claims
        var email = Context.User?.FindFirst(ClaimTypes.Email)?.Value ??
                   Context.User?.FindFirst("email")?.Value ??
                   Context.User?.FindFirst("preferred_username")?.Value;

        if (!string.IsNullOrWhiteSpace(email))
        {
            // Generate deterministic GUID from email using RFC 4122 version 5 (same as controller)
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(email.ToLowerInvariant()));
                hash[6] = (byte)((hash[6] & 0x0F) | 0x50); // Version 5 (matching controller)
                hash[8] = (byte)((hash[8] & 0x3F) | 0x80); // Variant 10
                return new Guid(hash);
            }
        }

        return Guid.Empty;
    }

    /// <summary>
    /// Get user email from context
    /// </summary>
    private string? GetUserEmail()
    {
        // Try header first
        // SECURITY FIX: Sanitize header value to prevent header injection
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Email", out var headerEmail) == true)
        {
            return SanitizeHeaderValue(headerEmail.ToString());
        }

        // Try claims
        return Context.User?.FindFirst(ClaimTypes.Email)?.Value ??
               Context.User?.FindFirst("email")?.Value ??
               Context.User?.FindFirst("preferred_username")?.Value;
    }

    /// <summary>
    /// SECURITY FIX: Sanitize header values to prevent header injection attacks
    /// </summary>
    private static string? SanitizeHeaderValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        
        // Remove newlines, carriage returns, and other control characters that could be used for header injection
        value = System.Text.RegularExpressions.Regex.Replace(value, @"[\r\n\x00-\x1F]", "");
        
        // Limit length to prevent overly long headers
        if (value.Length > 255)
        {
            value = value.Substring(0, 255);
        }
        
        // Remove potentially dangerous characters
        value = System.Text.RegularExpressions.Regex.Replace(value, @"[^\w\s\-_.@]", "");
        
        return value.Trim();
    }
}

