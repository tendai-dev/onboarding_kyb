using OnboardingApi.Application.Checklist.Commands;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Tests.Unit.TestHelpers;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Checklist;

public class SkipChecklistItemCommandHandlerTests
{
    private readonly MockChecklistRepository _repositoryMock;
    private readonly SkipChecklistItemCommandHandler _handler;

    public SkipChecklistItemCommandHandlerTests()
    {
        _repositoryMock = new MockChecklistRepository();
        _handler = new SkipChecklistItemCommandHandler(_repositoryMock);
    }

    [Fact]
    public async Task Handle_ShouldSkipItem_WhenItemIsNotRequired()
    {
        // Arrange
        var checklist = CreateTestChecklist();
        var itemId = checklist.Items.First(i => !i.IsRequired).Id;
        _repositoryMock.SetupGetById(checklist.Id, checklist);

        var command = new SkipChecklistItemCommand(
            ChecklistId: checklist.Id.Value,
            ItemId: itemId.Value,
            SkippedBy: "test@example.com",
            Reason: "Not applicable"
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
        var command = new SkipChecklistItemCommand(
            ChecklistId: Guid.NewGuid(),
            ItemId: Guid.NewGuid(),
            SkippedBy: "test@example.com",
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

