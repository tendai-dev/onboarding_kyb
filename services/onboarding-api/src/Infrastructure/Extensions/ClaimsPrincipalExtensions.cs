using System.Security.Claims;

namespace OnboardingApi.Infrastructure.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static bool IsExternalUser(this ClaimsPrincipal user)
    {
        // External users (Keycloak) have preferred_username claim
        return user?.FindFirst("preferred_username") != null 
            || user?.FindFirst("email") != null;
    }

    public static bool IsInternalUser(this ClaimsPrincipal user)
    {
        // Internal users (AD) have windowsaccountname claim
        return user?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname") != null
            || user?.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn") != null;
    }
}

