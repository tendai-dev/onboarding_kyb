using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.EntityConfiguration;

/// <inheritdoc />
public partial class AddRequirementsTable : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "requirements",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                field_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                validation_rules = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                help_text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_requirements", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_requirements_code",
            schema: "entity_configuration",
            table: "requirements",
            column: "code",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "requirements",
            schema: "entity_configuration");
    }
}

