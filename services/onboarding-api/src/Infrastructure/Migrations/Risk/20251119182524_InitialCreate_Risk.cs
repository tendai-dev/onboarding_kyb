using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Risk
{
    /// <inheritdoc />
    public partial class InitialCreate_Risk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "risk");

            migrationBuilder.CreateTable(
                name: "risk_assessments",
                schema: "risk",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    partner_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    overall_risk_level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    risk_score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    assessed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_risk_assessments", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "risk_factors",
                schema: "risk",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    level = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    score = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    source = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RiskAssessmentId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_risk_factors", x => x.id);
                    table.ForeignKey(
                        name: "FK_risk_factors_risk_assessments_RiskAssessmentId",
                        column: x => x.RiskAssessmentId,
                        principalSchema: "risk",
                        principalTable: "risk_assessments",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_risk_assessments_case_id",
                schema: "risk",
                table: "risk_assessments",
                column: "case_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_risk_assessments_overall_risk_level",
                schema: "risk",
                table: "risk_assessments",
                column: "overall_risk_level");

            migrationBuilder.CreateIndex(
                name: "IX_risk_assessments_partner_id",
                schema: "risk",
                table: "risk_assessments",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_risk_assessments_status",
                schema: "risk",
                table: "risk_assessments",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_risk_factors_RiskAssessmentId",
                schema: "risk",
                table: "risk_factors",
                column: "RiskAssessmentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "risk_factors",
                schema: "risk");

            migrationBuilder.DropTable(
                name: "risk_assessments",
                schema: "risk");
        }
    }
}
