using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Onboarding
{
    /// <inheritdoc />
    public partial class InitialCreate_Onboarding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "onboarding");

            migrationBuilder.CreateTable(
                name: "Applications",
                schema: "onboarding",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: false),
                    ApplicantName = table.Column<string>(type: "text", nullable: false),
                    IdentificationNumber = table.Column<string>(type: "text", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    BankAccountNumber = table.Column<string>(type: "text", nullable: false),
                    TaxNumber = table.Column<string>(type: "text", nullable: false),
                    IsAnonymized = table.Column<bool>(type: "boolean", nullable: false),
                    AnonymizedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AnonymizationReason = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Applications", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "onboarding_cases",
                schema: "onboarding",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    partner_id = table.Column<Guid>(type: "uuid", nullable: false),
                    partner_reference_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_first_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_last_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_middle_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    applicant_date_of_birth = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    applicant_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    applicant_phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    applicant_address_street = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    applicant_address_street2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    applicant_address_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_address_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    applicant_address_postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    applicant_address_country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    applicant_nationality = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    applicant_tax_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    applicant_passport_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    applicant_drivers_license = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    business_legal_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_trade_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_registration_number = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_registration_country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    business_incorporation_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    business_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_industry = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_registered_address_street = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_registered_address_street2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_registered_address_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_registered_address_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_registered_address_postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    business_registered_address_country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    business_operating_address_street = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_operating_address_street2 = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_operating_address_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_operating_address_state = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    business_operating_address_postal_code = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    business_operating_address_country = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    business_tax_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    business_vat_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    business_website = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    business_number_of_employees = table.Column<int>(type: "integer", nullable: true),
                    business_estimated_annual_revenue = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: true),
                    document_requests = table.Column<string>(type: "jsonb", nullable: false),
                    checklist_items = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_onboarding_cases", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "outbox_events",
                schema: "onboarding",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    aggregate_id = table.Column<Guid>(type: "uuid", nullable: false),
                    aggregate_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    event_type = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    payload = table.Column<string>(type: "jsonb", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    processed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_outbox_events", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_cases_case_number",
                schema: "onboarding",
                table: "onboarding_cases",
                column: "case_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_onboarding_cases_partner_id",
                schema: "onboarding",
                table: "onboarding_cases",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "idx_outbox_processed",
                schema: "onboarding",
                table: "outbox_events",
                columns: new[] { "processed_at", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_outbox_events_aggregate_id",
                schema: "onboarding",
                table: "outbox_events",
                column: "aggregate_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Applications",
                schema: "onboarding");

            migrationBuilder.DropTable(
                name: "onboarding_cases",
                schema: "onboarding");

            migrationBuilder.DropTable(
                name: "outbox_events",
                schema: "onboarding");
        }
    }
}
