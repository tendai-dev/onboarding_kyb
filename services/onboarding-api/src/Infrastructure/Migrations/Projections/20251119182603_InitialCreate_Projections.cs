using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Projections
{
    /// <inheritdoc />
    public partial class InitialCreate_Projections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "projections");

            migrationBuilder.CreateTable(
                name: "onboarding_case_projections",
                schema: "projections",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    partner_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    partner_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    partner_reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    applicant_phone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    applicant_date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    applicant_nationality = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    applicant_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    applicant_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_country = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    progress_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    total_steps = table.Column<int>(type: "integer", nullable: false),
                    completed_steps = table.Column<int>(type: "integer", nullable: false),
                    checklist_id = table.Column<Guid>(type: "uuid", nullable: true),
                    checklist_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    checklist_completion_percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    checklist_total_items = table.Column<int>(type: "integer", nullable: false),
                    checklist_completed_items = table.Column<int>(type: "integer", nullable: false),
                    checklist_required_items = table.Column<int>(type: "integer", nullable: false),
                    checklist_completed_required_items = table.Column<int>(type: "integer", nullable: false),
                    risk_assessment_id = table.Column<Guid>(type: "uuid", nullable: true),
                    risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    risk_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    risk_status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    risk_factor_count = table.Column<int>(type: "integer", nullable: false),
                    document_count = table.Column<int>(type: "integer", nullable: false),
                    verified_document_count = table.Column<int>(type: "integer", nullable: false),
                    pending_document_count = table.Column<int>(type: "integer", nullable: false),
                    rejected_document_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    submitted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    rejected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    assigned_to = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    assigned_to_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    requires_manual_review = table.Column<bool>(type: "boolean", nullable: false),
                    has_compliance_issues = table.Column<bool>(type: "boolean", nullable: false),
                    compliance_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: false),
                    business_legal_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    business_registration_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    business_tax_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    business_country_of_registration = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    business_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    business_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    business_industry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    business_number_of_employees = table.Column<int>(type: "integer", nullable: true),
                    business_annual_revenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    business_website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_onboarding_case_projections", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_assigned_to",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_assigned_to_status_created_at",
                schema: "projections",
                table: "onboarding_case_projections",
                columns: new[] { "assigned_to", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_case_id",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "case_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_created_at",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_has_compliance_issues",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "has_compliance_issues");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_partner_id",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_partner_id_status_created_at",
                schema: "projections",
                table: "onboarding_case_projections",
                columns: new[] { "partner_id", "status", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_requires_manual_review",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "requires_manual_review");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_risk_level",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "risk_level");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_status",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_status_risk_level_created_at",
                schema: "projections",
                table: "onboarding_case_projections",
                columns: new[] { "status", "risk_level", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_case_projections_updated_at",
                schema: "projections",
                table: "onboarding_case_projections",
                column: "updated_at");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "onboarding_case_projections",
                schema: "projections");
        }
    }
}
