using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.WorkQueue
{
    /// <inheritdoc />
    public partial class AddWorkItemStepReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "work_item_step_reviews",
                schema: "work_queue",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    work_item_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    completed = table.Column<bool>(type: "boolean", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    verified = table.Column<bool>(type: "boolean", nullable: false),
                    verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    verified_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    approved = table.Column<bool>(type: "boolean", nullable: false),
                    approved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_work_item_step_reviews", x => x.id);
                    table.ForeignKey(
                        name: "FK_work_item_step_reviews_work_items_work_item_id",
                        column: x => x.work_item_id,
                        principalSchema: "work_queue",
                        principalTable: "work_items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_work_item_step_reviews_work_item_id",
                schema: "work_queue",
                table: "work_item_step_reviews",
                column: "work_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_work_item_step_reviews_work_item_id_step_id",
                schema: "work_queue",
                table: "work_item_step_reviews",
                columns: new[] { "work_item_id", "step_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "work_item_step_reviews",
                schema: "work_queue");
        }
    }
}

