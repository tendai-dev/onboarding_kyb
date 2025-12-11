using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Commands;
using OnboardingApi.Tests.Unit.TestHelpers;
using Xunit;
using ApplicationModel = OnboardingApi.Application.Commands.Application;

namespace OnboardingApi.Tests.Unit.Application.Commands;

public class AnonymizeUserHandlerTests
{
    private readonly MockLogger<AnonymizeUserHandler> _logger;
    private readonly MockApplicationRepository _repository;
    private readonly MockEventPublisher _eventPublisher;
    private readonly AnonymizeUserHandler _handler;

    public AnonymizeUserHandlerTests()
    {
        _logger = new MockLogger<AnonymizeUserHandler>();
        _repository = new MockApplicationRepository();
        _eventPublisher = new MockEventPublisher();
        _handler = new AnonymizeUserHandler(_logger, _repository, _eventPublisher);
    }

    [Fact]
    public async Task Handle_ShouldAnonymizeUserData_WhenApplicationsExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var application1 = new ApplicationModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Email = "test@example.com",
            PhoneNumber = "+1234567890",
            ApplicantName = "John Doe",
            IdentificationNumber = "ID123456",
            Address = "123 Main St",
            DateOfBirth = new DateTime(1990, 1, 15),
            BankAccountNumber = "ACC123",
            TaxNumber = "TAX123"
        };
        var application2 = new ApplicationModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Email = "test2@example.com",
            PhoneNumber = "+9876543210",
            ApplicantName = "Jane Doe"
        };

        _repository.SetupGetApplicationsByUserId(userId, new List<ApplicationModel> { application1, application2 });

        var command = new AnonymizeUserCommand(userId, "GDPR Request", "admin@example.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.AnonymizedAt);
        Assert.NotEmpty(result.AnonymizedFields);
        Assert.Contains("email", result.AnonymizedFields);
        Assert.Contains("phone_number", result.AnonymizedFields);
        Assert.Contains("name", result.AnonymizedFields);
        Assert.True(application1.IsAnonymized);
        Assert.True(application2.IsAnonymized);
        Assert.NotNull(application1.AnonymizedAt);
        Assert.NotNull(application2.AnonymizedAt);
        Assert.Equal("GDPR Request", application1.AnonymizationReason);
        Assert.True(_repository.UpdateCalled);
        Assert.True(_eventPublisher.PublishCalled);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenNoApplicationsFound()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _repository.SetupGetApplicationsByUserId(userId, new List<ApplicationModel>());
        var command = new AnonymizeUserCommand(userId, "GDPR Request", "admin@example.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("User not found", result.ErrorMessage);
        Assert.False(_repository.UpdateCalled);
        Assert.False(_eventPublisher.PublishCalled);
    }

    [Fact]
    public async Task Handle_ShouldHashSensitiveData()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var application = new ApplicationModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            IdentificationNumber = "ID123456",
            BankAccountNumber = "ACC123",
            TaxNumber = "TAX123"
        };

        _repository.SetupGetApplicationsByUserId(userId, new List<ApplicationModel> { application });
        var command = new AnonymizeUserCommand(userId, "GDPR Request", "admin@example.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.True(application.IdentificationNumber.StartsWith("HASH-"));
        Assert.True(application.BankAccountNumber.StartsWith("HASH-"));
        Assert.True(application.TaxNumber.StartsWith("HASH-"));
    }

    [Fact]
    public async Task Handle_ShouldAnonymizeDateOfBirth()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var originalDob = new DateTime(1990, 6, 15);
        var application = new ApplicationModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            DateOfBirth = originalDob
        };

        _repository.SetupGetApplicationsByUserId(userId, new List<ApplicationModel> { application });
        var command = new AnonymizeUserCommand(userId, "GDPR Request", "admin@example.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(application.DateOfBirth);
        Assert.Equal(originalDob.Year, application.DateOfBirth.Value.Year);
        Assert.Equal(1, application.DateOfBirth.Value.Month); // Should be anonymized to Jan 1
        Assert.Equal(1, application.DateOfBirth.Value.Day);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailed_WhenExceptionOccurs()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _repository.SetupGetApplicationsByUserId(userId, null); // Will cause exception
        var command = new AnonymizeUserCommand(userId, "GDPR Request", "admin@example.com");

        // Act
        var result = await _handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.NotNull(result.ErrorMessage);
    }
}

// Manual mocks
public class MockApplicationRepository : IApplicationRepository
{
    private readonly Dictionary<Guid, List<ApplicationModel>> _applicationsByUserId = new();
    public bool UpdateCalled { get; private set; }

    public Task<List<ApplicationModel>> GetApplicationsByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        if (_applicationsByUserId.TryGetValue(userId, out var applications))
        {
            return Task.FromResult(applications ?? new List<ApplicationModel>());
        }
        return Task.FromResult(new List<ApplicationModel>());
    }

    public Task UpdateAsync(ApplicationModel application, CancellationToken cancellationToken = default)
    {
        UpdateCalled = true;
        return Task.CompletedTask;
    }

    public void SetupGetApplicationsByUserId(Guid userId, List<ApplicationModel>? applications)
    {
        if (applications != null)
        {
            _applicationsByUserId[userId] = applications;
        }
        else
        {
            _applicationsByUserId.Remove(userId);
        }
    }
}

public class MockEventPublisher : IEventPublisher
{
    public bool PublishCalled { get; private set; }
    public object? LastEvent { get; private set; }

    public async Task PublishAsync<T>(T domainEvent, CancellationToken cancellationToken = default) where T : class
    {
        PublishCalled = true;
        LastEvent = domainEvent;
        await Task.CompletedTask;
    }
}

