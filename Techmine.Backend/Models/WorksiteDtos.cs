using System;
using System.ComponentModel.DataAnnotations;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    public class WorksiteDto
    {
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        public string? Location { get; set; }

        public DateTime? StartDate { get; set; }

        public string? Status { get; set; } // E.g., "Active", "Inactive", "Planned", "Completed", "On Hold"

        public DateTime CreatedAt { get; set; }
    }

    public class CreateWorksiteDto
    {
        [Required(ErrorMessage = "Worksite name is required.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 150 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "Location cannot exceed 300 characters.")]
        public string? Location { get; set; }

        public DateTime? StartDate { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string Status { get; set; } = string.Empty; // E.g., "Active", "Inactive", "Planned"
    }

    public class UpdateWorksiteDto
    {
        [Required(ErrorMessage = "Worksite name is required.")]
        [StringLength(150, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 150 characters.")]
        public string Name { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "Location cannot exceed 300 characters.")]
        public string? Location { get; set; }

        public DateTime? StartDate { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string Status { get; set; } = string.Empty;
    }
}
