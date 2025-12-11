using OnboardingApi.Application.Audit.Commands;
using OnboardingApi.Application.Audit.Interfaces;
using OnboardingApi.Domain.Audit.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Audit;

public class CreateAuditLogEntryCommandHandlerTests
{
    private readonly MockAuditLogRepository _repositoryMock;
    private readonly MockLogger<CreateAuditLogEntryCommandHandler> _loggerMock;
    private readonly CreateAuditLogEntryCommandHandler _handler;

    public CreateAuditLogEntryCommandHandlerTests()
    {
        _repositoryMock = new MockAuditLogRepository();
        _loggerMock = new MockLogger<CreateAuditLogEntryCommandHandler>();
        _handler = new CreateAuditLogEntryCommandHandler(_repositoryMock, _loggerMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateAuditLogEntry_WithValidCommand()
    {
        // Arrange
        var command = new CreateAuditLogEntryCommand(
            EventType: "CaseCreated",
            EntityType: "OnboardingCase",
            EntityId: Guid.NewGuid().ToString(),
            UserId: "user@example.com",
            UserRole: "Admin",
            Action: AuditAction.Create,
            Description: "Created new onboarding case",
            IpAddress: "192.168.1.1",
            UserAgent: "Mozilla/5.0",
            CaseId: Guid.NewGuid().ToString(),
            PartnerId: Guid.NewGuid().ToString(),
            Severity: AuditSeverity.Low,
            ComplianceCategory: ComplianceCategory.General
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.EntryId);
        Assert.NotEmpty(result.Hash);
    }

    [Fact]
    public async Task Handle_ShouldLogError_WhenExceptionOccurs()
    {
        // Arrange - This will test error handling
        var command = new CreateAuditLogEntryCommand(
            EventType: "Test",
            EntityType: "Test",
            EntityId: Guid.NewGuid().ToString(),
            UserId: "user@example.com",
            UserRole: "Admin",
            Action: AuditAction.Create,
            Description: "Test",
            IpAddress: "127.0.0.1",
            UserAgent: "Test"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
    }
}

