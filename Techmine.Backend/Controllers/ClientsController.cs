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
    [Authorize(Roles = "Admin")] // Clients are admin-managed
    public class ClientsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(AppDbContext context, ILogger<ClientsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/clients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClientDto>>> GetClients(
            [FromQuery] string? nameSearch)
        {
            _logger.LogInformation("Fetching clients. Name search: {NameSearch}", nameSearch);
            var query = _context.Clients.AsNoTracking();

            if (!string.IsNullOrEmpty(nameSearch))
            {
                query = query.Where(c => c.Name != null && c.Name.ToLower().Contains(nameSearch.ToLower()));
            }

            var clients = await query.OrderBy(c => c.Name).ToListAsync();

            var clientDtos = clients.Select(c => new ClientDto
            {
                Id = c.Id,
                Name = c.Name,
                ContactPerson = c.ContactPerson,
                Email = c.Email,
                Phone = c.Phone,
                CreatedAt = c.CreatedAt
            }).ToList();

            return Ok(clientDtos);
        }

        // GET: api/clients/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ClientDto>> GetClient(Guid id)
        {
            _logger.LogInformation("Fetching client with ID: {Id}", id);
            var client = await _context.Clients.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);

            if (client == null)
            {
                _logger.LogWarning("Client with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Client with ID {id} not found." });
            }

            var clientDto = new ClientDto
            {
                Id = client.Id,
                Name = client.Name,
                ContactPerson = client.ContactPerson,
                Email = client.Email,
                Phone = client.Phone,
                CreatedAt = client.CreatedAt
            };
            return Ok(clientDto);
        }

        // POST: api/clients
        [HttpPost]
        public async Task<ActionResult<ClientDto>> CreateClient(CreateClientDto createClientDto)
        {
            _logger.LogInformation("Attempting to create new client with name: {Name}", createClientDto.Name);
            var client = new Client
            {
                Id = Guid.NewGuid(),
                Name = createClientDto.Name,
                ContactPerson = createClientDto.ContactPerson,
                Email = createClientDto.Email,
                Phone = createClientDto.Phone,
                CreatedAt = DateTime.UtcNow // Explicitly set CreatedAt
            };

            _context.Clients.Add(client);

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully created new client with ID: {ClientId}", client.Id);
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, "Error creating client in database. Name: {Name}", createClientDto.Name);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error creating client in database.");
            }

            var clientDto = new ClientDto
            {
                Id = client.Id,
                Name = client.Name,
                ContactPerson = client.ContactPerson,
                Email = client.Email,
                Phone = client.Phone,
                CreatedAt = client.CreatedAt
            };
            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, clientDto);
        }

        // PUT: api/clients/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, UpdateClientDto updateClientDto)
        {
            _logger.LogInformation("Attempting to update client with ID: {Id}", id);
            var client = await _context.Clients.FindAsync(id);

            if (client == null)
            {
                _logger.LogWarning("Update failed. Client with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Client with ID {id} not found for update." });
            }

            client.Name = updateClientDto.Name;
            client.ContactPerson = updateClientDto.ContactPerson;
            client.Email = updateClientDto.Email;
            client.Phone = updateClientDto.Phone;

            _context.Entry(client).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully updated client with ID: {ClientId}", client.Id);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!_context.Clients.Any(e => e.Id == id))
                {
                    _logger.LogWarning("Concurrency error: Client with ID {Id} was not found during update.", id);
                    return NotFound(new { Message = $"Concurrency error: Client with ID {id} not found." });
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating client with ID: {ClientId}", client.Id);
                    throw;
                }
            }
            catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Database error updating client with ID: {ClientId}", client.Id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error updating client in database.");
            }
            return NoContent();
        }

        // DELETE: api/clients/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(Guid id)
        {
            _logger.LogInformation("Attempting to delete client with ID: {Id}", id);
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                _logger.LogWarning("Delete failed. Client with ID: {Id} not found.", id);
                return NotFound(new { Message = $"Client with ID {id} not found for deletion." });
            }

            _context.Clients.Remove(client);
            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Successfully deleted client with ID: {ClientId}", id);
            }
            catch (DbUpdateException ex)
            {
                 _logger.LogError(ex, "Error deleting client with ID: {ClientId}", id);
                return StatusCode(StatusCodes.Status500InternalServerError, "Error deleting client from database.");
            }

            return NoContent();
        }
    }
}
