using System;
using System.ComponentModel.DataAnnotations;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    public class ClientDto
    {
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? ContactPerson { get; set; }

        [EmailAddress(ErrorMessage = "Invalid Email Address")]
        public string? Email { get; set; }

        // Basic phone validation, can be made more complex if needed
        [RegularExpression(@"^\+?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid Phone Number")]
        public string? Phone { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public class CreateClientDto
    {
        [Required(ErrorMessage = "Client name is required.")]
        [StringLength(150, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 150 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(150, ErrorMessage = "Contact person name cannot exceed 150 characters.")]
        public string? ContactPerson { get; set; }

        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string? Email { get; set; }

        [RegularExpression(@"^\+?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid Phone Number")]
        [StringLength(50, ErrorMessage = "Phone number cannot exceed 50 characters.")]
        public string? Phone { get; set; }
    }

    public class UpdateClientDto
    {
        [Required(ErrorMessage = "Client name is required.")]
        [StringLength(150, MinimumLength = 2, ErrorMessage = "Name must be between 2 and 150 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(150, ErrorMessage = "Contact person name cannot exceed 150 characters.")]
        public string? ContactPerson { get; set; }

        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters.")]
        public string? Email { get; set; }

        [RegularExpression(@"^\+?[0-9\s\-\(\)]+$", ErrorMessage = "Invalid Phone Number")]
        [StringLength(50, ErrorMessage = "Phone number cannot exceed 50 characters.")]
        public string? Phone { get; set; }
    }
}
