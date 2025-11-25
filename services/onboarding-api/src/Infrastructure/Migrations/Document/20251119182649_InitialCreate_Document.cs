using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Document
{
    /// <inheritdoc />
    public partial class InitialCreate_Document : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "document");

            migrationBuilder.CreateTable(
                name: "documents",
                schema: "document",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    DocumentNumber = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CaseId = table.Column<Guid>(type: "uuid", nullable: false),
                    PartnerId = table.Column<Guid>(type: "uuid", nullable: false),
                    document_type = table.Column<int>(type: "integer", nullable: false),
                    document_status = table.Column<int>(type: "integer", nullable: false),
                    StorageKey = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    BucketName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    SizeBytes = table.Column<long>(type: "bigint", nullable: false),
                    Metadata_Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Metadata_Tags = table.Column<string>(type: "jsonb", nullable: false),
                    Metadata_IssueDate = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Metadata_ExpiryDate = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Metadata_IssuingAuthority = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Metadata_DocumentNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Metadata_Country = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    IsVirusScanned = table.Column<bool>(type: "boolean", nullable: false),
                    IsVirusClean = table.Column<bool>(type: "boolean", nullable: false),
                    VirusScannedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerifiedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    RejectionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UploadedBy = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_documents", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_documents_CaseId",
                schema: "document",
                table: "documents",
                column: "CaseId");

            migrationBuilder.CreateIndex(
                name: "IX_documents_DocumentNumber",
                schema: "document",
                table: "documents",
                column: "DocumentNumber");

            migrationBuilder.CreateIndex(
                name: "IX_documents_PartnerId",
                schema: "document",
                table: "documents",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_documents_StorageKey",
                schema: "document",
                table: "documents",
                column: "StorageKey");

            migrationBuilder.CreateIndex(
                name: "IX_documents_UploadedAt",
                schema: "document",
                table: "documents",
                column: "UploadedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "documents",
                schema: "document");
        }
    }
}
