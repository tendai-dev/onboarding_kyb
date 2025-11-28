using FluentValidation;
using MediatR;
using OnboardingApi.Application.Behaviors;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Behaviors;

public class ValidationBehaviorTests
{
    [Fact]
    public async Task Handle_ShouldPassThrough_WhenNoValidators()
    {
        // Arrange
        var behavior = new ValidationBehavior<TestRequest, TestResponse>(Array.Empty<IValidator<TestRequest>>());
        var request = new TestRequest { Value = "test" };
        var next = new RequestHandlerDelegate<TestResponse>(() => Task.FromResult(new TestResponse { Result = "success" }));

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("success", result.Result);
    }

    [Fact]
    public async Task Handle_ShouldPassThrough_WhenValidationPasses()
    {
        // Arrange
        var validator = new TestRequestValidator();
        var behavior = new ValidationBehavior<TestRequest, TestResponse>(new[] { validator });
        var request = new TestRequest { Value = "valid" };
        var next = new RequestHandlerDelegate<TestResponse>(() => Task.FromResult(new TestResponse { Result = "success" }));

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("success", result.Result);
    }

    [Fact]
    public async Task Handle_ShouldThrow_WhenValidationFails()
    {
        // Arrange
        var validator = new TestRequestValidator();
        var behavior = new ValidationBehavior<TestRequest, TestResponse>(new[] { validator });
        var request = new TestRequest { Value = "" }; // Invalid
        var next = new RequestHandlerDelegate<TestResponse>(() => Task.FromResult(new TestResponse { Result = "success" }));

        // Act & Assert
        await Assert.ThrowsAsync<ValidationException>(() => 
            behavior.Handle(request, next, CancellationToken.None));
    }
}

public class TestRequest : IRequest<TestResponse>
{
    public string Value { get; set; } = string.Empty;
}

public class TestResponse
{
    public string Result { get; set; } = string.Empty;
}

public class TestRequestValidator : AbstractValidator<TestRequest>
{
    public TestRequestValidator()
    {
        RuleFor(x => x.Value)
            .NotEmpty()
            .WithMessage("Value cannot be empty");
    }
}
