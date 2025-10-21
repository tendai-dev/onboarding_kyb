# Multi-stage Dockerfile for .NET 8 Onboarding API

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ["src/Domain/OnboardingApi.Domain.csproj", "Domain/"]
COPY ["src/Application/OnboardingApi.Application.csproj", "Application/"]
COPY ["src/Infrastructure/OnboardingApi.Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Presentation/OnboardingApi.Presentation.csproj", "Presentation/"]

# Restore dependencies
RUN dotnet restore "Presentation/OnboardingApi.Presentation.csproj"

# Copy source code
COPY src/ .

# Build and publish
WORKDIR "/src/Presentation"
RUN dotnet build "OnboardingApi.Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "OnboardingApi.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

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

ENTRYPOINT ["dotnet", "OnboardingApi.Presentation.dll"]

