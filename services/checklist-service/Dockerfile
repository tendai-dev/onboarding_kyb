# Multi-stage Dockerfile for .NET 8 Checklist Service

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/Domain/ChecklistService.Domain.csproj", "Domain/"]
COPY ["src/Application/ChecklistService.Application.csproj", "Application/"]
COPY ["src/Infrastructure/ChecklistService.Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Presentation/ChecklistService.Presentation.csproj", "Presentation/"]

# Restore dependencies
RUN dotnet restore "Presentation/ChecklistService.Presentation.csproj"

# Copy source code
COPY src/ .

# Build and publish
WORKDIR "/src/Presentation"
RUN dotnet build "ChecklistService.Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "ChecklistService.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

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
  CMD curl -f http://localhost:80/health/live || exit 1

ENTRYPOINT ["dotnet", "ChecklistService.Presentation.dll"]
