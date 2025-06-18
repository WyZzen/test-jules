using System;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos if you prefer
{
    public class ProfileDto
    {
        public Guid Id { get; set; }
        public string? FullName { get; set; }
        public string? Email { get; set; } // Email from profiles table
        public string? Role { get; set; }
        // Add any other fields you want to expose to the client from the profile
    }
}
