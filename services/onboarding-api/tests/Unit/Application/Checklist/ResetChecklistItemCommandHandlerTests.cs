using OnboardingApi.Application.Checklist.Commands;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Checklist;

public class ResetChecklistItemCommandHandlerTests
{
    private readonly MockChecklistRepository _repositoryMock;
    private readonly ResetChecklistItemCommandHandler _handler;

    public ResetChecklistItemCommandHandlerTests()
    {
        _repositoryMock = new MockChecklistRepository();
        _handler = new ResetChecklistItemCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldResetItem_WhenChecklistExists()
    {
        // Arrange
        var checklist = CreateTestChecklist();
        var itemId = checklist.Items[0].Id;
        checklist.CompleteItem(itemId, "test@example.com"); // Complete first
        _repositoryMock.SetupGetById(checklist.Id, checklist);

        var command = new ResetChecklistItemCommand(
            ChecklistId: checklist.Id.Value,
            ItemId: itemId.Value,
            ResetBy: "admin@example.com",
            Reason: "Need to re-verify"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.Equal(checklist.Id.Value, result.ChecklistId);
        Assert.Equal(itemId.Value, result.ItemId);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenChecklistNotFound()
    {
        // Arrange
        var command = new ResetChecklistItemCommand(
            ChecklistId: Guid.NewGuid(),
            ItemId: Guid.NewGuid(),
            ResetBy: "test@example.com",
            Reason: "Test"
        );

        _repositoryMock.SetupGetById(ChecklistId.From(command.ChecklistId), null);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => _handler.Handle(command, CancellationToken.None));
    }

    private static DomainChecklist CreateTestChecklist()
    {
        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate
            {
                Code = "ID_VERIFY",
                Name = "Identity Verification",
                Description = "Verify identity",
                Category = ChecklistItemCategory.Identity,
                IsRequired = true,
                Order = 1
            }
        };

        return DomainChecklist.Create(
            Guid.NewGuid().ToString(),
            ChecklistType.Individual,
            Guid.NewGuid().ToString(),
            templates
        );
    }
}

