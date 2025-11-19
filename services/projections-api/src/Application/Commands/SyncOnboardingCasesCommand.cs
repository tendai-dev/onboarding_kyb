namespace ProjectionsApi.Application.Commands;

/// <summary>
/// Command to sync onboarding cases from the onboarding database to projections
/// </summary>
public record SyncOnboardingCasesCommand
{
    public bool ForceFullSync { get; init; } = false;
}

