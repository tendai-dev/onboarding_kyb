using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.EntityConfiguration
{
    /// <inheritdoc />
    public partial class InitialCreate_EntityConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "entity_configuration");

            migrationBuilder.CreateTable(
                name: "entity_types",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    icon = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entity_types", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "entity_type_requirements",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requirement_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_entity_type_requirements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_entity_type_requirements_entity_types_entity_type_id",
                        column: x => x.entity_type_id,
                        principalSchema: "entity_configuration",
                        principalTable: "entity_types",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_entity_type_requirements_entity_type_id",
                schema: "entity_configuration",
                table: "entity_type_requirements",
                column: "entity_type_id");

            migrationBuilder.CreateIndex(
                name: "IX_entity_types_code",
                schema: "entity_configuration",
                table: "entity_types",
                column: "code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "entity_type_requirements",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "entity_types",
                schema: "entity_configuration");
        }
    }
}
