using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace OnboardingApi.Presentation.Configuration;

public class DevelopmentAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public DevelopmentAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger, UrlEncoder encoder, ISystemClock clock)
        : base(options, logger, encoder, clock)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // This handler is only for development mode and when headers are present
        var userEmail = Request.Headers["X-User-Email"].FirstOrDefault();
        var userName = Request.Headers["X-User-Name"].FirstOrDefault();
        var userRole = Request.Headers["X-User-Role"].FirstOrDefault();
        var userId = Request.Headers["X-User-Id"].FirstOrDefault();

        if (string.IsNullOrEmpty(userEmail))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        // Create claims for the development user
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId ?? userEmail),
            new Claim(ClaimTypes.Email, userEmail),
            new Claim(ClaimTypes.Name, userName ?? userEmail),
            new Claim("preferred_username", userEmail),
            new Claim("email", userEmail)
        };

        if (!string.IsNullOrEmpty(userRole))
        {
            claims.Add(new Claim(ClaimTypes.Role, userRole));
            claims.Add(new Claim("roles", userRole));
        }

        var identity = new ClaimsIdentity(claims, Scheme.Name, ClaimTypes.Name, ClaimTypes.Role);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, Scheme.Name);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
