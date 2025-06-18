using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Techmine.Backend.Models;
using Techmine.Backend.Services;

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Worksites are admin-managed
    public class WorksitesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<WorksitesController> _logger;

        public WorksitesController(AppDbContext context, ILogger<WorksitesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/worksites
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorksiteDto>>> GetWorksites(
            [FromQuery] string? status,
            [FromQuery] string? nameSearch)
        {
            _logger.LogInformation("Fetching worksites. Status filter: {Status}, Name search: {NameSearch}", status, nameSearch);
            var query = _context.Worksites.AsNoTracking();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(w => w.Status != null && w.Status.ToLower() == status.ToLower());
            }
            if (!string.IsNullOrEmpty(nameSearch))
            {
                query = query.Where(w => w.Name != null && w.Name.ToLower().Contains(nameSearch.ToLower()));
            }

            var worksites = await query.OrderBy(w => w.Name).ToListAsync();

            var worksiteDtos = worksites.Select(w => new WorksiteDto
            {
                Id = w.Id,
                Name = w.Name,
                Location = w.Location,
                StartDate = w.StartDate,
                Status = w.Status,
                CreatedAt = w.CreatedAt
            }).ToList();

            return Ok(worksiteDtos);
        }

        // GET: api/worksites/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<WorksiteDto>> GetWorksite(Guid id)
        {
            _logger.LogInformation("Fetching worksite with ID: {Id}", id);
            var worksite = await _context.Worksites.AsNoTracking().FirstOrDefaultAsync(w => w.Id == id);

            if (worksite == null)
            {
                _logger.LogWarning("Worksite with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Worksite with ID {id} not found." });
            }

            var worksiteDto = new WorksiteDto
            {
                Id = worksite.Id,
                Name = worksite.Name,
                Location = worksite.Location,
                StartDate = worksite.StartDate,
                Status = worksite.Status,
                CreatedAt = worksite.CreatedAt
            };
            return Ok(worksiteDto);
        }

        // POST: api/worksites
        [HttpPost]
        public async Task<ActionResult<WorksiteDto>> CreateWorksite(CreateWorksiteDto createWorksiteDto)
        {
            _logger.LogInformation("Attempting to create new worksite with name: {Name}", createWorksiteDto.Name);
            var worksite = new Worksite
            {
                Id = Guid.NewGuid(),
                Name = createWorksiteDto.Name,
                Location = createWorksiteDto.Location,
                StartDate = createWorksiteDto.StartDate,
                Status = createWorksiteDto.Status,
                CreatedAt = DateTime.UtcNow // Explicitly set CreatedAt
            };

            _context.Worksites.Add(worksite);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created new worksite with ID: {WorksiteId}", worksite.Id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating worksite in database. Name: {Name}", createWorksiteDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error creating worksite in database.");
            }

            var worksiteDto = new WorksiteDto
            {
                Id = worksite.Id,
                Name = worksite.Name,
                Location = worksite.Location,
                StartDate = worksite.StartDate,
                Status = worksite.Status,
                CreatedAt = worksite.CreatedAt
            };
            return CreatedAtAction(nameof(GetWorksite), new { id = worksite.Id }, worksiteDto);
        }

        // PUT: api/worksites/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateWorksite(Guid id, UpdateWorksiteDto updateWorksiteDto)
        {
            _logger.LogInformation("Attempting to update worksite with ID: {Id}", id);
            var worksite = await _context.Worksites.FindAsync(id);

            if (worksite == null)
            {
                _logger.LogWarning("Update failed. Worksite with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Worksite with ID {id} not found for update." });
            }

            worksite.Name = updateWorksiteDto.Name;
            worksite.Location = updateWorksiteDto.Location;
            worksite.StartDate = updateWorksiteDto.StartDate;
            worksite.Status = updateWorksiteDto.Status;

            _context.Entry(worksite).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated worksite with ID: {WorksiteId}", worksite.Id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Worksites.Any(e => e.Id == id))
                {
                    _logger.LogWarning("Concurrency error: Worksite with ID {Id} was not found during update.", id);
                    return NotFound(new { Message = $"Concurrency error: Worksite with ID {id} not found." });
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating worksite with ID: {WorksiteId}", worksite.Id);
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Database error updating worksite with ID: {WorksiteId}", worksite.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating worksite in database.");
            }
            return NoContent();
        }

        // DELETE: api/worksites/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteWorksite(Guid id)
        {
            _logger.LogInformation("Attempting to delete worksite with ID: {Id}", id);
            var worksite = await _context.Worksites.FindAsync(id);
            if (worksite == null)
            {
                _logger.LogWarning("Delete failed. Worksite with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Worksite with ID {id} not found for deletion." });
            }

            _context.Worksites.Remove(worksite);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully deleted worksite with ID: {WorksiteId}", id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error deleting worksite with ID: {WorksiteId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting worksite from database.");
            }

            return NoContent();
        }
    }
}
