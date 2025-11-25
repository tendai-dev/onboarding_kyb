FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY ["src/Migrations/OnboardingApi.Migrations.csproj", "src/Migrations/"]
COPY ["src/Infrastructure/OnboardingApi.Infrastructure.csproj", "src/Infrastructure/"]
COPY ["src/Domain/OnboardingApi.Domain.csproj", "src/Domain/"]
COPY ["src/Application/OnboardingApi.Application.csproj", "src/Application/"]

# Restore dependencies
RUN dotnet restore "src/Migrations/OnboardingApi.Migrations.csproj"

# Copy everything else
COPY . .

# Build
RUN dotnet build "src/Migrations/OnboardingApi.Migrations.csproj" -c Release -o /app/build

# Publish
RUN dotnet publish "src/Migrations/OnboardingApi.Migrations.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
COPY --from=build /src/src/Migrations/appsettings.json .
ENTRYPOINT ["dotnet", "OnboardingApi.Migrations.dll"]

