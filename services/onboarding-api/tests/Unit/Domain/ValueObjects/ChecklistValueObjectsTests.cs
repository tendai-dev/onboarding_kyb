using OnboardingApi.Domain.Checklist.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class ChecklistIdTests
{
    [Fact]
    public void New_ShouldCreateNewGuid()
    {
        // Act
        var id1 = ChecklistId.New();
        var id2 = ChecklistId.New();

        // Assert
        Assert.NotEqual(id1.Value, id2.Value);
        Assert.NotEqual(Guid.Empty, id1.Value);
        Assert.NotEqual(Guid.Empty, id2.Value);
    }

    [Fact]
    public void From_Guid_ShouldCreateFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        var id = ChecklistId.From(guid);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldCreateFromString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var guidString = guid.ToString();

        // Act
        var id = ChecklistId.From(guidString);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldThrow_WhenInvalidGuid()
    {
        // Arrange
        var invalidGuid = "not-a-guid";

        // Act & Assert
        Assert.Throws<FormatException>(() => ChecklistId.From(invalidGuid));
    }

    [Fact]
    public void ToString_ShouldReturnGuidString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = ChecklistId.From(guid);

        // Act
        var result = id.ToString();

        // Assert
        Assert.Equal(guid.ToString(), result);
    }

    [Fact]
    public void ImplicitOperator_Guid_ShouldConvertToGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = ChecklistId.From(guid);

        // Act
        Guid result = id;

        // Assert
        Assert.Equal(guid, result);
    }

    [Fact]
    public void ImplicitOperator_ChecklistId_ShouldConvertFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        ChecklistId id = guid;

        // Assert
        Assert.Equal(guid, id.Value);
    }
}

public class ChecklistItemIdTests
{
    [Fact]
    public void New_ShouldCreateNewGuid()
    {
        // Act
        var id1 = ChecklistItemId.New();
        var id2 = ChecklistItemId.New();

        // Assert
        Assert.NotEqual(id1.Value, id2.Value);
        Assert.NotEqual(Guid.Empty, id1.Value);
        Assert.NotEqual(Guid.Empty, id2.Value);
    }

    [Fact]
    public void From_Guid_ShouldCreateFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        var id = ChecklistItemId.From(guid);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldCreateFromString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var guidString = guid.ToString();

        // Act
        var id = ChecklistItemId.From(guidString);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldThrow_WhenInvalidGuid()
    {
        // Arrange
        var invalidGuid = "not-a-guid";

        // Act & Assert
        Assert.Throws<FormatException>(() => ChecklistItemId.From(invalidGuid));
    }

    [Fact]
    public void ToString_ShouldReturnGuidString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = ChecklistItemId.From(guid);

        // Act
        var result = id.ToString();

        // Assert
        Assert.Equal(guid.ToString(), result);
    }

    [Fact]
    public void ImplicitOperator_Guid_ShouldConvertToGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = ChecklistItemId.From(guid);

        // Act
        Guid result = id;

        // Assert
        Assert.Equal(guid, result);
    }

    [Fact]
    public void ImplicitOperator_ChecklistItemId_ShouldConvertFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        ChecklistItemId id = guid;

        // Assert
        Assert.Equal(guid, id.Value);
    }
}

public class ChecklistItemTemplateTests
{
    [Fact]
    public void ChecklistItemTemplate_ShouldInitializeWithDefaultValues()
    {
        // Arrange & Act
        var template = new ChecklistItemTemplate();

        // Assert
        Assert.Equal(string.Empty, template.Code);
        Assert.Equal(string.Empty, template.Name);
        Assert.Equal(string.Empty, template.Description);
        Assert.Equal(default(ChecklistItemCategory), template.Category);
        Assert.False(template.IsRequired);
        Assert.Equal(0, template.Order);
    }

    [Fact]
    public void ChecklistItemTemplate_ShouldAllowSettingAllProperties()
    {
        // Arrange & Act
        var template = new ChecklistItemTemplate
        {
            Code = "PASSPORT",
            Name = "Passport Copy",
            Description = "Upload a copy of your passport",
            Category = ChecklistItemCategory.Identity,
            IsRequired = true,
            Order = 1
        };

        // Assert
        Assert.Equal("PASSPORT", template.Code);
        Assert.Equal("Passport Copy", template.Name);
        Assert.Equal("Upload a copy of your passport", template.Description);
        Assert.Equal(ChecklistItemCategory.Identity, template.Category);
        Assert.True(template.IsRequired);
        Assert.Equal(1, template.Order);
    }
}

