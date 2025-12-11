using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Checklist
{
    /// <inheritdoc />
    public partial class InitialCreate_Checklist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "checklist");

            migrationBuilder.CreateTable(
                name: "checklists",
                schema: "checklist",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    case_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    partner_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checklists", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "checklist_items",
                schema: "checklist",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    order = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    skip_reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    checklist_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_checklist_items", x => x.id);
                    table.ForeignKey(
                        name: "FK_checklist_items_checklists_checklist_id",
                        column: x => x.checklist_id,
                        principalSchema: "checklist",
                        principalTable: "checklists",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_checklist_items_category",
                schema: "checklist",
                table: "checklist_items",
                column: "category");

            migrationBuilder.CreateIndex(
                name: "IX_checklist_items_checklist_id",
                schema: "checklist",
                table: "checklist_items",
                column: "checklist_id");

            migrationBuilder.CreateIndex(
                name: "IX_checklist_items_status",
                schema: "checklist",
                table: "checklist_items",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_checklists_case_id",
                schema: "checklist",
                table: "checklists",
                column: "case_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_checklists_partner_id",
                schema: "checklist",
                table: "checklists",
                column: "partner_id");

            migrationBuilder.CreateIndex(
                name: "IX_checklists_status",
                schema: "checklist",
                table: "checklists",
                column: "status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "checklist_items",
                schema: "checklist");

            migrationBuilder.DropTable(
                name: "checklists",
                schema: "checklist");
        }
    }
}
