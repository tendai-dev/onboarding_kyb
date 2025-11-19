using ChecklistService.Application.Interfaces;
using ChecklistService.Domain.Aggregates;
using ChecklistService.Domain.ValueObjects;
using ChecklistService.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ChecklistService.Infrastructure.Repositories;

public class ChecklistRepository : IChecklistRepository
{
    private readonly ChecklistDbContext _context;

    public ChecklistRepository(ChecklistDbContext context)
    {
        _context = context;
    }

    public async Task<Checklist?> GetByIdAsync(ChecklistId id, CancellationToken cancellationToken = default)
    {
        var checklist = await _context.Checklists
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (checklist != null)
        {
            await LoadItemsAsync(checklist, cancellationToken);
        }

        return checklist;
    }

    public async Task<Checklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var checklist = await _context.Checklists
            .FirstOrDefaultAsync(c => c.CaseId == caseId, cancellationToken);

        if (checklist != null)
        {
            await LoadItemsAsync(checklist, cancellationToken);
        }

        return checklist;
    }

    public async Task<List<Checklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
    {
        var checklists = await _context.Checklists
            .Where(c => c.PartnerId == partnerId)
            .ToListAsync(cancellationToken);

        foreach (var checklist in checklists)
        {
            await LoadItemsAsync(checklist, cancellationToken);
        }

        return checklists;
    }

    public async Task<List<Checklist>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var checklists = await _context.Checklists
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        foreach (var checklist in checklists)
        {
            try
            {
                await LoadItemsAsync(checklist, cancellationToken);
            }
            catch
            {
                // Skip checklists that fail to load items
            }
        }

        return checklists;
    }

    public async Task AddAsync(Checklist checklist, CancellationToken cancellationToken = default)
    {
        _context.Checklists.Add(checklist);
        
        // Add items separately - let EF Core handle the relationship
        foreach (var item in checklist.Items)
        {
            _context.ChecklistItems.Add(item);
        }
    }

    public async Task UpdateAsync(Checklist checklist, CancellationToken cancellationToken = default)
    {
        _context.Checklists.Update(checklist);
        
        // Update items
        foreach (var item in checklist.Items)
        {
            _context.ChecklistItems.Update(item);
        }
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task LoadItemsAsync(Checklist checklist, CancellationToken cancellationToken)
    {
        var items = await _context.ChecklistItems
            .Where(i => EF.Property<ChecklistId>(i, "ChecklistId") == checklist.Id)
            .OrderBy(i => i.Order)
            .ToListAsync(cancellationToken);

        // Use reflection to set the private _items field
        var itemsField = typeof(Checklist).GetField("_items", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        
        if (itemsField != null)
        {
            itemsField.SetValue(checklist, items);
        }
    }
}
