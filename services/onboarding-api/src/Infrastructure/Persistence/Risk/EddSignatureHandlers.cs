using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using OnboardingApi.Application.Risk.Queries;
using System.Data;

namespace OnboardingApi.Infrastructure.Persistence.Risk;

public class GetEddSignaturesQueryHandler : IRequestHandler<GetEddSignaturesQuery, List<EddSignatureDto>>
{
    private readonly RiskDbContext _context;
    private readonly ILogger<GetEddSignaturesQueryHandler> _logger;

    public GetEddSignaturesQueryHandler(RiskDbContext context, ILogger<GetEddSignaturesQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<EddSignatureDto>> Handle(GetEddSignaturesQuery request, CancellationToken cancellationToken)
    {
        var signatures = new List<EddSignatureDto>();
        var connection = _context.Database.GetDbConnection();
        
        await connection.OpenAsync(cancellationToken);
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT id, risk_assessment_id, signer_role, signer_name, signer_email,
                       signnow_document_id, signnow_invite_id, status, recommendation, rationale,
                       sent_at, signed_at, created_at, updated_at
                FROM risk.edd_signatures
                WHERE risk_assessment_id = @assessmentId
                ORDER BY created_at ASC";
            
            var param = command.CreateParameter();
            param.ParameterName = "@assessmentId";
            param.Value = request.AssessmentId;
            command.Parameters.Add(param);

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                signatures.Add(new EddSignatureDto
                {
                    Id = reader.GetGuid(0),
                    RiskAssessmentId = reader.GetGuid(1),
                    SignerRole = reader.GetString(2),
                    SignerName = reader.IsDBNull(3) ? null : reader.GetString(3),
                    SignerEmail = reader.GetString(4),
                    SignnowDocumentId = reader.IsDBNull(5) ? null : reader.GetString(5),
                    SignnowInviteId = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Status = reader.GetString(7),
                    Recommendation = reader.IsDBNull(8) ? null : reader.GetString(8),
                    Rationale = reader.IsDBNull(9) ? null : reader.GetString(9),
                    SentAt = reader.IsDBNull(10) ? null : reader.GetDateTime(10),
                    SignedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11),
                    CreatedAt = reader.GetDateTime(12),
                    UpdatedAt = reader.GetDateTime(13)
                });
            }
        }
        finally
        {
            await connection.CloseAsync();
        }

        return signatures;
    }
}

public class UpsertEddSignatureCommandHandler : IRequestHandler<UpsertEddSignatureCommand, EddSignatureDto>
{
    private readonly RiskDbContext _context;
    private readonly ILogger<UpsertEddSignatureCommandHandler> _logger;

    public UpsertEddSignatureCommandHandler(RiskDbContext context, ILogger<UpsertEddSignatureCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<EddSignatureDto> Handle(UpsertEddSignatureCommand request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var connection = _context.Database.GetDbConnection();
        
        await connection.OpenAsync(cancellationToken);
        try
        {
            using var command = connection.CreateCommand();
            command.CommandText = @"
                INSERT INTO risk.edd_signatures (
                    id, risk_assessment_id, signer_role, signer_name, signer_email,
                    signnow_document_id, signnow_invite_id, status, recommendation, rationale,
                    sent_at, signed_at, created_at, updated_at
                ) VALUES (
                    gen_random_uuid(), @assessmentId, @signerRole, @signerName, @signerEmail,
                    @signnowDocumentId, @signnowInviteId, @status, @recommendation, @rationale,
                    CASE WHEN @status = 'sent' THEN @now ELSE NULL END,
                    CASE WHEN @status = 'signed' THEN @now ELSE NULL END,
                    @now, @now
                )
                ON CONFLICT (risk_assessment_id, signer_role) DO UPDATE SET
                    signer_name = COALESCE(EXCLUDED.signer_name, risk.edd_signatures.signer_name),
                    signer_email = EXCLUDED.signer_email,
                    signnow_document_id = COALESCE(EXCLUDED.signnow_document_id, risk.edd_signatures.signnow_document_id),
                    signnow_invite_id = COALESCE(EXCLUDED.signnow_invite_id, risk.edd_signatures.signnow_invite_id),
                    status = EXCLUDED.status,
                    recommendation = COALESCE(EXCLUDED.recommendation, risk.edd_signatures.recommendation),
                    rationale = COALESCE(EXCLUDED.rationale, risk.edd_signatures.rationale),
                    sent_at = CASE WHEN EXCLUDED.status = 'sent' AND risk.edd_signatures.sent_at IS NULL THEN @now ELSE risk.edd_signatures.sent_at END,
                    signed_at = CASE WHEN EXCLUDED.status = 'signed' AND risk.edd_signatures.signed_at IS NULL THEN @now ELSE risk.edd_signatures.signed_at END,
                    updated_at = @now
                RETURNING id, risk_assessment_id, signer_role, signer_name, signer_email,
                          signnow_document_id, signnow_invite_id, status, recommendation, rationale,
                          sent_at, signed_at, created_at, updated_at";

            AddParameter(command, "@assessmentId", request.AssessmentId);
            AddParameter(command, "@signerRole", request.SignerRole);
            AddParameter(command, "@signerName", request.SignerName ?? (object)DBNull.Value);
            AddParameter(command, "@signerEmail", request.SignerEmail);
            AddParameter(command, "@signnowDocumentId", request.SignnowDocumentId ?? (object)DBNull.Value);
            AddParameter(command, "@signnowInviteId", request.SignnowInviteId ?? (object)DBNull.Value);
            AddParameter(command, "@status", request.Status);
            AddParameter(command, "@recommendation", request.Recommendation ?? (object)DBNull.Value);
            AddParameter(command, "@rationale", request.Rationale ?? (object)DBNull.Value);
            AddParameter(command, "@now", now);

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                var result = new EddSignatureDto
                {
                    Id = reader.GetGuid(0),
                    RiskAssessmentId = reader.GetGuid(1),
                    SignerRole = reader.GetString(2),
                    SignerName = reader.IsDBNull(3) ? null : reader.GetString(3),
                    SignerEmail = reader.GetString(4),
                    SignnowDocumentId = reader.IsDBNull(5) ? null : reader.GetString(5),
                    SignnowInviteId = reader.IsDBNull(6) ? null : reader.GetString(6),
                    Status = reader.GetString(7),
                    Recommendation = reader.IsDBNull(8) ? null : reader.GetString(8),
                    Rationale = reader.IsDBNull(9) ? null : reader.GetString(9),
                    SentAt = reader.IsDBNull(10) ? null : reader.GetDateTime(10),
                    SignedAt = reader.IsDBNull(11) ? null : reader.GetDateTime(11),
                    CreatedAt = reader.GetDateTime(12),
                    UpdatedAt = reader.GetDateTime(13)
                };

                _logger.LogInformation(
                    "Upserted EDD signature for assessment {AssessmentId}, role {SignerRole}, status {Status}",
                    request.AssessmentId, request.SignerRole, request.Status);

                return result;
            }

            throw new InvalidOperationException("Failed to upsert signature");
        }
        finally
        {
            await connection.CloseAsync();
        }
    }

    private static void AddParameter(System.Data.Common.DbCommand command, string name, object value)
    {
        var param = command.CreateParameter();
        param.ParameterName = name;
        param.Value = value;
        command.Parameters.Add(param);
    }
}
