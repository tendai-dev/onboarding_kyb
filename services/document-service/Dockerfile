FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/Domain/DocumentService.Domain.csproj", "Domain/"]
COPY ["src/Application/DocumentService.Application.csproj", "Application/"]
RUN dotnet restore "Application/DocumentService.Application.csproj"
COPY src/ .
WORKDIR "/src/Application"
RUN dotnet build "DocumentService.Application.csproj" -c Release -o /app/build
RUN dotnet publish "DocumentService.Application.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/health/live || exit 1
ENTRYPOINT ["dotnet", "DocumentService.Application.dll"]

