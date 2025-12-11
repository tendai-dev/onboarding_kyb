using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.WorkQueue
{
    /// <inheritdoc />
    public partial class InitialCreate_WorkQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "work_queue");

            migrationBuilder.CreateTable(
                name: "work_items",
                schema: "work_queue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_item_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    application_id = table.Column<Guid>(type: "uuid", nullable: false),
                    applicant_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    country = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    priority = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    risk_level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    assigned_to = table.Column<Guid>(type: "uuid", nullable: true),
                    assigned_to_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    assigned_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    requires_approval = table.Column<bool>(type: "boolean", nullable: false),
                    approved_by = table.Column<Guid>(type: "uuid", nullable: true),
                    approved_by_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approval_notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    rejection_reason = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    rejected_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_refresh_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_refreshed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    refresh_count = table.Column<int>(type: "integer", nullable: false),
                    due_date = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "work_item_comments",
                schema: "work_queue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    text = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    author_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    author_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_item_comments", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_item_comments_work_items_work_item_id",
                        column: x => x.work_item_id,
                        principalSchema: "work_queue",
                        principalTable: "work_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "work_item_history",
                schema: "work_queue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    performed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    performed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_item_history", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_item_history_work_items_work_item_id",
                        column: x => x.work_item_id,
                        principalSchema: "work_queue",
                        principalTable: "work_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_work_item_comments_work_item_id",
                schema: "work_queue",
                table: "work_item_comments",
                column: "work_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_item_history_work_item_id",
                schema: "work_queue",
                table: "work_item_history",
                column: "work_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_application_id",
                schema: "work_queue",
                table: "work_items",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_work_items_assigned_to",
                schema: "work_queue",
                table: "work_items",
                column: "assigned_to");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_country",
                schema: "work_queue",
                table: "work_items",
                column: "country");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_created_at",
                schema: "work_queue",
                table: "work_items",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_due_date",
                schema: "work_queue",
                table: "work_items",
                column: "due_date");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_risk_level",
                schema: "work_queue",
                table: "work_items",
                column: "risk_level");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_status",
                schema: "work_queue",
                table: "work_items",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_work_items_status_assigned_to",
                schema: "work_queue",
                table: "work_items",
                columns: new[] { "status", "assigned_to" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "work_item_comments",
                schema: "work_queue");

            migrationBuilder.DropTable(
                name: "work_item_history",
                schema: "work_queue");

            migrationBuilder.DropTable(
                name: "work_items",
                schema: "work_queue");
        }
    }
}
