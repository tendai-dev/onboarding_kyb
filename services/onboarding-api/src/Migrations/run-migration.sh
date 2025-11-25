#!/bin/bash

# Run database migrations and seed data
cd "$(dirname "$0")"

echo "🚀 Starting database migrations and seeding..."
echo ""

# Set connection string if not already set
export ConnectionStrings__PostgreSQL="${ConnectionStrings__PostgreSQL:-Host=localhost;Database=kyb_case;Username=kyb;Password=kyb_password}"

echo "Connection: ${ConnectionStrings__PostgreSQL//Password=*/Password=***}"
echo ""

# Run the migration service
dotnet run

echo ""
echo "✅ Migration and seeding complete!"

