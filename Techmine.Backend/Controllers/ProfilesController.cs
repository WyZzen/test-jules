using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Techmine.Backend.Models; // For ProfileDto and Profile entity
using Techmine.Backend.Services; // For AppDbContext

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All actions in this controller require authentication
    public class ProfilesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ProfilesController> _logger;

        public ProfilesController(AppDbContext context, ILogger<ProfilesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/profiles/me
        [HttpGet("me")]
        public async Task<ActionResult<ProfileDto>> GetMyProfile()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier); // Get 'sub' from JWT

            if (string.IsNullOrEmpty(userIdString))
            {
                _logger.LogWarning("User ID (sub claim / NameIdentifier) not found in token.");
                return Unauthorized("User ID not found in token. The 'sub' claim is missing or not mapped to NameIdentifier.");
            }

            if (!Guid.TryParse(userIdString, out Guid userId))
            {
                _logger.LogWarning("User ID (sub claim) from token '{UserIdString}' is not a valid GUID format.", userIdString);
                return BadRequest("User ID in token is not in a valid format.");
            }

            _logger.LogInformation("Attempting to fetch profile for authenticated user ID: {UserId}", userId);

            var profile = await _context.Profiles
                .AsNoTracking() // Read-only query, good practice for GET endpoints
                .FirstOrDefaultAsync(p => p.Id == userId);

            if (profile == null)
            {
                _logger.LogWarning("Profile not found in 'profiles' table for user ID: {UserId}. This user may not have a profile entry yet.", userId);
                // Returning 404 is appropriate if a profile record is expected to exist for every authenticated user.
                // The frontend AuthContext needs to handle this (e.g., treat user as having no specific role or a default guest role).
                return NotFound(new { Message = "Profile not found for the authenticated user. Please ensure a profile exists in the 'profiles' table matching the authenticated user ID." });
            }

            var profileDto = new ProfileDto
            {
                Id = profile.Id,
                FullName = profile.FullName,
                Email = profile.Email, // This is the email from the 'profiles' table, not necessarily the auth user's primary email
                Role = profile.Role
            };

            _logger.LogInformation("Successfully fetched profile for user ID: {UserId}. Role: {UserRole}", userId, profile.Role ?? "N/A");
            return Ok(profileDto);
        }
    }
}
