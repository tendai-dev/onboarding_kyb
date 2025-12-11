using OnboardingApi.Application.Checklist.Commands;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Checklist;

public class CompleteChecklistItemCommandHandlerTests
{
    private readonly MockChecklistRepository _repositoryMock;
    private readonly CompleteChecklistItemCommandHandler _handler;

    public CompleteChecklistItemCommandHandlerTests()
    {
        _repositoryMock = new MockChecklistRepository();
        _handler = new CompleteChecklistItemCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldCompleteItem_WhenChecklistExists()
    {
        // Arrange
        var checklist = CreateTestChecklist();
        var itemId = checklist.Items[0].Id;
        _repositoryMock.SetupGetById(checklist.Id, checklist);

        var command = new CompleteChecklistItemCommand(
            ChecklistId: checklist.Id.Value,
            ItemId: itemId.Value,
            CompletedBy: "test@example.com",
            Notes: "Verified successfully"
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(checklist.Id.Value, result.ChecklistId);
        Assert.Equal(itemId.Value, result.ItemId);
        Assert.True(result.IsCompleted);
        Assert.True(result.CompletionPercentage > 0);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenChecklistNotFound()
    {
        // Arrange
        var command = new CompleteChecklistItemCommand(
            ChecklistId: Guid.NewGuid(),
            ItemId: Guid.NewGuid(),
            CompletedBy: "test@example.com"
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
            },
            new ChecklistItemTemplate
            {
                Code = "ADDR_VERIFY",
                Name = "Address Verification",
                Description = "Verify address",
                Category = ChecklistItemCategory.Address,
                IsRequired = false,
                Order = 2
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

