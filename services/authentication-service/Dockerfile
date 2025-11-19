# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy all source files
COPY src/ ./src/

# Create a simple webapi project
RUN dotnet new webapi -n AuthenticationService.Presentation -o ./src/Presentation -f net8.0 --no-https --use-minimal-apis false --force

# Copy our source files over the generated ones
COPY src/Presentation/Program.cs ./src/Presentation/Program.cs
COPY src/Presentation/Controllers/ ./src/Presentation/Controllers/
COPY src/Presentation/Extensions/ ./src/Presentation/Extensions/
COPY src/Application/ ./src/Application/
COPY src/Domain/ ./src/Domain/
COPY src/Infrastructure/ ./src/Infrastructure/

# Restore and build
WORKDIR /src/Presentation
RUN dotnet restore
RUN dotnet build -c Release -o /app/build
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

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
EXPOSE 80

# Set environment
ENV ASPNETCORE_URLS=http://+:80
ENV ASPNETCORE_ENVIRONMENT=Production

# Start application
ENTRYPOINT ["dotnet", "AuthenticationService.Presentation.dll"]
