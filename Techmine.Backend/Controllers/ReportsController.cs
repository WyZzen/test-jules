using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims; // Required for accessing User claims if needed
using System.Threading.Tasks;
using Techmine.Backend.Models; // For Report, ReportDto, CreateReportDto, UpdateReportDto
using Techmine.Backend.Services; // For AppDbContext

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All report actions require authentication
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ReportsController> _logger;

        public ReportsController(AppDbContext context, ILogger<ReportsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/reports
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReportDto>>> GetReports(
            [FromQuery] string? status,
            [FromQuery] string? titleSearch)
        {
            _logger.LogInformation("Fetching reports. Status filter: {Status}, Title search: {TitleSearch}", status, titleSearch);

            var query = _context.Reports.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(r => r.Status != null && r.Status.ToLower() == status.ToLower());
            }
            if (!string.IsNullOrEmpty(titleSearch))
            {
                query = query.Where(r => r.Title != null && r.Title.ToLower().Contains(titleSearch.ToLower()));
            }

            var reports = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();

            var reportDtos = reports.Select(r => new ReportDto
            {
                Id = r.Id,
                Title = r.Title,
                Description = r.Description,
                ReportDate = r.ReportDate, // This is the DateTime? from Report entity
                Status = r.Status,
                CreatedAt = r.CreatedAt
            }).ToList();

            return Ok(reportDtos);
        }

        // GET: api/reports/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ReportDto>> GetReport(Guid id)
        {
            _logger.LogInformation("Fetching report with ID: {Id}", id);
            var report = await _context.Reports.AsNoTracking().FirstOrDefaultAsync(r => r.Id == id);

            if (report == null)
            {
                _logger.LogWarning("Report with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Report with ID {id} not found." });
            }

            var reportDto = new ReportDto
            {
                Id = report.Id,
                Title = report.Title,
                Description = report.Description,
                ReportDate = report.ReportDate,
                Status = report.Status,
                CreatedAt = report.CreatedAt
            };
            return Ok(reportDto);
        }

        // POST: api/reports
        [HttpPost]
        public async Task<ActionResult<ReportDto>> CreateReport(CreateReportDto createReportDto)
        {
            _logger.LogInformation("Attempting to create new report with title: {Title}", createReportDto.Title);

            // Optional: Get current user ID if reports should be associated with a user
            // var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            // if (!Guid.TryParse(userIdString, out Guid userId)) { /* handle error */ }

            var report = new Report
            {
                Id = Guid.NewGuid(), // Server generates ID
                Title = createReportDto.Title,
                Description = createReportDto.Description,
                ReportDate = createReportDto.ReportDate,
                Status = createReportDto.Status,
                CreatedAt = DateTime.UtcNow // Explicitly set CreatedAt, though DB might have a default
                // UserId = userId, // If associating with a user
            };

            _context.Reports.Add(report);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created new report with ID: {ReportId}", report.Id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating report in database. Title: {Title}", createReportDto.Title);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error creating report in database.");
            }


            var reportDto = new ReportDto
            {
                Id = report.Id,
                Title = report.Title,
                Description = report.Description,
                ReportDate = report.ReportDate,
                Status = report.Status,
                CreatedAt = report.CreatedAt
            };
            return CreatedAtAction(nameof(GetReport), new { id = report.Id }, reportDto);
        }

        // PUT: api/reports/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReport(Guid id, UpdateReportDto updateReportDto)
        {
            _logger.LogInformation("Attempting to update report with ID: {Id}", id);
            var report = await _context.Reports.FindAsync(id);

            if (report == null)
            {
                _logger.LogWarning("Update failed. Report with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Report with ID {id} not found for update." });
            }

            // Update properties
            report.Title = updateReportDto.Title;
            report.Description = updateReportDto.Description;
            report.ReportDate = updateReportDto.ReportDate;
            report.Status = updateReportDto.Status;
            // If you have an 'UpdatedAt' field, set it here:
            // report.UpdatedAt = DateTime.UtcNow;

            _context.Entry(report).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated report with ID: {ReportId}", report.Id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Reports.Any(e => e.Id == id))
                {
                    _logger.LogWarning("Concurrency error: Report with ID {Id} was not found during update.", id);
                    return NotFound(new { Message = $"Concurrency error: Report with ID {id} not found." });
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating report with ID: {ReportId}", report.Id);
                    throw; // Re-throw for global exception handler or detailed logging
                }
            }
            catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Database error updating report with ID: {ReportId}", report.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating report in database.");
            }

            return NoContent(); // Standard response for successful PUT
        }

        // DELETE: api/reports/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReport(Guid id)
        {
            _logger.LogInformation("Attempting to delete report with ID: {Id}", id);
            var report = await _context.Reports.FindAsync(id);
            if (report == null)
            {
                _logger.LogWarning("Delete failed. Report with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Report with ID {id} not found for deletion." });
            }

            _context.Reports.Remove(report);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully deleted report with ID: {ReportId}", id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting report with ID: {ReportId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting report from database.");
            }

            return NoContent(); // Standard response for successful DELETE
        }
    }
}
