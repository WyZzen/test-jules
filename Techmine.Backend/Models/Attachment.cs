using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Techmine.Backend.Models
{
    [Table("attachments")]
    public class Attachment
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("type")] // e.g., "Forage", "Minage"
        public string? Type { get; set; }

        [Column("file_url")] // URL to the file in Supabase Storage
        public string? FileUrl { get; set; }

        [Column("file_name")] // Original name of the uploaded file
        public string? FileName { get; set; }

        [Column("created_at")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; }

        // Optional: Foreign key to link to a Report
        // [Column("report_id")]
        // public Guid? ReportId { get; set; }
        // [ForeignKey("ReportId")]
        // public virtual Report? Report { get; set; }
    }
}
