using ShipMvp.Core.Abstractions;

namespace Invoices.Domain;

/// <summary>
/// Repository interface for Invoice entities following the IRepository pattern
/// </summary>
public interface IInvoiceRepository : IRepository<Invoice, Guid>
{
    /// <summary>
    /// Get invoices by customer name
    /// </summary>
    Task<IEnumerable<Invoice>> GetByCustomerNameAsync(string customerName, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get invoices by status
    /// </summary>
    Task<IEnumerable<Invoice>> GetByStatusAsync(InvoiceStatus status, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get invoices within a date range
    /// </summary>
    Task<IEnumerable<Invoice>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Get paginated list of invoices
    /// </summary>
    Task<(IEnumerable<Invoice> Items, int TotalCount)> GetPagedAsync(int page, int pageSize, CancellationToken cancellationToken = default);
}
