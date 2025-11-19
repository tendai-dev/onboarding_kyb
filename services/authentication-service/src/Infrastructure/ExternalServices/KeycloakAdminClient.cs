using System.Net.Http.Json;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AuthenticationService.Infrastructure.ExternalServices;

/// <summary>
/// Client for interacting with Keycloak Admin REST API
/// </summary>
public class KeycloakAdminClient
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<KeycloakAdminClient> _logger;
    private string? _accessToken;
    private DateTime? _tokenExpiresAt;

    public KeycloakAdminClient(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<KeycloakAdminClient> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Get access token for Keycloak Admin API
    /// </summary>
    private async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        // Return cached token if still valid
        if (!string.IsNullOrEmpty(_accessToken) && _tokenExpiresAt.HasValue && _tokenExpiresAt > DateTime.UtcNow.AddMinutes(1))
        {
            return _accessToken;
        }

        var realm = _configuration["Keycloak:Realm"] ?? "master";
        var adminUser = _configuration["Keycloak:AdminUser"] ?? "admin";
        var adminPassword = _configuration["Keycloak:AdminPassword"] ?? "admin";
        var clientId = _configuration["Keycloak:AdminClientId"] ?? "admin-cli";

        try
        {
            var tokenUrl = $"/realms/{realm}/protocol/openid-connect/token";
            var requestBody = new Dictionary<string, string>
            {
                { "grant_type", "password" },
                { "username", adminUser },
                { "password", adminPassword },
                { "client_id", clientId }
            };

            var content = new FormUrlEncodedContent(requestBody);
            var response = await _httpClient.PostAsync(tokenUrl, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to get Keycloak admin token. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new Exception($"Failed to authenticate with Keycloak Admin API: {response.StatusCode}");
            }

            var tokenResponse = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            
            if (tokenResponse.HasValue && tokenResponse.Value.TryGetProperty("access_token", out var tokenElement))
            {
                _accessToken = tokenElement.GetString();
                
                // Cache token for ~55 minutes (tokens typically expire in 60 minutes)
                if (tokenResponse.Value.TryGetProperty("expires_in", out var expiresIn))
                {
                    var expiresInSeconds = expiresIn.GetInt32();
                    _tokenExpiresAt = DateTime.UtcNow.AddSeconds(expiresInSeconds - 300); // Refresh 5 min early
                }
                else
                {
                    _tokenExpiresAt = DateTime.UtcNow.AddMinutes(55);
                }

                return _accessToken!;
            }

            throw new Exception("Failed to extract access token from Keycloak response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Keycloak admin access token");
            throw;
        }
    }

    /// <summary>
    /// Get all users from Keycloak realm
    /// </summary>
    public async Task<List<KeycloakUser>> GetUsersAsync(
        string? search = null,
        int? first = null,
        int? max = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            var queryParams = new List<string>();
            if (!string.IsNullOrEmpty(search))
            {
                queryParams.Add($"search={Uri.EscapeDataString(search)}");
            }
            if (first.HasValue)
            {
                queryParams.Add($"first={first.Value}");
            }
            if (max.HasValue)
            {
                queryParams.Add($"max={max.Value}");
            }

            var queryString = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
            var url = $"/admin/realms/{realm}/users{queryString}";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to get users from Keycloak. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                
                // Return empty list if Keycloak is not available
                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable || 
                    response.StatusCode == System.Net.HttpStatusCode.GatewayTimeout)
                {
                    _logger.LogWarning("Keycloak is not available, returning empty user list");
                    return new List<KeycloakUser>();
                }

                throw new Exception($"Failed to get users from Keycloak: {response.StatusCode}");
            }

            var users = await response.Content.ReadFromJsonAsync<List<KeycloakUser>>(cancellationToken: cancellationToken);
            return users ?? new List<KeycloakUser>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching users from Keycloak");
            throw;
        }
    }

    /// <summary>
    /// Get user roles from Keycloak
    /// </summary>
    public async Task<List<KeycloakRole>> GetUserRolesAsync(
        string userId,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            var url = $"/admin/realms/{realm}/users/{userId}/role-mappings/realm";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                // User might not have roles, return empty list
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    return new List<KeycloakRole>();
                }

                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogWarning("Failed to get roles for user {UserId}. Status: {Status}, Error: {Error}", 
                    userId, response.StatusCode, errorContent);
                return new List<KeycloakRole>();
            }

            var roles = await response.Content.ReadFromJsonAsync<List<KeycloakRole>>(cancellationToken: cancellationToken);
            return roles ?? new List<KeycloakRole>();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error fetching roles for user {UserId}", userId);
            return new List<KeycloakRole>();
        }
    }

    /// <summary>
    /// Get all realm roles from Keycloak
    /// </summary>
    public async Task<List<KeycloakRole>> GetRealmRolesAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            var url = $"/admin/realms/{realm}/roles";

            var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to get realm roles from Keycloak. Status: {Status}, Error: {Error}", 
                    response.StatusCode, errorContent);
                throw new Exception($"Failed to get realm roles: {response.StatusCode}");
            }

            var roles = await response.Content.ReadFromJsonAsync<List<KeycloakRole>>(cancellationToken: cancellationToken);
            return roles ?? new List<KeycloakRole>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching realm roles from Keycloak");
            throw;
        }
    }

    /// <summary>
    /// Assign role to user in Keycloak
    /// </summary>
    public async Task AssignRoleToUserAsync(
        string userId,
        string roleName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            // First, get the role details
            var roles = await GetRealmRolesAsync(cancellationToken);
            var role = roles.FirstOrDefault(r => r.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase) && !r.ClientRole);

            if (role == null)
            {
                throw new Exception($"Role '{roleName}' not found in realm");
            }

            // Assign the role
            var url = $"/admin/realms/{realm}/users/{userId}/role-mappings/realm";

            var roleList = new List<KeycloakRole> { role };
            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(roleList)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to assign role {Role} to user {UserId}. Status: {Status}, Error: {Error}", 
                    roleName, userId, response.StatusCode, errorContent);
                throw new Exception($"Failed to assign role: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error assigning role {Role} to user {UserId}", roleName, userId);
            throw;
        }
    }

    /// <summary>
    /// Remove role from user in Keycloak
    /// </summary>
    public async Task RemoveRoleFromUserAsync(
        string userId,
        string roleName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            // First, get the role details
            var roles = await GetRealmRolesAsync(cancellationToken);
            var role = roles.FirstOrDefault(r => r.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase) && !r.ClientRole);

            if (role == null)
            {
                throw new Exception($"Role '{roleName}' not found in realm");
            }

            // Remove the role
            var url = $"/admin/realms/{realm}/users/{userId}/role-mappings/realm";

            var roleList = new List<KeycloakRole> { role };
            var request = new HttpRequestMessage(HttpMethod.Delete, url)
            {
                Content = JsonContent.Create(roleList)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to remove role {Role} from user {UserId}. Status: {Status}, Error: {Error}", 
                    roleName, userId, response.StatusCode, errorContent);
                throw new Exception($"Failed to remove role: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing role {Role} from user {UserId}", roleName, userId);
            throw;
        }
    }

    /// <summary>
    /// Create a new realm role in Keycloak
    /// </summary>
    public async Task<KeycloakRole> CreateRealmRoleAsync(
        string roleName,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            var url = $"/admin/realms/{realm}/roles";

            var newRole = new KeycloakRole
            {
                Name = roleName,
                Description = description,
                Composite = false,
                ClientRole = false
            };

            var request = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(newRole)
            };
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to create role {Role} in Keycloak. Status: {Status}, Error: {Error}", 
                    roleName, response.StatusCode, errorContent);
                
                // Check if role already exists
                if (response.StatusCode == System.Net.HttpStatusCode.Conflict)
                {
                    throw new Exception($"Role '{roleName}' already exists");
                }
                
                throw new Exception($"Failed to create role: {response.StatusCode}");
            }

            // Fetch the created role to get its ID
            var roles = await GetRealmRolesAsync(cancellationToken);
            return roles.FirstOrDefault(r => r.Name == roleName && !r.ClientRole) ?? newRole;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating role {Role} in Keycloak", roleName);
            throw;
        }
    }

    /// <summary>
    /// Delete a realm role from Keycloak
    /// </summary>
    public async Task DeleteRealmRoleAsync(
        string roleName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var token = await GetAccessTokenAsync(cancellationToken);
            var realm = _configuration["Keycloak:Realm"] ?? "master";

            // First, get the role to ensure it exists and get its ID
            var roles = await GetRealmRolesAsync(cancellationToken);
            var role = roles.FirstOrDefault(r => r.Name.Equals(roleName, StringComparison.OrdinalIgnoreCase) && !r.ClientRole);

            if (role == null)
            {
                throw new Exception($"Role '{roleName}' not found");
            }

            // Delete the role using its name (Keycloak API accepts role name)
            var url = $"/admin/realms/{realm}/roles/{Uri.EscapeDataString(roleName)}";

            var request = new HttpRequestMessage(HttpMethod.Delete, url);
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Failed to delete role {Role} from Keycloak. Status: {Status}, Error: {Error}", 
                    roleName, response.StatusCode, errorContent);
                throw new Exception($"Failed to delete role: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting role {Role} from Keycloak", roleName);
            throw;
        }
    }
}

/// <summary>
/// Keycloak user representation
/// </summary>
public class KeycloakUser
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public bool Enabled { get; set; }
    public long CreatedTimestamp { get; set; }
    public long? LastLoginTimestamp { get; set; }
    public Dictionary<string, object>? Attributes { get; set; }
}

/// <summary>
/// Keycloak role representation
/// </summary>
public class KeycloakRole
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Composite { get; set; }
    public bool ClientRole { get; set; }
    public string? ContainerId { get; set; }
}

