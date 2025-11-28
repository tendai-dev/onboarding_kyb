using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class CurrentUserTests
{
    [Fact]
    public void Principal_ShouldReturnNull_WhenHttpContextIsNull()
    {
        // Arrange
        var httpContextAccessor = new MockHttpContextAccessor(null);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var principal = currentUser.Principal;

        // Assert
        Assert.Null(principal);
    }

    [Fact]
    public void Principal_ShouldReturnUser_WhenHttpContextHasUser()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("sub", "user123"),
            new Claim("email", "test@example.com")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var result = currentUser.Principal;

        // Assert
        Assert.NotNull(result);
        Assert.Equal(principal, result);
    }

    [Fact]
    public void UserId_ShouldReturnSubClaim_WhenPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("sub", "user123") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal("user123", userId);
    }

    [Fact]
    public void UserId_ShouldReturnNameIdentifier_WhenSubNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim(ClaimTypes.NameIdentifier, "user456") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal("user456", userId);
    }

    [Fact]
    public void UserId_ShouldReturnEmpty_WhenNoClaimsPresent()
    {
        // Arrange
        var identity = new ClaimsIdentity();
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal(string.Empty, userId);
    }

    [Fact]
    public void Email_ShouldReturnEmailClaim_WhenPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("email", "test@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var email = currentUser.Email;

        // Assert
        Assert.Equal("test@example.com", email);
    }

    [Fact]
    public void Email_ShouldReturnUpn_WhenEmailNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("upn", "user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var email = currentUser.Email;

        // Assert
        Assert.Equal("user@example.com", email);
    }

    [Fact]
    public void Name_ShouldReturnNameClaim_WhenPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("name", "John Doe") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var name = currentUser.Name;

        // Assert
        Assert.Equal("John Doe", name);
    }

    [Fact]
    public void IsAuthenticated_ShouldReturnTrue_WhenUserIsAuthenticated()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("sub", "user123") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var isAuthenticated = currentUser.IsAuthenticated;

        // Assert
        Assert.True(isAuthenticated);
    }

    [Fact]
    public void IsAuthenticated_ShouldReturnFalse_WhenUserIsNotAuthenticated()
    {
        // Arrange
        var httpContextAccessor = new MockHttpContextAccessor(null);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var isAuthenticated = currentUser.IsAuthenticated;

        // Assert
        Assert.False(isAuthenticated);
    }

    [Fact]
    public void AuthenticationScheme_ShouldReturnAuthenticationType()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("sub", "user123") };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var scheme = currentUser.AuthenticationScheme;

        // Assert
        Assert.Equal("Bearer", scheme);
    }

    [Fact]
    public void Roles_ShouldReturnRolesFromClaims()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("roles", "admin"),
            new Claim("roles", "reviewer"),
            new Claim(ClaimTypes.Role, "approver")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var roles = currentUser.Roles.ToList();

        // Assert
        Assert.Contains("admin", roles);
        Assert.Contains("reviewer", roles);
        Assert.Contains("approver", roles);
    }

    [Fact]
    public void Roles_ShouldParseKeycloakRealmAccess()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("realm_access", "{\"roles\":[\"admin\",\"reviewer\"]}")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var roles = currentUser.Roles.ToList();

        // Assert
        Assert.Contains("admin", roles);
        Assert.Contains("reviewer", roles);
    }

    [Fact]
    public void Groups_ShouldReturnGroupsFromClaims()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("groups", "group1"),
            new Claim("groups", "group2")
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var groups = currentUser.Groups.ToList();

        // Assert
        Assert.Contains("group1", groups);
        Assert.Contains("group2", groups);
    }

    [Fact]
    public async Task GetUserAsync_ShouldReturnUserInfo_WhenUserIsAuthenticated()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("sub", "user123"),
            new Claim("email", "test@example.com"),
            new Claim("name", "John Doe"),
            new Claim("roles", "admin")
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        organizationMapper.SetupGetOrganizationId("test@example.com", "org123");
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userInfo = await currentUser.GetUserAsync();

        // Assert
        Assert.NotNull(userInfo);
        Assert.Equal("user123", userInfo.UserId);
        Assert.Equal("test@example.com", userInfo.Email);
        Assert.Equal("John Doe", userInfo.Name);
        Assert.Contains("admin", userInfo.Roles);
        Assert.Equal("Bearer", userInfo.AuthenticationScheme);
        Assert.True(userInfo.IsAuthenticated);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnOrganizationId_WhenEmailExists()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("email", "test@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        organizationMapper.SetupGetOrganizationId("test@example.com", "org123");
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var orgId = await currentUser.GetOrganizationIdAsync();

        // Assert
        Assert.Equal("org123", orgId);
    }

    [Fact]
    public async Task GetOrganizationIdAsync_ShouldReturnNull_WhenEmailIsEmpty()
    {
        // Arrange
        var identity = new ClaimsIdentity();
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var orgId = await currentUser.GetOrganizationIdAsync();

        // Assert
        Assert.Null(orgId);
    }

    [Fact]
    public void HasRole_ShouldReturnTrue_WhenUserHasRole()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("roles", "admin") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var hasRole = currentUser.HasRole("admin");

        // Assert
        Assert.True(hasRole);
    }

    [Fact]
    public void HasRole_ShouldBeCaseInsensitive()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("roles", "Admin") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var hasRole = currentUser.HasRole("admin");

        // Assert
        Assert.True(hasRole);
    }

    [Fact]
    public void BelongsToGroup_ShouldReturnTrue_WhenUserBelongsToGroup()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("groups", "group1") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var belongsToGroup = currentUser.BelongsToGroup("group1");

        // Assert
        Assert.True(belongsToGroup);
    }
}

public class MockHttpContextAccessor : IHttpContextAccessor
{
    private readonly HttpContext? _httpContext;

    public MockHttpContextAccessor(HttpContext? httpContext)
    {
        _httpContext = httpContext;
    }

    public HttpContext? HttpContext
    {
        get => _httpContext;
        set => throw new NotSupportedException();
    }
}

public class MockOrganizationMapper : IOrganizationMapper
{
    private readonly Dictionary<string, string> _organizationMappings = new();
    private readonly Dictionary<string, OrganizationInfo> _organizations = new();

    public void SetupGetOrganizationId(string email, string? organizationId)
    {
        if (organizationId != null)
        {
            _organizationMappings[email.ToLowerInvariant()] = organizationId;
        }
    }

    public Task<string?> GetOrganizationIdAsync(string email)
    {
        var normalizedEmail = email.ToLowerInvariant();
        return Task.FromResult(_organizationMappings.TryGetValue(normalizedEmail, out var orgId) ? orgId : null);
    }

    public Task<OrganizationInfo?> GetOrganizationAsync(string email)
    {
        var orgId = GetOrganizationIdAsync(email).Result;
        if (orgId == null) return Task.FromResult<OrganizationInfo?>(null);
        
        return Task.FromResult(_organizations.TryGetValue(orgId, out var org) ? org : null);
    }

    public Task MapUserToOrganizationAsync(string email, string organizationId)
    {
        _organizationMappings[email.ToLowerInvariant()] = organizationId;
        return Task.CompletedTask;
    }

    public Task<bool> BelongsToOrganizationAsync(string email, string organizationId)
    {
        var userOrgId = GetOrganizationIdAsync(email).Result;
        return Task.FromResult(userOrgId == organizationId);
    }
}

