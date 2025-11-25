using MediatR;
using Microsoft.Extensions.Logging;
using OnboardingApi.Application.Document.Interfaces;
using DomainDocument = OnboardingApi.Domain.Document.Aggregates.Document;
using OnboardingApi.Domain.Document.ValueObjects;

namespace OnboardingApi.Application.Document.Commands;

public class UploadDocumentCommandHandler : IRequestHandler<UploadDocumentCommand, UploadDocumentResult>
{
    private readonly IDocumentRepository _repository;
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<UploadDocumentCommandHandler> _logger;

    public UploadDocumentCommandHandler(
        IDocumentRepository repository,
        IObjectStorage objectStorage,
        ILogger<UploadDocumentCommandHandler> logger)
    {
        _repository = repository;
        _objectStorage = objectStorage;
        _logger = logger;
    }

    public async Task<UploadDocumentResult> Handle(UploadDocumentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            _logger.LogInformation("Processing document upload for file: {FileName}", request.FileName);

            // Generate object key
            var objectKey = $"documents/{request.CaseId}/{Guid.NewGuid()}/{request.FileName}";
            var bucketName = "kyb-docs"; // Default bucket name
            _logger.LogInformation("Using bucket: {BucketName} for upload", bucketName);

            // Reset stream position if possible
            if (request.FileStream.CanSeek)
            {
                request.FileStream.Position = 0;
            }

            // Upload file to object storage
            await _objectStorage.UploadObjectAsync(
                bucketName,
                objectKey,
                request.FileStream,
                request.ContentType,
                cancellationToken);

            // Create document entity
            var document = DomainDocument.Create(
                request.CaseId,
                request.PartnerId,
                request.Type,
                request.FileName,
                request.ContentType,
                request.FileSizeBytes,
                objectKey,
                bucketName,
                request.Metadata,
                request.UploadedBy);

            // Save to database
            await _repository.AddAsync(document, cancellationToken);
            await _repository.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Document uploaded successfully: {DocumentId}, FileName: {FileName}", 
                document.Id, request.FileName);

            return new UploadDocumentResult
            {
                DocumentId = document.Id,
                DocumentNumber = document.DocumentNumber,
                WasDuplicate = false,
                ExistingDocumentId = null,
                StorageKey = objectKey
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document: {FileName}", request.FileName);
            throw;
        }
    }
}

public class GeneratePresignedDownloadUrlCommandHandler : IRequestHandler<GeneratePresignedDownloadUrlCommand, GeneratePresignedDownloadUrlResult>
{
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<GeneratePresignedDownloadUrlCommandHandler> _logger;

    public GeneratePresignedDownloadUrlCommandHandler(
        IObjectStorage objectStorage,
        ILogger<GeneratePresignedDownloadUrlCommandHandler> logger)
    {
        _objectStorage = objectStorage;
        _logger = logger;
    }

    public async Task<GeneratePresignedDownloadUrlResult> Handle(GeneratePresignedDownloadUrlCommand request, CancellationToken cancellationToken)
    {
        var expiry = TimeSpan.FromHours(1);
        var url = await _objectStorage.GeneratePresignedDownloadUrlAsync(
            request.BucketName,
            request.StorageKey,
            expiry,
            cancellationToken);

        return new GeneratePresignedDownloadUrlResult(
            url,
            DateTime.UtcNow.Add(expiry));
    }
}

public class GeneratePresignedUploadUrlCommandHandler : IRequestHandler<GeneratePresignedUploadUrlCommand, GeneratePresignedUploadUrlResult>
{
    private readonly IObjectStorage _objectStorage;
    private readonly ILogger<GeneratePresignedUploadUrlCommandHandler> _logger;

    public GeneratePresignedUploadUrlCommandHandler(
        IObjectStorage objectStorage,
        ILogger<GeneratePresignedUploadUrlCommandHandler> logger)
    {
        _objectStorage = objectStorage;
        _logger = logger;
    }

    public async Task<GeneratePresignedUploadUrlResult> Handle(GeneratePresignedUploadUrlCommand request, CancellationToken cancellationToken)
    {
        var url = await _objectStorage.GeneratePresignedUploadUrlAsync(
            request.BucketName,
            request.ObjectKey,
            request.Expiry,
            cancellationToken);

        return new GeneratePresignedUploadUrlResult(
            url,
            DateTime.UtcNow.Add(request.Expiry));
    }
}

public class VerifyDocumentCommandHandler : IRequestHandler<VerifyDocumentCommand, bool>
{
    private readonly IDocumentRepository _repository;
    private readonly ILogger<VerifyDocumentCommandHandler> _logger;

    public VerifyDocumentCommandHandler(
        IDocumentRepository repository,
        ILogger<VerifyDocumentCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> Handle(VerifyDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _repository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document == null)
            return false;

        document.Verify(request.VerifiedBy);
        await _repository.UpdateAsync(document, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

public class RejectDocumentCommandHandler : IRequestHandler<RejectDocumentCommand, bool>
{
    private readonly IDocumentRepository _repository;
    private readonly ILogger<RejectDocumentCommandHandler> _logger;

    public RejectDocumentCommandHandler(
        IDocumentRepository repository,
        ILogger<RejectDocumentCommandHandler> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<bool> Handle(RejectDocumentCommand request, CancellationToken cancellationToken)
    {
        var document = await _repository.GetByIdAsync(request.DocumentId, cancellationToken);
        if (document == null)
            return false;

        document.Reject(request.Reason, request.RejectedBy);
        await _repository.UpdateAsync(document, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);

        return true;
    }
}

