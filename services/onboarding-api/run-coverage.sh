#!/bin/bash
# Script to run backend coverage tests
# This script attempts multiple methods to run tests with coverage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔍 Backend Coverage Test Runner"
echo "================================"
echo ""

# Method 1: Try with local .NET 8.0 (if available)
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version 2>/dev/null | cut -d. -f1)
    if [ "$DOTNET_VERSION" = "8" ]; then
        echo "✅ Found .NET 8.0 SDK locally"
        echo "Attempting to run tests with local .NET..."
        export PATH="/opt/homebrew/opt/dotnet@8/bin:$PATH"
        export DOTNET_ROOT="/opt/homebrew/opt/dotnet@8/libexec"
        if dotnet test tests/Unit/ --collect:"XPlat Code Coverage" --settings tests/coverlet.runsettings --logger "console;verbosity=normal" 2>&1; then
            echo "✅ Tests completed successfully!"
            exit 0
        else
            echo "⚠️  Local .NET 8.0 failed, trying Docker..."
        fi
    fi
fi

# Method 2: Try with Docker
if command -v docker &> /dev/null; then
    echo "🐳 Attempting to run tests with Docker (.NET 8.0 SDK)..."
    if docker run --rm \
        -v "$(pwd):/workspace" \
        -w /workspace \
        mcr.microsoft.com/dotnet/sdk:8.0 \
        dotnet test tests/Unit/ \
        --collect:"XPlat Code Coverage" \
        --settings tests/coverlet.runsettings \
        --logger "console;verbosity=normal" 2>&1; then
        echo "✅ Tests completed successfully in Docker!"
        exit 0
    else
        echo "⚠️  Docker method also failed"
    fi
fi

echo ""
echo "❌ All methods failed. This is likely due to Castle.Core dependency issue."
echo ""
echo "📋 Next Steps:"
echo "1. Check BACKEND_COVERAGE_STATUS.md for detailed issue description"
echo "2. Consider switching to NSubstitute instead of Moq"
echo "3. Or wait for Castle.Core to release net8.0 compatible version"
echo ""
exit 1

