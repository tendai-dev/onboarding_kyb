using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace OnboardingApi.Presentation.Hubs;

/// <summary>
/// SignalR hub for real-time messaging updates
/// Note: Authorization is handled via headers (X-User-Id) rather than JWT for SignalR
/// </summary>
[AllowAnonymous] // Allow anonymous - we'll validate via headers in OnConnectedAsync
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
        
        _logger.LogInformation("SignalR client connected - UserId: {UserId}, Email: {Email}", userId, userEmail);
        
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
    /// Get user ID from context (from headers or claims)
    /// </summary>
    private Guid GetUserId()
    {
        // Try to get from header (set by proxy)
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Id", out var headerUserId) == true)
        {
            if (Guid.TryParse(headerUserId.ToString(), out var userId))
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
            // Generate deterministic GUID from email (same as frontend)
            using (var md5 = System.Security.Cryptography.MD5.Create())
            {
                var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(email.ToLowerInvariant()));
                hash[6] = (byte)((hash[6] & 0x0F) | 0x30); // Version 3
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
        if (Context.GetHttpContext()?.Request.Headers.TryGetValue("X-User-Email", out var headerEmail) == true)
        {
            return headerEmail.ToString();
        }

        // Try claims
        return Context.User?.FindFirst(ClaimTypes.Email)?.Value ??
               Context.User?.FindFirst("email")?.Value ??
               Context.User?.FindFirst("preferred_username")?.Value;
    }
}

