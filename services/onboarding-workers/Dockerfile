FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["OnboardingWorkers.csproj", "./"]
RUN dotnet restore "OnboardingWorkers.csproj"
COPY . .
RUN dotnet publish "OnboardingWorkers.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
RUN groupadd -r appuser && useradd -r -g appuser appuser
COPY --from=build /app/publish .
RUN chown -R appuser:appuser /app
USER appuser
ENTRYPOINT ["dotnet", "OnboardingWorkers.dll"]

