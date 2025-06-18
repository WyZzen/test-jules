using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Techmine.Backend.Models
{
    [Table("reports")] // Matches Supabase table name
    public class Report
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; } // Assuming UUIDs from Supabase are Guids

        [Required]
        [Column("title")]
        public string Title { get; set; } = string.Empty;

        [Column("description")]
        public string? Description { get; set; }

        // Name 'date' was used in frontend form, maps to 'report_date' in DB for clarity
        [Column("date")] // Assuming 'date' is the column name as per schema doc. If it's 'report_date', change here.
        public DateTime? ReportDate { get; set; }

        [Column("status")]
        public string? Status { get; set; }

        [Column("created_at")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Assuming Supabase handles this
        public DateTime CreatedAt { get; set; }

        // If reports are linked to users (e.g., via a user_id from the 'profiles' or 'auth.users' table)
        // [Column("user_id")]
        // public Guid? UserId { get; set; }
        // public virtual Profile? UserProfile { get; set; } // Navigation property
    }
}
