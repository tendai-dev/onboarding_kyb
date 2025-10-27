using WorkQueueService.Presentation.Controllers;
using WorkQueueService.Application.Interfaces;
using WorkQueueService.Infrastructure.Persistence;
using WorkQueueService.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using MediatR;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<WorkQueueDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSQL")));

// Repositories
builder.Services.AddScoped<IWorkItemRepository, WorkItemRepository>();

// MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(WorkQueueService.Application.Commands.AssignWorkItemCommand).Assembly));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Auto-migrate database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorkQueueDbContext>();
    // db.Database.EnsureCreated(); // Temporarily disabled for Docker
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();
