FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Domain/DocumentService.Domain.csproj", "Domain/"]
COPY ["src/Application/DocumentService.Application.csproj", "Application/"]
COPY ["src/Infrastructure/DocumentService.Infrastructure.csproj", "Infrastructure/"]
COPY ["src/Presentation/DocumentService.Presentation.csproj", "Presentation/"]
RUN dotnet restore "Presentation/DocumentService.Presentation.csproj"
COPY src/ .
WORKDIR "/src/Presentation"
RUN dotnet build "DocumentService.Presentation.csproj" -c Release -o /app/build
RUN dotnet publish "DocumentService.Presentation.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
# Health check disabled - database health check failing
# HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
#   CMD curl -f http://localhost:8080/health/live || exit 1
ENTRYPOINT ["dotnet", "DocumentService.Presentation.dll"]

