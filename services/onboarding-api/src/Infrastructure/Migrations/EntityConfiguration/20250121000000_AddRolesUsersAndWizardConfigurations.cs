using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.EntityConfiguration;

/// <inheritdoc />
public partial class AddRolesUsersAndWizardConfigurations : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Create roles table
        migrationBuilder.CreateTable(
            name: "roles",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_roles", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_roles_name",
            schema: "entity_configuration",
            table: "roles",
            column: "name",
            unique: true);

        // Create role_permissions table
        migrationBuilder.CreateTable(
            name: "role_permissions",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                role_id = table.Column<Guid>(type: "uuid", nullable: false),
                permission_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                resource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_role_permissions", x => x.Id);
                table.ForeignKey(
                    name: "FK_role_permissions_roles_role_id",
                    column: x => x.role_id,
                    principalSchema: "entity_configuration",
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_role_permissions_role_id",
            schema: "entity_configuration",
            table: "role_permissions",
            column: "role_id");

        // Create users table
        migrationBuilder.CreateTable(
            name: "users",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                first_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                last_login_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.Id);
            });

        migrationBuilder.CreateIndex(
            name: "IX_users_email",
            schema: "entity_configuration",
            table: "users",
            column: "email",
            unique: true);

        // Create user_permissions table
        migrationBuilder.CreateTable(
            name: "user_permissions",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                permission_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                resource = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_permissions", x => x.Id);
                table.ForeignKey(
                    name: "FK_user_permissions_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "entity_configuration",
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_user_permissions_user_id",
            schema: "entity_configuration",
            table: "user_permissions",
            column: "user_id");

        // Create user_role_assignments table
        migrationBuilder.CreateTable(
            name: "user_role_assignments",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                role_id = table.Column<Guid>(type: "uuid", nullable: false),
                role_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                role_display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_role_assignments", x => x.Id);
                table.ForeignKey(
                    name: "FK_user_role_assignments_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "entity_configuration",
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_user_role_assignments_roles_role_id",
                    column: x => x.role_id,
                    principalSchema: "entity_configuration",
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_user_role_assignments_user_id",
            schema: "entity_configuration",
            table: "user_role_assignments",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "IX_user_role_assignments_role_id",
            schema: "entity_configuration",
            table: "user_role_assignments",
            column: "role_id");

        migrationBuilder.CreateIndex(
            name: "IX_user_role_assignments_user_id_role_id",
            schema: "entity_configuration",
            table: "user_role_assignments",
            columns: new[] { "user_id", "role_id" });

        // Create wizard_configurations table
        migrationBuilder.CreateTable(
            name: "wizard_configurations",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                entity_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_wizard_configurations", x => x.Id);
                table.ForeignKey(
                    name: "FK_wizard_configurations_entity_types_entity_type_id",
                    column: x => x.entity_type_id,
                    principalSchema: "entity_configuration",
                    principalTable: "entity_types",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_wizard_configurations_entity_type_id",
            schema: "entity_configuration",
            table: "wizard_configurations",
            column: "entity_type_id",
            unique: true);

        // Create wizard_steps table
        migrationBuilder.CreateTable(
            name: "wizard_steps",
            schema: "entity_configuration",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                wizard_configuration_id = table.Column<Guid>(type: "uuid", nullable: false),
                title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                subtitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                requirement_types = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                checklist_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                step_number = table.Column<int>(type: "integer", nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false),
                created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_wizard_steps", x => x.Id);
                table.ForeignKey(
                    name: "FK_wizard_steps_wizard_configurations_wizard_configuration_id",
                    column: x => x.wizard_configuration_id,
                    principalSchema: "entity_configuration",
                    principalTable: "wizard_configurations",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_wizard_steps_wizard_configuration_id",
            schema: "entity_configuration",
            table: "wizard_steps",
            column: "wizard_configuration_id");

        migrationBuilder.CreateIndex(
            name: "IX_wizard_steps_wizard_configuration_id_step_number",
            schema: "entity_configuration",
            table: "wizard_steps",
            columns: new[] { "wizard_configuration_id", "step_number" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "wizard_steps",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "user_role_assignments",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "user_permissions",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "role_permissions",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "wizard_configurations",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "users",
            schema: "entity_configuration");

        migrationBuilder.DropTable(
            name: "roles",
            schema: "entity_configuration");
    }
}

