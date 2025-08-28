using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Invoices.Application;

namespace Invoices.Controllers
{
    [ApiController]
    [Route("api/invoices")]
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _service;

        public InvoicesController(IInvoiceService service)
        {
            _service = service;
        }

        [HttpPost]
        public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceDto dto)
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<InvoiceDto>>> List([FromQuery] GetInvoicesQuery q)
        {
            var list = await _service.GetListAsync(q);
            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto?>> GetById(Guid id)
        {
            var v = await _service.GetByIdAsync(id);
            if (v == null) return NotFound();
            return Ok(v);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InvoiceDto>> Update(Guid id, UpdateInvoiceDto dto)
        {
            var updated = await _service.UpdateAsync(id, dto);
            return Ok(updated);
        }

        [HttpPost("{id}/mark-as-paid")]
        public async Task<ActionResult<InvoiceDto>> MarkAsPaid(Guid id)
        {
            var r = await _service.MarkAsPaidAsync(id);
            return Ok(r);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
