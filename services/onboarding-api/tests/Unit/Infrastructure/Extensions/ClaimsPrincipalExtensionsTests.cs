using System.Security.Claims;
using OnboardingApi.Infrastructure.Extensions;
using Xunit;

namespace OnboardingApi.Tests.Unit.Infrastructure.Extensions;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void IsExternalUser_ShouldReturnTrue_WhenPreferredUsernameExists()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("preferred_username", "user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsExternalUser();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExternalUser_ShouldReturnTrue_WhenEmailExists()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("email", "user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsExternalUser();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsExternalUser_ShouldReturnFalse_WhenNoExternalClaims()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("sub", "user123") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsExternalUser();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsExternalUser_ShouldReturnFalse_WhenPrincipalIsNull()
    {
        // Arrange
        ClaimsPrincipal? principal = null;

        // Act
        var result = principal!.IsExternalUser();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsInternalUser_ShouldReturnTrue_WhenWindowsAccountNameExists()
    {
        // Arrange
        var claims = new List<Claim> 
        { 
            new Claim("http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname", "DOMAIN\\user") 
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsInternalUser();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsInternalUser_ShouldReturnTrue_WhenUpnExists()
    {
        // Arrange
        var claims = new List<Claim> 
        { 
            new Claim("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn", "user@domain.com") 
        };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsInternalUser();

        // Assert
        Assert.True(result);
    }

    [Fact]
    public void IsInternalUser_ShouldReturnFalse_WhenNoInternalClaims()
    {
        // Arrange
        var claims = new List<Claim> { new Claim("email", "user@example.com") };
        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);

        // Act
        var result = principal.IsInternalUser();

        // Assert
        Assert.False(result);
    }

    [Fact]
    public void IsInternalUser_ShouldReturnFalse_WhenPrincipalIsNull()
    {
        // Arrange
        ClaimsPrincipal? principal = null;

        // Act
        var result = principal!.IsInternalUser();

        // Assert
        Assert.False(result);
    }
}

