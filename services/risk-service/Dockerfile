# Multi-stage Dockerfile for .NET 8 Risk Service

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/Domain/RiskService.Domain.csproj", "Domain/"]
COPY ["src/Application/RiskService.Application.csproj", "Application/"]
COPY ["src/Infrastructure/RiskService.Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Presentation/RiskService.Presentation.csproj", "Presentation/"]

# Restore dependencies
RUN dotnet restore "Presentation/RiskService.Presentation.csproj"

# Copy source code
COPY src/ .

# Build and publish
WORKDIR "/src/Presentation"
RUN dotnet build "RiskService.Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "RiskService.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published app
COPY --from=build /app/publish .

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "RiskService.Presentation.dll"]
