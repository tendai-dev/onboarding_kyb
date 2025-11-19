namespace ProjectionsApi.Domain;

public record SyncOnboardingCasesResult
{
    public int CasesSynced { get; init; }
    public int CasesCreated { get; init; }
    public int CasesUpdated { get; init; }
    public int Errors { get; init; }
    public DateTime CompletedAt { get; init; }
}

