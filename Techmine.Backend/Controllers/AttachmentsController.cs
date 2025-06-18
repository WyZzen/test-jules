using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Techmine.Backend.Models; // For Attachment, AttachmentDto, CreateAttachmentDto, UpdateAttachmentDto
using Techmine.Backend.Services; // For AppDbContext

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All attachment actions require authentication
    public class AttachmentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<AttachmentsController> _logger;

        public AttachmentsController(AppDbContext context, ILogger<AttachmentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/attachments
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttachmentDto>>> GetAttachments(
            [FromQuery] string? type,
            [FromQuery] string? nameSearch)
        {
            _logger.LogInformation("Fetching attachments. Type filter: {Type}, Name search: {NameSearch}", type, nameSearch);
            var query = _context.Attachments.AsNoTracking();

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(a => a.Type != null && a.Type.ToLower() == type.ToLower());
            }
            if (!string.IsNullOrEmpty(nameSearch))
            {
                query = query.Where(a => a.Name != null && a.Name.ToLower().Contains(nameSearch.ToLower()));
            }

            var attachments = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();

            var attachmentDtos = attachments.Select(a => new AttachmentDto
            {
                Id = a.Id,
                Name = a.Name,
                Type = a.Type,
                FileName = a.FileName,
                FileUrl = a.FileUrl,
                CreatedAt = a.CreatedAt
                // ReportId = a.ReportId // Uncomment if linking to reports
            }).ToList();

            return Ok(attachmentDtos);
        }

        // GET: api/attachments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AttachmentDto>> GetAttachment(Guid id)
        {
            _logger.LogInformation("Fetching attachment with ID: {Id}", id);
            var attachment = await _context.Attachments.AsNoTracking().FirstOrDefaultAsync(a => a.Id == id);

            if (attachment == null)
            {
                _logger.LogWarning("Attachment with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Attachment with ID {id} not found." });
            }

            var attachmentDto = new AttachmentDto
            {
                Id = attachment.Id,
                Name = attachment.Name,
                Type = attachment.Type,
                FileName = attachment.FileName,
                FileUrl = attachment.FileUrl,
                CreatedAt = attachment.CreatedAt
                // ReportId = attachment.ReportId // Uncomment if linking to reports
            };
            return Ok(attachmentDto);
        }

        // POST: api/attachments
        [HttpPost]
        public async Task<ActionResult<AttachmentDto>> CreateAttachment(CreateAttachmentDto createAttachmentDto)
        {
            _logger.LogInformation("Attempting to create new attachment with name: {Name}", createAttachmentDto.Name);

            var attachment = new Attachment
            {
                Id = Guid.NewGuid(), // Server generates ID
                Name = createAttachmentDto.Name,
                Type = createAttachmentDto.Type,
                FileName = createAttachmentDto.FileName, // This would typically come from an uploaded file
                FileUrl = createAttachmentDto.FileUrl,   // This would be set after successful upload to storage
                CreatedAt = DateTime.UtcNow // Explicitly set CreatedAt
                // ReportId = createAttachmentDto.ReportId // Uncomment if linking to reports
            };

            _context.Attachments.Add(attachment);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created new attachment with ID: {AttachmentId}", attachment.Id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating attachment in database. Name: {Name}", createAttachmentDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error creating attachment in database.");
            }

            var attachmentDto = new AttachmentDto
            {
                Id = attachment.Id,
                Name = attachment.Name,
                Type = attachment.Type,
                FileName = attachment.FileName,
                FileUrl = attachment.FileUrl,
                CreatedAt = attachment.CreatedAt
                // ReportId = attachment.ReportId // Uncomment if linking to reports
            };
            return CreatedAtAction(nameof(GetAttachment), new { id = attachment.Id }, attachmentDto);
        }

        // PUT: api/attachments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttachment(Guid id, UpdateAttachmentDto updateAttachmentDto)
        {
            _logger.LogInformation("Attempting to update attachment with ID: {Id}", id);
            var attachment = await _context.Attachments.FindAsync(id);

            if (attachment == null)
            {
                _logger.LogWarning("Update failed. Attachment with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Attachment with ID {id} not found for update." });
            }

            attachment.Name = updateAttachmentDto.Name;
            attachment.Type = updateAttachmentDto.Type;
            attachment.FileName = updateAttachmentDto.FileName; // Client might update filename if replacing file
            attachment.FileUrl = updateAttachmentDto.FileUrl;   // Client might update URL if replacing file
            // attachment.ReportId = updateAttachmentDto.ReportId; // Uncomment if linking to reports

            _context.Entry(attachment).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated attachment with ID: {AttachmentId}", attachment.Id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Attachments.Any(e => e.Id == id))
                {
                    _logger.LogWarning("Concurrency error: Attachment with ID {Id} was not found during update.", id);
                    return NotFound(new { Message = $"Concurrency error: Attachment with ID {id} not found." });
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating attachment with ID: {AttachmentId}", attachment.Id);
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Database error updating attachment with ID: {AttachmentId}", attachment.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating attachment in database.");
            }

            return NoContent();
        }

        // DELETE: api/attachments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttachment(Guid id)
        {
            _logger.LogInformation("Attempting to delete attachment with ID: {Id}", id);
            var attachment = await _context.Attachments.FindAsync(id);
            if (attachment == null)
            {
                _logger.LogWarning("Delete failed. Attachment with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Attachment with ID {id} not found for deletion." });
            }

            // Important Note: This only deletes the metadata from the database.
            // If the FileUrl points to a file in Supabase Storage (or any other blob storage),
            // that file will NOT be deleted by this operation.
            // Deleting from storage requires a separate call to the storage provider's API.
            // For Supabase Storage, this would involve using the Supabase client library's storage methods.
            // if (!string.IsNullOrEmpty(attachment.FileUrl))
            // {
            //     _logger.LogInformation("TODO: Implement actual file deletion from storage for FileUrl: {FileUrl}", attachment.FileUrl);
            // }

            _context.Attachments.Remove(attachment);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully deleted attachment metadata with ID: {AttachmentId}", id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting attachment with ID: {AttachmentId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting attachment from database.");
            }

            return NoContent();
        }
    }
}
