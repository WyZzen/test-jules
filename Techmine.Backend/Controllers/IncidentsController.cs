using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims; // For potentially auto-filling ReportedBy
using System.Threading.Tasks;
using Techmine.Backend.Models;
using Techmine.Backend.Services;

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All incident actions require authentication
    public class IncidentsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<IncidentsController> _logger;

        public IncidentsController(AppDbContext context, ILogger<IncidentsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/incidents
        [HttpGet]
        public async Task<ActionResult<IEnumerable<IncidentDto>>> GetIncidents(
            [FromQuery] string? status,
            [FromQuery] string? severity,
            [FromQuery] string? titleSearch)
        {
            _logger.LogInformation("Fetching incidents. Status: {Status}, Severity: {Severity}, Title: {TitleSearch}", status, severity, titleSearch);
            var query = _context.Incidents.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status != null && i.Status.ToLower() == status.ToLower());
            }
            if (!string.IsNullOrEmpty(severity))
            {
                query = query.Where(i => i.Severity != null && i.Severity.ToLower() == severity.ToLower());
            }
            if (!string.IsNullOrEmpty(titleSearch))
            {
                query = query.Where(i => i.Title != null && i.Title.ToLower().Contains(titleSearch.ToLower()));
            }

            // Order by IncidentDate first, then CreatedAt for incidents on the same day
            var incidents = await query.OrderByDescending(i => i.IncidentDate)
                                       .ThenByDescending(i => i.CreatedAt)
                                       .ToListAsync();

            var incidentDtos = incidents.Select(i => new IncidentDto
            {
                Id = i.Id,
                Title = i.Title,
                Description = i.Description,
                IncidentDate = i.IncidentDate,
                Location = i.Location,
                Severity = i.Severity,
                ReportedBy = i.ReportedBy,
                Status = i.Status,
                CreatedAt = i.CreatedAt
            }).ToList();

            return Ok(incidentDtos);
        }

        // GET: api/incidents/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<IncidentDto>> GetIncident(Guid id)
        {
            _logger.LogInformation("Fetching incident with ID: {Id}", id);
            var incident = await _context.Incidents.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);

            if (incident == null)
            {
                _logger.LogWarning("Incident with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Incident with ID {id} not found." });
            }

            var incidentDto = new IncidentDto
            {
                Id = incident.Id,
                Title = incident.Title,
                Description = incident.Description,
                IncidentDate = incident.IncidentDate,
                Location = incident.Location,
                Severity = incident.Severity,
                ReportedBy = incident.ReportedBy,
                Status = incident.Status,
                CreatedAt = incident.CreatedAt
            };
            return Ok(incidentDto);
        }

        // POST: api/incidents
        [HttpPost]
        public async Task<ActionResult<IncidentDto>> CreateIncident(CreateIncidentDto createIncidentDto)
        {
            _logger.LogInformation("Attempting to create new incident with title: {Title}", createIncidentDto.Title);

            // Optionally, auto-fill ReportedBy from logged-in user if not provided and desired
            var reportedBy = createIncidentDto.ReportedBy;
            if (string.IsNullOrEmpty(reportedBy))
            {
                 // Example: Use user's name claim or email if available in JWT.
                 // NameIdentifier is the 'sub' (user_id). You might want a 'name' or 'email' claim for this.
                 reportedBy = User.FindFirstValue(ClaimTypes.Name) ?? User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            }

            var incident = new Incident
            {
                Id = Guid.NewGuid(),
                Title = createIncidentDto.Title,
                Description = createIncidentDto.Description,
                IncidentDate = createIncidentDto.IncidentDate, // This is now required in DTO
                Location = createIncidentDto.Location,
                Severity = createIncidentDto.Severity,
                ReportedBy = reportedBy,
                Status = string.IsNullOrEmpty(createIncidentDto.Status) ? "Open" : createIncidentDto.Status,
                CreatedAt = DateTime.UtcNow
            };

            _context.Incidents.Add(incident);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created new incident with ID: {IncidentId}", incident.Id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating incident in database. Title: {Title}", createIncidentDto.Title);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error creating incident in database.");
            }

            var incidentDto = new IncidentDto
            {
                Id = incident.Id,
                Title = incident.Title,
                Description = incident.Description,
                IncidentDate = incident.IncidentDate,
                Location = incident.Location,
                Severity = incident.Severity,
                ReportedBy = incident.ReportedBy,
                Status = incident.Status,
                CreatedAt = incident.CreatedAt
            };
            return CreatedAtAction(nameof(GetIncident), new { id = incident.Id }, incidentDto);
        }

        // PUT: api/incidents/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIncident(Guid id, UpdateIncidentDto updateIncidentDto)
        {
            _logger.LogInformation("Attempting to update incident with ID: {Id}", id);
            var incident = await _context.Incidents.FindAsync(id);

            if (incident == null)
            {
                _logger.LogWarning("Update failed. Incident with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Incident with ID {id} not found for update." });
            }

            incident.Title = updateIncidentDto.Title;
            incident.Description = updateIncidentDto.Description;
            incident.IncidentDate = updateIncidentDto.IncidentDate; // This is now required in DTO
            incident.Location = updateIncidentDto.Location;
            incident.Severity = updateIncidentDto.Severity;
            incident.ReportedBy = updateIncidentDto.ReportedBy;
            incident.Status = updateIncidentDto.Status;

            _context.Entry(incident).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated incident with ID: {IncidentId}", incident.Id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Incidents.Any(e => e.Id == id))
                {
                     _logger.LogWarning("Concurrency error: Incident with ID {Id} was not found during update.", id);
                    return NotFound(new { Message = $"Concurrency error: Incident with ID {id} not found." });
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating incident with ID: {IncidentId}", incident.Id);
                    throw;
                }
            }
             catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Database error updating incident with ID: {IncidentId}", incident.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating incident in database.");
            }

            return NoContent();
        }

        // DELETE: api/incidents/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIncident(Guid id)
        {
            _logger.LogInformation("Attempting to delete incident with ID: {Id}", id);
            var incident = await _context.Incidents.FindAsync(id);
            if (incident == null)
            {
                _logger.LogWarning("Delete failed. Incident with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Incident with ID {id} not found for deletion." });
            }

            _context.Incidents.Remove(incident);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully deleted incident with ID: {IncidentId}", id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting incident with ID: {IncidentId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting incident from database.");
            }

            return NoContent();
        }
    }
}
