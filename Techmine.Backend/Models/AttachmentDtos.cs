using System;
using System.ComponentModel.DataAnnotations;

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    public class AttachmentDto
    {
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        public string Type { get; set; } = string.Empty; // "Forage" or "Minage"

        public string? FileName { get; set; } // Name of the uploaded file

        public string? FileUrl { get; set; } // URL if stored in Supabase Storage

        public DateTime CreatedAt { get; set; }

        // public Guid? ReportId { get; set; } // Uncomment if linking to reports
    }

    public class CreateAttachmentDto
    {
        [Required(ErrorMessage = "Attachment name is required.")]
        [StringLength(255, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 255 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Attachment type is required.")]
        [RegularExpression("^(Forage|Minage)$", ErrorMessage = "Type must be either 'Forage' or 'Minage'.")]
        public string Type { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "File name cannot exceed 255 characters.")]
        public string? FileName { get; set; } // To be populated from the uploaded file's name

        [Url(ErrorMessage = "File URL must be a valid URL.")]
        public string? FileUrl { get; set; } // To be populated after successful upload to storage

        // public Guid? ReportId { get; set; } // Uncomment if linking to reports
    }

    public class UpdateAttachmentDto
    {
        [Required(ErrorMessage = "Attachment name is required.")]
        [StringLength(255, MinimumLength = 3, ErrorMessage = "Name must be between 3 and 255 characters.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Attachment type is required.")]
        [RegularExpression("^(Forage|Minage)$", ErrorMessage = "Type must be either 'Forage' or 'Minage'.")]
        public string Type { get; set; } = string.Empty;

        [StringLength(255, ErrorMessage = "File name cannot exceed 255 characters.")]
        public string? FileName { get; set; }

        [Url(ErrorMessage = "File URL must be a valid URL.")]
        public string? FileUrl { get; set; }

        // public Guid? ReportId { get; set; } // Uncomment if linking to reports
    }
}
