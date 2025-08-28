using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Invoices.Domain;
using ShipMvp.Core.Attributes;

namespace Invoices.Application;

[AutoController(Route = "api/invoices")]
public class InvoiceService : IInvoiceService
{
    private readonly IInvoiceRepository _repository;

    public InvoiceService(IInvoiceRepository repository)
    {
        _repository = repository;
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto request, CancellationToken cancellationToken = default)
    {
        var invoiceId = Guid.NewGuid();
        var invoice = new Invoice(invoiceId, request.CustomerName);
        
        invoice.Items = request.Items.Select(i => new InvoiceItem(
            Guid.NewGuid(),
            i.Description,
            i.Amount,
            invoiceId
        )).ToList();

        invoice.TotalAmount = invoice.Items.Sum(x => x.Amount);

        var createdInvoice = await _repository.AddAsync(invoice, cancellationToken);
        return MapToDto(createdInvoice);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        await _repository.DeleteAsync(id, cancellationToken);
    }

    public async Task<InvoiceDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invoice = await _repository.GetByIdAsync(id, cancellationToken);
        return invoice == null ? null : MapToDto(invoice);
    }

    public async Task<IEnumerable<InvoiceDto>> GetListAsync(GetInvoicesQuery query, CancellationToken cancellationToken = default)
    {
        IEnumerable<Invoice> invoices;

        if (!string.IsNullOrEmpty(query.CustomerName))
        {
            invoices = await _repository.GetByCustomerNameAsync(query.CustomerName, cancellationToken);
        }
        else if (!string.IsNullOrEmpty(query.Status) && Enum.TryParse<InvoiceStatus>(query.Status, out var status))
        {
            invoices = await _repository.GetByStatusAsync(status, cancellationToken);
        }
        else
        {
            invoices = await _repository.GetAllAsync(cancellationToken);
        }

        // Apply additional filtering if both filters are specified
        if (!string.IsNullOrEmpty(query.CustomerName) && !string.IsNullOrEmpty(query.Status) && Enum.TryParse<InvoiceStatus>(query.Status, out var statusFilter))
        {
            invoices = invoices.Where(i => i.Status == statusFilter);
        }

        return invoices.Select(MapToDto);
    }

    public async Task<int> GetCountAsync(GetInvoicesQuery query, CancellationToken cancellationToken = default)
    {
        var invoices = await GetListAsync(query, cancellationToken);
        return invoices.Count();
    }

    public async Task<InvoiceDto> MarkAsPaidAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var invoice = await _repository.GetByIdAsync(id, cancellationToken);
        if (invoice == null) throw new InvalidOperationException("Invoice not found");
        
        invoice.MarkAsPaid();
        var updatedInvoice = await _repository.UpdateAsync(invoice, cancellationToken);
        return MapToDto(updatedInvoice);
    }

    public async Task<InvoiceDto> UpdateAsync(Guid id, UpdateInvoiceDto request, CancellationToken cancellationToken = default)
    {
        var invoice = await _repository.GetByIdAsync(id, cancellationToken);
        if (invoice == null) throw new InvalidOperationException("Invoice not found");
        
        invoice.CustomerName = request.CustomerName;
        invoice.Items = request.Items.Select(i => new InvoiceItem(
            Guid.NewGuid(),
            i.Description,
            i.Amount,
            invoice.Id
        )).ToList();
        invoice.TotalAmount = invoice.Items.Sum(x => x.Amount);
        
        var updatedInvoice = await _repository.UpdateAsync(invoice, cancellationToken);
        return MapToDto(updatedInvoice);
    }

    private static InvoiceDto MapToDto(Invoice invoice) => new InvoiceDto
    {
        Id = invoice.Id,
        CustomerName = invoice.CustomerName,
        Items = invoice.Items?.Select(i => new InvoiceItemDto(i.Id, i.Description, i.Amount)).ToList() ?? new(),
        TotalAmount = invoice.TotalAmount,
        Currency = "USD",
        CreatedAt = invoice.CreatedAt,
        Status = invoice.Status.ToString()
    };
}
