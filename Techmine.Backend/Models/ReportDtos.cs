using System;
using System.ComponentModel.DataAnnotations;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    // DTO for returning report details
    public class ReportDto
    {
        public Guid Id { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime? ReportDate { get; set; } // Matches Report.ReportDate (which maps to 'date' or 'report_date' in DB)

        public string? Status { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    // DTO for creating a new report
    public class CreateReportDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string? Description { get; set; }

        public DateTime? ReportDate { get; set; }

        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string? Status { get; set; }
        // CreatedAt and Id will be set by the server/database
    }

    // DTO for updating an existing report
    public class UpdateReportDto
    {
        [Required(ErrorMessage = "Title is required.")]
        [StringLength(200, MinimumLength = 3, ErrorMessage = "Title must be between 3 and 200 characters.")]
        public string Title { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
        public string? Description { get; set; }

        public DateTime? ReportDate { get; set; }

        [StringLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
        public string? Status { get; set; }
    }
}
