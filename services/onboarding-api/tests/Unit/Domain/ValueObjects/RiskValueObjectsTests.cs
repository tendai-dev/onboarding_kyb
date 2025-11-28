using OnboardingApi.Domain.Risk.ValueObjects;
using Xunit;

namespace OnboardingApi.Tests.Unit.Domain.ValueObjects;

public class RiskAssessmentIdTests
{
    [Fact]
    public void New_ShouldCreateNewGuid()
    {
        // Act
        var id1 = RiskAssessmentId.New();
        var id2 = RiskAssessmentId.New();

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
        var id = RiskAssessmentId.From(guid);

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
        var id = RiskAssessmentId.From(guidString);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldThrow_WhenInvalidGuid()
    {
        // Arrange
        var invalidGuid = "not-a-guid";

        // Act & Assert
        Assert.Throws<FormatException>(() => RiskAssessmentId.From(invalidGuid));
    }

    [Fact]
    public void ToString_ShouldReturnGuidString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = RiskAssessmentId.From(guid);

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
        var id = RiskAssessmentId.From(guid);

        // Act
        Guid result = id;

        // Assert
        Assert.Equal(guid, result);
    }

    [Fact]
    public void ImplicitOperator_RiskAssessmentId_ShouldConvertFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        RiskAssessmentId id = guid;

        // Assert
        Assert.Equal(guid, id.Value);
    }
}

public class RiskFactorIdTests
{
    [Fact]
    public void New_ShouldCreateNewGuid()
    {
        // Act
        var id1 = RiskFactorId.New();
        var id2 = RiskFactorId.New();

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
        var id = RiskFactorId.From(guid);

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
        var id = RiskFactorId.From(guidString);

        // Assert
        Assert.Equal(guid, id.Value);
    }

    [Fact]
    public void From_String_ShouldThrow_WhenInvalidGuid()
    {
        // Arrange
        var invalidGuid = "not-a-guid";

        // Act & Assert
        Assert.Throws<FormatException>(() => RiskFactorId.From(invalidGuid));
    }

    [Fact]
    public void ToString_ShouldReturnGuidString()
    {
        // Arrange
        var guid = Guid.NewGuid();
        var id = RiskFactorId.From(guid);

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
        var id = RiskFactorId.From(guid);

        // Act
        Guid result = id;

        // Assert
        Assert.Equal(guid, result);
    }

    [Fact]
    public void ImplicitOperator_RiskFactorId_ShouldConvertFromGuid()
    {
        // Arrange
        var guid = Guid.NewGuid();

        // Act
        RiskFactorId id = guid;

        // Assert
        Assert.Equal(guid, id.Value);
    }
}

