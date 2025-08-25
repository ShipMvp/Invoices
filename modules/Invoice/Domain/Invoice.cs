public class Invoice
{
    public Guid Id { get; set; }
    public string CustomerName { get; set; } = default!;
    public decimal Amount { get; set; }
    public DateTime CreatedAt { get; set; }
}