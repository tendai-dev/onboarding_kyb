using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.EntityConfiguration
{
    /// <inheritdoc />
    public partial class AddCountryConfigurationTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "country_profiles",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    country_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    updated_by = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_profiles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "country_entity_type_overrides",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type_id = table.Column<Guid>(type: "uuid", nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    custom_display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    custom_description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    display_order = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_entity_type_overrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_country_entity_type_overrides_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "country_terminology_overrides",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    target_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    override_display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    override_description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    override_help_text = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    override_placeholder = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_terminology_overrides", x => x.Id);
                    table.ForeignKey(
                        name: "FK_country_terminology_overrides_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "country_form_bundles",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    entity_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    bundle_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    field_configuration_json = table.Column<string>(type: "jsonb", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_form_bundles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_country_form_bundles_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "country_field_visibility_rules",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    target_field_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    entity_type_id = table.Column<Guid>(type: "uuid", nullable: true),
                    rule_expression = table.Column<string>(type: "jsonb", nullable: false),
                    is_visible = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_field_visibility_rules", x => x.Id);
                    table.ForeignKey(
                        name: "FK_country_field_visibility_rules_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "country_compliance_toggles",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    compliance_code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    compliance_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    configuration_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_country_compliance_toggles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_country_compliance_toggles_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "configuration_tags",
                schema: "entity_configuration",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    country_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    tag_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    tag_value = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_configuration_tags", x => x.Id);
                    table.ForeignKey(
                        name: "FK_configuration_tags_country_profiles_country_profile_id",
                        column: x => x.country_profile_id,
                        principalSchema: "entity_configuration",
                        principalTable: "country_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_country_profiles_country_code",
                schema: "entity_configuration",
                table: "country_profiles",
                column: "country_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_country_entity_type_overrides_country_profile_id",
                schema: "entity_configuration",
                table: "country_entity_type_overrides",
                column: "country_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_country_terminology_overrides_country_profile_id",
                schema: "entity_configuration",
                table: "country_terminology_overrides",
                column: "country_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_country_form_bundles_country_profile_id",
                schema: "entity_configuration",
                table: "country_form_bundles",
                column: "country_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_country_field_visibility_rules_country_profile_id",
                schema: "entity_configuration",
                table: "country_field_visibility_rules",
                column: "country_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_country_compliance_toggles_country_profile_id",
                schema: "entity_configuration",
                table: "country_compliance_toggles",
                column: "country_profile_id");

            migrationBuilder.CreateIndex(
                name: "IX_configuration_tags_country_profile_id",
                schema: "entity_configuration",
                table: "configuration_tags",
                column: "country_profile_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "configuration_tags",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_compliance_toggles",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_field_visibility_rules",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_form_bundles",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_terminology_overrides",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_entity_type_overrides",
                schema: "entity_configuration");

            migrationBuilder.DropTable(
                name: "country_profiles",
                schema: "entity_configuration");
        }
    }
}

