using System;
using System.Collections.Generic;

namespace Invoices.Application;

public record InvoiceItemDto(Guid Id, string Description, decimal Amount);

public record InvoiceDto
{
    public Guid Id { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public List<InvoiceItemDto> Items { get; init; } = new();
    public decimal TotalAmount { get; init; }
    public string Currency { get; init; } = "USD";
    public DateTime CreatedAt { get; init; }
    public string Status { get; init; } = "Draft";
}

public record CreateInvoiceDto
{
    public string CustomerName { get; init; } = string.Empty;
    public List<CreateInvoiceItemDto> Items { get; init; } = new();
}

public record CreateInvoiceItemDto
{
    public string Description { get; init; } = string.Empty;
    public decimal Amount { get; init; }
}

public record UpdateInvoiceDto : CreateInvoiceDto;

public record GetInvoicesQuery
{
    public string? CustomerName { get; init; }
    public string? Status { get; init; }
}
