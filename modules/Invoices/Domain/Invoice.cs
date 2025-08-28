using ShipMvp.Core.Entities;

namespace Invoices.Domain
{
    public enum InvoiceStatus
    {
        Draft,
        Sent,
        Paid,
        Cancelled,
        Overdue
    }

    public class Invoice : Entity<Guid>
    {
        public string CustomerName { get; set; } = default!;
        public List<InvoiceItem> Items { get; set; } = new();
        public decimal TotalAmount { get; set; }
        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        // Parameterless constructor for EF Core
        private Invoice() : base(Guid.Empty) { }

        public Invoice(Guid id, string customerName) : base(id)
        {
            CustomerName = customerName;
            Items = new List<InvoiceItem>();
            Status = InvoiceStatus.Draft;
        }

        public Invoice MarkAsPaid()
        {
            Status = InvoiceStatus.Paid;
            return this;
        }

        public Invoice MarkAsSent()
        {
            Status = InvoiceStatus.Sent;
            return this;
        }

        public Invoice Cancel()
        {
            Status = InvoiceStatus.Cancelled;
            return this;
        }
    }

    public class InvoiceItem : Entity<Guid>
    {
        public string Description { get; set; } = default!;
        public decimal Amount { get; set; }
        public Guid InvoiceId { get; set; }

        // Parameterless constructor for EF Core
        private InvoiceItem() : base(Guid.Empty) { }

        public InvoiceItem(Guid id, string description, decimal amount, Guid invoiceId) : base(id)
        {
            Description = description;
            Amount = amount;
            InvoiceId = invoiceId;
        }

        public static InvoiceItem Create(string description, decimal amount)
        {
            return new InvoiceItem(Guid.NewGuid(), description, amount, Guid.Empty);
        }
    }
}
