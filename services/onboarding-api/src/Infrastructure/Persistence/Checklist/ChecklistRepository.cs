using Microsoft.EntityFrameworkCore;
using OnboardingApi.Application.Checklist.Interfaces;
using OnboardingApi.Domain.Checklist.Aggregates;
using OnboardingApi.Domain.Checklist.ValueObjects;
using OnboardingApi.Infrastructure.Persistence.Checklist;

namespace OnboardingApi.Infrastructure.Persistence.Checklist;

public class ChecklistRepository : IChecklistRepository
{
    private readonly ChecklistDbContext _context;

    public ChecklistRepository(ChecklistDbContext context)
    {
        _context = context;
    }

    public async Task<Domain.Checklist.Aggregates.Checklist?> GetByIdAsync(ChecklistId id, CancellationToken cancellationToken = default)
    {
        var checklist = await _context.Checklists
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (checklist != null)
        {
            await LoadItemsAsync(checklist, cancellationToken);
        }

        return checklist;
    }

    public async Task<Domain.Checklist.Aggregates.Checklist?> GetByCaseIdAsync(string caseId, CancellationToken cancellationToken = default)
    {
        var checklist = await _context.Checklists
            .FirstOrDefaultAsync(c => c.CaseId == caseId, cancellationToken);

        if (checklist != null)
        {
            await LoadItemsAsync(checklist, cancellationToken);
        }

        return checklist;
    }

    public async Task<List<Domain.Checklist.Aggregates.Checklist>> GetByPartnerIdAsync(string partnerId, CancellationToken cancellationToken = default)
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

    public async Task<List<Domain.Checklist.Aggregates.Checklist>> GetAllAsync(CancellationToken cancellationToken = default)
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

    public async Task AddAsync(Domain.Checklist.Aggregates.Checklist checklist, CancellationToken cancellationToken = default)
    {
        _context.Checklists.Add(checklist);
        
        // Add items separately - let EF Core handle the relationship
        foreach (var item in checklist.Items)
        {
            _context.ChecklistItems.Add(item);
        }
    }

    public async Task UpdateAsync(Domain.Checklist.Aggregates.Checklist checklist, CancellationToken cancellationToken = default)
    {
        // Get existing items from database
        var existingItems = await _context.ChecklistItems
            .Where(i => EF.Property<ChecklistId>(i, "ChecklistId") == checklist.Id)
            .ToListAsync(cancellationToken);

        // Remove items that are no longer in the checklist
        var currentItemIds = checklist.Items.Select(i => i.Id).ToHashSet();
        var itemsToRemove = existingItems.Where(i => !currentItemIds.Contains(i.Id)).ToList();
        _context.ChecklistItems.RemoveRange(itemsToRemove);

        // Add or update items
        var existingItemIds = existingItems.Select(i => i.Id).ToHashSet();
        foreach (var item in checklist.Items)
        {
            if (existingItemIds.Contains(item.Id))
            {
                // Item exists, update it
                _context.Entry(item).State = EntityState.Modified;
            }
            else
            {
                // New item, add it with the foreign key set
                _context.ChecklistItems.Add(item);
                _context.Entry(item).Property("ChecklistId").CurrentValue = checklist.Id;
            }
        }

        // Update the checklist itself
        _context.Entry(checklist).State = EntityState.Modified;
    }

    public async Task DeleteAsync(Domain.Checklist.Aggregates.Checklist checklist, CancellationToken cancellationToken = default)
    {
        // Delete all items first
        var items = await _context.ChecklistItems
            .Where(i => EF.Property<ChecklistId>(i, "ChecklistId") == checklist.Id)
            .ToListAsync(cancellationToken);

        _context.ChecklistItems.RemoveRange(items);
        _context.Checklists.Remove(checklist);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> DeleteByCaseIdAsync(Guid caseId, CancellationToken cancellationToken = default)
    {
        var caseIdString = caseId.ToString();
        var checklists = await _context.Checklists
            .Where(c => c.CaseId == caseIdString)
            .ToListAsync(cancellationToken);
        
        if (checklists.Count == 0)
            return 0;
        
        foreach (var checklist in checklists)
        {
            await DeleteAsync(checklist, cancellationToken);
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        return checklists.Count;
    }

    private async Task LoadItemsAsync(Domain.Checklist.Aggregates.Checklist checklist, CancellationToken cancellationToken)
    {
        var items = await _context.ChecklistItems
            .Where(i => EF.Property<ChecklistId>(i, "ChecklistId") == checklist.Id)
            .OrderBy(i => i.Order)
            .ToListAsync(cancellationToken);

        // Use reflection to set the private _items field
        var itemsField = typeof(Domain.Checklist.Aggregates.Checklist).GetField("_items", 
            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        
        if (itemsField != null)
        {
            itemsField.SetValue(checklist, items);
        }
    }
}

