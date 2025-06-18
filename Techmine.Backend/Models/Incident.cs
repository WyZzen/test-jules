using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Techmine.Backend.Models
{
    [Table("incidents")]
    public class Incident
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        [Column("incident_date")]
        public DateTime IncidentDate { get; set; }

        [Column("location")]
        public string? Location { get; set; }

        [Column("severity")] // e.g., "Low", "Medium", "High"
        public string? Severity { get; set; }

        [Column("reported_by")] // Could be a user ID or just text
        public string? ReportedBy { get; set; }

        [Column("status")] // e.g., "Open", "In Progress", "Resolved"
        public string? Status { get; set; }

        [Column("created_at")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; }
    }
}
