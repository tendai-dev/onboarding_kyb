# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["src/Presentation/*.csproj", "Presentation/"]
COPY ["src/Application/*.csproj", "Application/"]
COPY ["src/Infrastructure/*.csproj", "Infrastructure/"]
COPY ["src/Domain/*.csproj", "Domain/"]

RUN dotnet restore "Presentation/*.csproj"

# Copy remaining source code
COPY src/ .

# Build the application
WORKDIR /src/Presentation
RUN dotnet build -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser
USER appuser

COPY --from=publish /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080
ENTRYPOINT ["dotnet", "WorkQueueService.Presentation.dll"]

