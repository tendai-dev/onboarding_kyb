using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Persistence;
using System.Text.Json;

namespace OnboardingApi.Infrastructure.Services;

/// <summary>
/// Implementation of organization mapping service
/// Maps Keycloak users (identified by email) to organizations
/// Uses database storage with Redis caching for performance
/// </summary>
public class OrganizationMapper : IOrganizationMapper
{
    private readonly OnboardingDbContext _context;
    private readonly IDistributedCache _cache;
    private readonly ILogger<OrganizationMapper> _logger;
    private const string CACHE_KEY_PREFIX = "org_mapping:";
    private readonly TimeSpan _cacheExpiration = TimeSpan.FromHours(1);

    public OrganizationMapper(
        OnboardingDbContext context,
        IDistributedCache cache,
        ILogger<OrganizationMapper> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> GetOrganizationIdAsync(string email)
    {
        if (string.IsNullOrEmpty(email))
            return null;

        var normalizedEmail = email.ToLowerInvariant();

        // Try cache first
        var cacheKey = $"{CACHE_KEY_PREFIX}{normalizedEmail}";
        var cached = await _cache.GetStringAsync(cacheKey);
        if (!string.IsNullOrEmpty(cached))
        {
            _logger.LogDebug("Organization mapping found in cache for {Email}", email);
            return cached;
        }

        // Query database
        // Note: This assumes you have a UserOrganizationMapping table
        // You'll need to create this table and entity
        var mapping = await _context.Set<UserOrganizationMapping>()
            .FirstOrDefaultAsync(m => m.UserEmail == normalizedEmail);

        if (mapping != null)
        {
            // Cache the result
            await _cache.SetStringAsync(
                cacheKey,
                mapping.OrganizationId,
                new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = _cacheExpiration
                });

            _logger.LogInformation("Organization {OrgId} found for user {Email}", 
                mapping.OrganizationId, email);
            return mapping.OrganizationId;
        }

        _logger.LogWarning("No organization mapping found for user {Email}", email);
        return null;
    }

    public async Task<OrganizationInfo?> GetOrganizationAsync(string email)
    {
        var organizationId = await GetOrganizationIdAsync(email);
        if (string.IsNullOrEmpty(organizationId))
            return null;

        // Query organization details
        // Note: This assumes you have an Organizations table
        var org = await _context.Set<Organization>()
            .FirstOrDefaultAsync(o => o.OrganizationId == organizationId);

        if (org == null)
            return null;

        return new OrganizationInfo
        {
            OrganizationId = org.OrganizationId,
            OrganizationName = org.Name,
            Country = org.Country,
            BusinessType = org.BusinessType,
            CreatedAt = org.CreatedAt,
            IsActive = org.IsActive
        };
    }

    public async Task MapUserToOrganizationAsync(string email, string organizationId)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(organizationId))
            throw new ArgumentException("Email and OrganizationId are required");

        var normalizedEmail = email.ToLowerInvariant();

        // Check if mapping already exists
        var existing = await _context.Set<UserOrganizationMapping>()
            .FirstOrDefaultAsync(m => m.UserEmail == normalizedEmail);

        if (existing != null)
        {
            // Update existing mapping
            existing.OrganizationId = organizationId;
            existing.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            // Create new mapping
            var mapping = new UserOrganizationMapping
            {
                UserEmail = normalizedEmail,
                OrganizationId = organizationId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            await _context.Set<UserOrganizationMapping>().AddAsync(mapping);
        }

        await _context.SaveChangesAsync();

        // Invalidate cache
        var cacheKey = $"{CACHE_KEY_PREFIX}{normalizedEmail}";
        await _cache.RemoveAsync(cacheKey);

        _logger.LogInformation("Mapped user {Email} to organization {OrgId}", email, organizationId);
    }

    public async Task<bool> BelongsToOrganizationAsync(string email, string organizationId)
    {
        var userOrgId = await GetOrganizationIdAsync(email);
        return userOrgId == organizationId;
    }
}

/// <summary>
/// Entity for storing user-to-organization mappings
/// Add this to your DbContext
/// </summary>
public class UserOrganizationMapping
{
    public int Id { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public string OrganizationId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

/// <summary>
/// Entity for organization information
/// Add this to your DbContext if not already present
/// </summary>
public class Organization
{
    public string OrganizationId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Country { get; set; }
    public string? BusinessType { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool IsActive { get; set; }
}


