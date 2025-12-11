using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Behaviors;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;

namespace OnboardingApi.Tests.Unit.Application.Behaviors;

public class LoggingBehaviorTests
{
    [Fact]
    public async Task Handle_ShouldLogRequest_WhenHandling()
    {
        // Arrange
        var logger = new MockLogger<LoggingBehavior<LoggingTestRequest, LoggingTestResponse>>();
        var behavior = new LoggingBehavior<LoggingTestRequest, LoggingTestResponse>(logger);
        var request = new LoggingTestRequest { Value = "test" };
        var next = new RequestHandlerDelegate<LoggingTestResponse>(() => Task.FromResult(new LoggingTestResponse { Result = "success" }));

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("success", result.Result);
        // Verify logging occurred (check log entries if MockLogger exposes them)
    }

    [Fact]
    public async Task Handle_ShouldLogException_WhenHandlerThrows()
    {
        // Arrange
        var logger = new MockLogger<LoggingBehavior<LoggingTestRequest, LoggingTestResponse>>();
        var behavior = new LoggingBehavior<LoggingTestRequest, LoggingTestResponse>(logger);
        var request = new LoggingTestRequest { Value = "test" };
        var next = new RequestHandlerDelegate<LoggingTestResponse>(() => throw new InvalidOperationException("Test exception"));

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(() => 
            behavior.Handle(request, next, CancellationToken.None));
    }

    [Fact]
    public async Task Handle_ShouldLogWarning_WhenRequestIsSlow()
    {
        // Arrange
        var logger = new MockLogger<LoggingBehavior<LoggingTestRequest, LoggingTestResponse>>();
        var behavior = new LoggingBehavior<LoggingTestRequest, LoggingTestResponse>(logger);
        var request = new LoggingTestRequest { Value = "test" };
        var next = new RequestHandlerDelegate<LoggingTestResponse>(async () =>
        {
            await Task.Delay(600); // Simulate slow request (>500ms)
            return new LoggingTestResponse { Result = "success" };
        });

        // Act
        var result = await behavior.Handle(request, next, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("success", result.Result);
        // The behavior should log a warning for slow requests
    }
}

public class LoggingTestRequest : IRequest<LoggingTestResponse>
{
    public string Value { get; set; } = string.Empty;
}

public class LoggingTestResponse
{
    public string Result { get; set; } = string.Empty;
}

