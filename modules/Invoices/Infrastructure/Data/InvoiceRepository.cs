using Microsoft.EntityFrameworkCore;
using ShipMvp.Core.Persistence;
using ShipMvp.Core.Attributes;
using Invoices.Domain;

namespace Invoices.Infrastructure.Data;

/// <summary>
/// Entity Framework implementation of IInvoiceRepository using IDbContext
/// </summary>
[UnitOfWork]
public class InvoiceRepository : IInvoiceRepository
{
    private readonly IDbContext _context;
    private readonly DbSet<Invoice> _dbSet;

    public InvoiceRepository(IDbContext context)
    {
        _context = context;
        _dbSet = context.Set<Invoice>();
    }

    // IRepository<Invoice, Guid> implementation
    public async Task<Invoice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Invoice>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Items)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Invoice> AddAsync(Invoice entity, CancellationToken cancellationToken = default)
    {
        var entry = await _dbSet.AddAsync(entity, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return entry.Entity;
    }

    public async Task<Invoice> UpdateAsync(Invoice entity, CancellationToken cancellationToken = default)
    {
        var entry = _dbSet.Update(entity);
        await _context.SaveChangesAsync(cancellationToken);
        return entry.Entity;
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity != null)
        {
            _dbSet.Remove(entity);
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    // IInvoiceRepository specific methods
    public async Task<IEnumerable<Invoice>> GetByCustomerNameAsync(string customerName, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Items)
            .Where(x => x.CustomerName.Contains(customerName))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Invoice>> GetByStatusAsync(InvoiceStatus status, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Items)
            .Where(x => x.Status == status)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Invoice>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(x => x.Items)
            .Where(x => x.CreatedAt >= startDate && x.CreatedAt <= endDate)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<(IEnumerable<Invoice> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(x => x.Items);
        
        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }
}
