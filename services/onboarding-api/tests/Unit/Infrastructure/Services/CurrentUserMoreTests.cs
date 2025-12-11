using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using OnboardingApi.Application.Interfaces;
using OnboardingApi.Infrastructure.Services;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Services;

public class CurrentUserMoreTests
{
    [Fact]
    public void UserId_ShouldReturnOid_WhenSubAndNameIdentifierNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("oid", "azure-oid-123") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal("azure-oid-123", userId);
    }

    [Fact]
    public void UserId_ShouldReturnUpn_WhenSubNameIdentifierAndOidNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("upn", "user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test", "name", "role");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal("user@example.com", userId);
    }

    [Fact]
    public void UserId_ShouldReturnIdentityName_WhenNoClaimsPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("name", "username123") };
        var identity = new ClaimsIdentity(claims, "Test", "name", "role");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userId = currentUser.UserId;

        // Assert
        Assert.Equal("username123", userId);
    }

    [Fact]
    public void Email_ShouldReturnClaimTypesEmail_WhenEmailClaimNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim(ClaimTypes.Email, "test@example.com") };
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
    public void Email_ShouldReturnPreferredUsername_WhenEmailAndUpnNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("preferred_username", "user@example.com") };
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
    public void Name_ShouldReturnClaimTypesName_WhenNameClaimNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim(ClaimTypes.Name, "John Doe") };
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
    public void Name_ShouldReturnGivenName_WhenNameAndClaimTypesNameNotPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("given_name", "John") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var name = currentUser.Name;

        // Assert
        Assert.Equal("John", name);
    }

    [Fact]
    public void Name_ShouldReturnIdentityName_WhenNoNameClaimsPresent()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("name", "John Doe") };
        var identity = new ClaimsIdentity(claims, "Test", "name", "role");
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
    public void Roles_ShouldReturnRolesFromMicrosoftRoleClaim()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "admin")
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
    }

    [Fact]
    public void Roles_ShouldParseKeycloakRealmAccess_WithApprover()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("realm_access", "{\"roles\":[\"approver\"]}")
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
        Assert.Contains("approver", roles);
    }

    [Fact]
    public void Roles_ShouldParseKeycloakRealmAccess_WithPartner()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("realm_access", "{\"roles\":[\"partner\"]}")
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
        Assert.Contains("partner", roles);
    }

    [Fact]
    public void Roles_ShouldReturnDistinctRoles()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("roles", "admin"),
            new Claim("roles", "admin"), // Duplicate
            new Claim(ClaimTypes.Role, "admin") // Also admin
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
        Assert.Single(roles);
        Assert.Equal("admin", roles[0]);
    }

    [Fact]
    public void Roles_ShouldReturnEmpty_WhenPrincipalIsNull()
    {
        // Arrange
        var httpContextAccessor = new MockHttpContextAccessor(null);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var roles = currentUser.Roles.ToList();

        // Assert
        Assert.Empty(roles);
    }

    [Fact]
    public void Groups_ShouldReturnEmpty_WhenPrincipalIsNull()
    {
        // Arrange
        var httpContextAccessor = new MockHttpContextAccessor(null);
        var organizationMapper = new MockOrganizationMapper();
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var groups = currentUser.Groups.ToList();

        // Assert
        Assert.Empty(groups);
    }

    [Fact]
    public void BelongsToGroup_ShouldBeCaseInsensitive()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("groups", "Group1") };
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

    [Fact]
    public async Task GetUserAsync_ShouldReturnUserInfo_WhenUserIsExternal()
    {
        // Arrange
        var claims = new List<Claim>
        {
            new Claim("sub", "user123"),
            new Claim("email", "external@example.com"),
            new Claim("iss", "keycloak") // External user indicator
        };
        var identity = new ClaimsIdentity(claims, "Bearer");
        var principal = new ClaimsPrincipal(identity);
        var httpContext = new DefaultHttpContext { User = principal };
        var httpContextAccessor = new MockHttpContextAccessor(httpContext);
        var organizationMapper = new MockOrganizationMapper();
        organizationMapper.SetupGetOrganizationId("external@example.com", "org456");
        var currentUser = new CurrentUser(httpContextAccessor, organizationMapper);

        // Act
        var userInfo = await currentUser.GetUserAsync();

        // Assert
        Assert.NotNull(userInfo);
        Assert.Equal("org456", userInfo.OrganizationId);
        Assert.True(userInfo.IsExternalUser);
    }

    [Fact]
    public async Task GetUserAsync_ShouldReturnNullOrganizationId_WhenEmailIsEmpty()
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
        var userInfo = await currentUser.GetUserAsync();

        // Assert
        Assert.NotNull(userInfo);
        Assert.Null(userInfo.OrganizationId);
    }
}

