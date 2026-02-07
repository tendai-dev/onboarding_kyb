using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OnboardingApi.Infrastructure.Migrations.Audit;

/// <summary>
/// Migration to add partitioning to audit_log_entries table for performance optimization.
/// Partitions by year to handle ~18M records/year growth.
/// Also adds optimized indexes for common query patterns.
/// </summary>
public partial class AddAuditLogPartitioning : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // Step 1: Create the partitioned table structure
        // Note: This requires careful execution - existing data must be migrated
        
        // First, rename the existing table
        migrationBuilder.Sql(@"
            -- Rename existing table to backup
            ALTER TABLE IF EXISTS audit.audit_log_entries 
            RENAME TO audit_log_entries_old;
        ");

        // Create new partitioned table
        migrationBuilder.Sql(@"
            -- Create partitioned table by timestamp (yearly partitions)
            CREATE TABLE audit.audit_log_entries (
                id UUID NOT NULL,
                event_type VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                entity_id VARCHAR(100) NOT NULL,
                case_id VARCHAR(100),
                partner_id VARCHAR(100),
                user_id VARCHAR(200) NOT NULL,
                user_role VARCHAR(100) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description VARCHAR(2000) NOT NULL,
                old_values JSONB,
                new_values JSONB,
                ip_address VARCHAR(45) NOT NULL,
                user_agent VARCHAR(1000) NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                correlation_id VARCHAR(100),
                severity VARCHAR(50) NOT NULL,
                compliance_category VARCHAR(50) NOT NULL,
                hash VARCHAR(500) NOT NULL,
                PRIMARY KEY (id, timestamp)
            ) PARTITION BY RANGE (timestamp);
        ");

        // Create partitions for current and future years
        migrationBuilder.Sql(@"
            -- Create partitions for 2024-2030
            CREATE TABLE audit.audit_log_entries_2024 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
            
            CREATE TABLE audit.audit_log_entries_2025 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
            
            CREATE TABLE audit.audit_log_entries_2026 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2026-01-01') TO ('2027-01-01');
            
            CREATE TABLE audit.audit_log_entries_2027 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2027-01-01') TO ('2028-01-01');
            
            CREATE TABLE audit.audit_log_entries_2028 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2028-01-01') TO ('2029-01-01');
            
            CREATE TABLE audit.audit_log_entries_2029 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2029-01-01') TO ('2030-01-01');
            
            CREATE TABLE audit.audit_log_entries_2030 PARTITION OF audit.audit_log_entries
                FOR VALUES FROM ('2030-01-01') TO ('2031-01-01');
            
            -- Default partition for any data outside defined ranges
            CREATE TABLE audit.audit_log_entries_default PARTITION OF audit.audit_log_entries
                DEFAULT;
        ");

        // Create indexes on the partitioned table (will be created on each partition)
        migrationBuilder.Sql(@"
            -- Single column indexes
            CREATE INDEX idx_audit_log_entity_type ON audit.audit_log_entries(entity_type);
            CREATE INDEX idx_audit_log_entity_id ON audit.audit_log_entries(entity_id);
            CREATE INDEX idx_audit_log_case_id ON audit.audit_log_entries(case_id) WHERE case_id IS NOT NULL;
            CREATE INDEX idx_audit_log_partner_id ON audit.audit_log_entries(partner_id) WHERE partner_id IS NOT NULL;
            CREATE INDEX idx_audit_log_user_id ON audit.audit_log_entries(user_id);
            CREATE INDEX idx_audit_log_action ON audit.audit_log_entries(action);
            CREATE INDEX idx_audit_log_timestamp ON audit.audit_log_entries(timestamp);
            CREATE INDEX idx_audit_log_compliance ON audit.audit_log_entries(compliance_category);
            CREATE INDEX idx_audit_log_severity ON audit.audit_log_entries(severity);
            CREATE INDEX idx_audit_log_correlation ON audit.audit_log_entries(correlation_id) WHERE correlation_id IS NOT NULL;
            
            -- Composite indexes for common query patterns
            CREATE INDEX idx_audit_log_entity_ts ON audit.audit_log_entries(entity_type, entity_id, timestamp DESC);
            CREATE INDEX idx_audit_log_case_ts ON audit.audit_log_entries(case_id, timestamp DESC) WHERE case_id IS NOT NULL;
            CREATE INDEX idx_audit_log_user_ts ON audit.audit_log_entries(user_id, timestamp DESC);
            CREATE INDEX idx_audit_log_compliance_ts ON audit.audit_log_entries(compliance_category, timestamp DESC);
        ");

        // Migrate existing data
        migrationBuilder.Sql(@"
            -- Migrate existing data to new partitioned table
            INSERT INTO audit.audit_log_entries 
            SELECT * FROM audit.audit_log_entries_old;
            
            -- Drop old table after successful migration
            DROP TABLE IF EXISTS audit.audit_log_entries_old;
        ");

        // Create function to auto-create future partitions
        migrationBuilder.Sql(@"
            -- Function to create partition for a given year
            CREATE OR REPLACE FUNCTION audit.create_audit_partition(year_val INTEGER)
            RETURNS VOID AS $$
            DECLARE
                partition_name TEXT;
                start_date DATE;
                end_date DATE;
            BEGIN
                partition_name := 'audit_log_entries_' || year_val;
                start_date := (year_val || '-01-01')::DATE;
                end_date := ((year_val + 1) || '-01-01')::DATE;
                
                -- Check if partition already exists
                IF NOT EXISTS (
                    SELECT 1 FROM pg_tables 
                    WHERE schemaname = 'audit' AND tablename = partition_name
                ) THEN
                    EXECUTE format(
                        'CREATE TABLE audit.%I PARTITION OF audit.audit_log_entries FOR VALUES FROM (%L) TO (%L)',
                        partition_name, start_date, end_date
                    );
                    RAISE NOTICE 'Created partition: %', partition_name;
                END IF;
            END;
            $$ LANGUAGE plpgsql;
        ");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Revert to non-partitioned table
        migrationBuilder.Sql(@"
            -- Create non-partitioned backup
            CREATE TABLE audit.audit_log_entries_backup AS 
            SELECT * FROM audit.audit_log_entries;
            
            -- Drop partitioned table and all partitions
            DROP TABLE IF EXISTS audit.audit_log_entries CASCADE;
            
            -- Recreate original table structure
            CREATE TABLE audit.audit_log_entries (
                id UUID PRIMARY KEY,
                event_type VARCHAR(100) NOT NULL,
                entity_type VARCHAR(100) NOT NULL,
                entity_id VARCHAR(100) NOT NULL,
                case_id VARCHAR(100),
                partner_id VARCHAR(100),
                user_id VARCHAR(200) NOT NULL,
                user_role VARCHAR(100) NOT NULL,
                action VARCHAR(50) NOT NULL,
                description VARCHAR(2000) NOT NULL,
                old_values JSONB,
                new_values JSONB,
                ip_address VARCHAR(45) NOT NULL,
                user_agent VARCHAR(1000) NOT NULL,
                timestamp TIMESTAMPTZ NOT NULL,
                correlation_id VARCHAR(100),
                severity VARCHAR(50) NOT NULL,
                compliance_category VARCHAR(50) NOT NULL,
                hash VARCHAR(500) NOT NULL
            );
            
            -- Restore data
            INSERT INTO audit.audit_log_entries SELECT * FROM audit.audit_log_entries_backup;
            DROP TABLE audit.audit_log_entries_backup;
            
            -- Drop helper function
            DROP FUNCTION IF EXISTS audit.create_audit_partition(INTEGER);
        ");
    }
}
