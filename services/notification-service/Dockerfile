# Multi-stage Dockerfile for .NET 8 Notification Service

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/Domain/NotificationService.Domain.csproj", "Domain/"]
COPY ["src/Application/NotificationService.Application.csproj", "Application/"]
COPY ["src/Infrastructure/NotificationService.Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Presentation/NotificationService.Presentation.csproj", "Presentation/"]

# Restore dependencies
RUN dotnet restore "Presentation/NotificationService.Presentation.csproj"

# Copy source code
COPY src/ .

# Build and publish
WORKDIR "/src/Presentation"
RUN dotnet build "NotificationService.Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "NotificationService.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

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

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1

ENTRYPOINT ["dotnet", "NotificationService.Presentation.dll"]
