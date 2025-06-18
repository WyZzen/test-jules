using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Linq;

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthTestController : ControllerBase
    {
        [HttpGet("me")]
        [Authorize] // This endpoint will require a valid JWT
        public IActionResult GetMyInfo()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); // From "sub" claim due to NameClaimType mapping
            var email = User.FindFirstValue(ClaimTypes.Email); // Only if 'email' claim exists in JWT
            var role = User.FindFirstValue(ClaimTypes.Role);   // Only if 'role' claim exists in JWT (and RoleClaimType mapped)

            // For Supabase, 'sub' is the user_id. Other standard claims might not be present by default.
            // Custom claims like 'role' usually come from custom JWT minting or via profile fetching post-auth.

            var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();

            if (string.IsNullOrEmpty(userId))
            {
                // This might happen if the 'sub' claim is not found or not mapped correctly.
                return Unauthorized(new { Message = "User ID (sub claim) not found in token." });
            }

            return Ok(new {
                UserId = userId,
                Email = email, // Will be null if not in token
                Role = role,   // Will be null if not in token
                Message = "You are authenticated!",
                AllClaims = claims
            });
        }

        [HttpGet("public")]
        public IActionResult GetPublicInfo()
        {
            return Ok(new { Message = "This is public info, accessible by anyone." });
        }

        // Example of an admin-only endpoint using role-based authorization
        // This requires the 'role' claim to be present in the JWT and correctly mapped.
        // Or, a custom authorization policy.
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")] // Requires "Admin" role
        public IActionResult GetAdminInfo()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Ok(new {
                UserId = userId,
                Message = "Welcome, Admin! This is admin-only info."
            });
        }
    }
}
