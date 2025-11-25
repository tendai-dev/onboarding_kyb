namespace OnboardingApi.Domain.Document.ValueObjects;

public enum DocumentType
{
    PassportCopy = 1,
    DriversLicense = 2,
    NationalId = 3,
    ProofOfAddress = 4,
    BankStatement = 5,
    TaxDocument = 6,
    BusinessRegistration = 7,
    ArticlesOfIncorporation = 8,
    ShareholderRegistry = 9,
    FinancialStatements = 10,
    Other = 99
}

public enum DocumentStatus
{
    Uploaded = 1,
    VirusScanning = 2,
    PendingVerification = 3,
    Verified = 4,
    Rejected = 5
}

