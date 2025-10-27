# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY src/EntityConfigurationService.sln ./
COPY src/Domain/EntityConfigurationService.Domain.csproj Domain/
COPY src/Application/EntityConfigurationService.Application.csproj Application/
COPY src/Infrastructure/EntityConfigurationService.Infrastructure.csproj Infrastructure/
COPY src/Presentation/EntityConfigurationService.Presentation.csproj Presentation/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY src/ ./

# Build and publish
WORKDIR /src/Presentation
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
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

# Set environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/health/live || exit 1

# Start application
ENTRYPOINT ["dotnet", "EntityConfigurationService.Presentation.dll"]

