# Database Migration and Seeding Instructions

## ✅ What Has Been Created

1. **Requirement Domain Entity** - Complete with all properties
2. **Requirements Database Table** - Migration file ready
3. **RequirementsController** - API endpoint at `/api/v1/requirements`
4. **RequirementRepository** - Full CRUD operations
5. **Seed Script** - Creates 32 requirements and 8 entity types with all relationships

## 🚀 How to Run the Migration

### Step 1: Navigate to Migrations Directory
```bash
cd services/onboarding-api/src/Migrations
```

### Step 2: Run the Migration Service
```bash
dotnet run
```

This will:
- ✅ Apply all pending migrations (including the new Requirements table)
- ✅ Automatically seed 8 Entity Types
- ✅ Automatically seed 32 Requirements
- ✅ Link all requirements to their respective entity types

### Step 3: Verify the Data

After migration completes, you can verify:

```sql
-- Check entity types
SELECT COUNT(*) FROM entity_configuration.entity_types;
-- Should return 8

-- Check requirements
SELECT COUNT(*) FROM entity_configuration.requirements;
-- Should return 32

-- Check entity type requirements (links)
SELECT COUNT(*) FROM entity_configuration.entity_type_requirements;
-- Should return many rows (all the relationships)
```

## 📋 What Gets Seeded

### Entity Types (8):
1. Private Company / Limited Liability Company
2. Publicly Listed Entity
3. Government / State-Owned Entity
4. Non-Profit Organisation / NGO / PVO
5. Non-Registered Association / Society / Charity / Foundation
6. Trust
7. Supranational / Inter-Governmental / Sovereign
8. Sole Proprietor

### Requirements (32):
- 14 Information requirements (text, date fields)
- 18 Documentation requirements (file uploads)

All requirements are properly linked to their entity types with correct required/optional flags and display order.

## 🔗 Connection String

The migration uses the connection string from `appsettings.json`:
- Host: `localhost`
- Database: `kyb_case`
- Username: `kyb`
- Password: `kyb_password`

To override, set environment variable:
```bash
ConnectionStrings__PostgreSQL="Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password" dotnet run
```

## ✅ After Migration

Once the migration completes:
1. The Requirements page in the admin portal will show all 32 requirements
2. The `/api/v1/requirements` endpoint will return real data
3. All entity types will have their requirements properly linked

