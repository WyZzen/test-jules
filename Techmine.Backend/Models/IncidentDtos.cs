using System;
using System.ComponentModel.DataAnnotations;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    public class IncidentDto
    {
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        // Changed to DateTime to match entity and form page. Nullable if can be not set.
        public DateTime IncidentDate { get; set; }

        public string? Location { get; set; }

        public string? Severity { get; set; } // E.g., "Low", "Medium", "High"

        public string? ReportedBy { get; set; }

        public string? Status { get; set; } // E.g., "Open", "In Progress", "Resolved"

        public DateTime CreatedAt { get; set; }
    }

    public class CreateIncidentDto
    {
        [Required(ErrorMessage = "Incident title is required.")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Incident date is required.")]
        public DateTime IncidentDate { get; set; }

        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters.")]
        public string? Location { get; set; }

        [StringLength(50, ErrorMessage = "Severity cannot exceed 50 characters.")]
        public string? Severity { get; set; } // Consider an enum or predefined list

        [StringLength(100, ErrorMessage = "ReportedBy cannot exceed 100 characters.")]
        public string? ReportedBy { get; set; } // Could be auto-filled from user context later

        [Required(ErrorMessage = "Status is required.")]
        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string Status { get; set; } = "Open"; // Default status
    }

    public class UpdateIncidentDto
    {
        [Required(ErrorMessage = "Incident title is required.")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Incident date is required.")]
        public DateTime IncidentDate { get; set; }

        [StringLength(200, ErrorMessage = "Location cannot exceed 200 characters.")]
        public string? Location { get; set; }

        [StringLength(50, ErrorMessage = "Severity cannot exceed 50 characters.")]
        public string? Severity { get; set; }

        [StringLength(100, ErrorMessage = "ReportedBy cannot exceed 100 characters.")]
        public string? ReportedBy { get; set; }

        [Required(ErrorMessage = "Status is required.")]
        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string Status { get; set; } = string.Empty;
    }
}
