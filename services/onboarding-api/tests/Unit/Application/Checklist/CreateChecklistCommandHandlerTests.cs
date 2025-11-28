using OnboardingApi.Application.Checklist.Commands;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.ValueObjects;
using DomainChecklist = OnboardingApi.Domain.Checklist.Aggregates.Checklist;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Checklist;

public class CreateChecklistCommandHandlerTests
{
    private readonly MockChecklistRepository _repositoryMock;
    private readonly MockChecklistTemplateService _templateServiceMock;
    private readonly CreateChecklistCommandHandler _handler;

    public CreateChecklistCommandHandlerTests()
    {
        _repositoryMock = new MockChecklistRepository();
        _templateServiceMock = new MockChecklistTemplateService();

        _handler = new CreateChecklistCommandHandler(
            _repositoryMock,
            _templateServiceMock);
    }

    [Fact]
    public async Task Handle_ShouldCreateChecklist_WithTemplates()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var checklistType = ChecklistType.Individual;

        var templates = new List<ChecklistItemTemplate>
        {
            new ChecklistItemTemplate
            {
                Code = "ID_VERIFY",
                Name = "Identity Verification",
                Description = "Verify identity documents",
                Category = ChecklistItemCategory.Identity,
                IsRequired = true,
                Order = 1
            },
            new ChecklistItemTemplate
            {
                Code = "ADDR_VERIFY",
                Name = "Address Verification",
                Description = "Verify residential address",
                Category = ChecklistItemCategory.Address,
                IsRequired = true,
                Order = 2
            }
        };

        _templateServiceMock.SetupTemplates(checklistType, templates);

        var command = new CreateChecklistCommand(
            CaseId: caseId.ToString(),
            Type: checklistType,
            PartnerId: partnerId.ToString()
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.NotEqual(Guid.Empty, result.ChecklistId);
        Assert.Equal(caseId.ToString(), result.CaseId);
        Assert.Equal(checklistType.ToString(), result.Type);
        Assert.Equal(2, result.ItemCount);

        var addedChecklists = await _repositoryMock.GetByCaseIdAsync(caseId.ToString(), CancellationToken.None);
        Assert.NotNull(addedChecklists);
        Assert.Equal(2, addedChecklists!.Items.Count);
    }

    [Fact]
    public async Task Handle_ShouldCreateChecklist_WithEmptyTemplates()
    {
        // Arrange
        var caseId = Guid.NewGuid();
        var partnerId = Guid.NewGuid();
        var checklistType = ChecklistType.Individual;

        _templateServiceMock.SetupTemplates(checklistType, new List<ChecklistItemTemplate>());

        var command = new CreateChecklistCommand(
            CaseId: caseId.ToString(),
            Type: checklistType,
            PartnerId: partnerId.ToString()
        );

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(0, result.ItemCount);
    }
}
