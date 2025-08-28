using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Invoices.Application;

public interface IInvoiceService
{
    Task<InvoiceDto> CreateAsync(CreateInvoiceDto request, CancellationToken cancellationToken = default);
    Task<InvoiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<InvoiceDto>> GetListAsync(GetInvoicesQuery query, CancellationToken cancellationToken = default);
    Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceDto request, CancellationToken cancellationToken = default);
    Task<InvoiceDto> MarkAsPaidAsync(Guid id, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<int> GetCountAsync(GetInvoicesQuery query, CancellationToken cancellationToken = default);
}
