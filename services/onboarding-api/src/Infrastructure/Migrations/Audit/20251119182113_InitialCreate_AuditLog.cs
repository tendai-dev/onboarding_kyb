using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Audit
{
    /// <inheritdoc />
    public partial class InitialCreate_AuditLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "audit");

            migrationBuilder.CreateTable(
                name: "audit_log_entries",
                schema: "audit",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    case_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    partner_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    user_role = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    action = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    old_values = table.Column<string>(type: "jsonb", nullable: true),
                    new_values = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(45)", maxLength: 45, nullable: false),
                    user_agent = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    correlation_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    severity = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    compliance_category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_log_entries", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_action",
                schema: "audit",
                table: "audit_log_entries",
                column: "action");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_case_id",
                schema: "audit",
                table: "audit_log_entries",
                column: "case_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_case_id_timestamp",
                schema: "audit",
                table: "audit_log_entries",
                columns: new[] { "case_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_compliance_category",
                schema: "audit",
                table: "audit_log_entries",
                column: "compliance_category");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_compliance_category_timestamp",
                schema: "audit",
                table: "audit_log_entries",
                columns: new[] { "compliance_category", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_correlation_id",
                schema: "audit",
                table: "audit_log_entries",
                column: "correlation_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_entity_id",
                schema: "audit",
                table: "audit_log_entries",
                column: "entity_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_entity_type",
                schema: "audit",
                table: "audit_log_entries",
                column: "entity_type");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_entity_type_entity_id_timestamp",
                schema: "audit",
                table: "audit_log_entries",
                columns: new[] { "entity_type", "entity_id", "timestamp" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_partner_id",
                schema: "audit",
                table: "audit_log_entries",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_severity",
                schema: "audit",
                table: "audit_log_entries",
                column: "severity");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_timestamp",
                schema: "audit",
                table: "audit_log_entries",
                column: "timestamp");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_user_id",
                schema: "audit",
                table: "audit_log_entries",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_log_entries_user_id_timestamp",
                schema: "audit",
                table: "audit_log_entries",
                columns: new[] { "user_id", "timestamp" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_log_entries",
                schema: "audit");
        }
    }
}
