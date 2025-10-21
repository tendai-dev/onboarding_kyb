using RiskService.Domain.ValueObjects;

namespace RiskService.Domain.Aggregates;

public class RiskFactor
{
    public RiskFactorId Id { get; private set; }
    public RiskFactorType Type { get; private set; }
    public RiskLevel Level { get; private set; }
    public decimal Score { get; private set; }
    public string Description { get; private set; }
    public string? Source { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    private RiskFactor() { } // EF Core

    public static RiskFactor Create(
        RiskFactorType type,
        RiskLevel level,
        decimal score,
        string description,
        string? source = null)
    {
        if (score < 0 || score > 100)
            throw new ArgumentException("Risk score must be between 0 and 100", nameof(score));

        return new RiskFactor
        {
            Id = RiskFactorId.New(),
            Type = type,
            Level = level,
            Score = score,
            Description = description,
            Source = source,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(RiskLevel level, decimal score, string description)
    {
        if (score < 0 || score > 100)
            throw new ArgumentException("Risk score must be between 0 and 100", nameof(score));

        Level = level;
        Score = score;
        Description = description;
        UpdatedAt = DateTime.UtcNow;
    }
}
