using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Techmine.Backend.Models
{
    [Table("worksites")]
    public class Worksite
    {
        [Key]
        [Column("id")]
        public Guid Id { get; set; }

        [Required]
        [Column("name")]
        public string Name { get; set; } = string.Empty;

        [Column("location")]
        public string? Location { get; set; }

        [Column("start_date")]
        public DateTime? StartDate { get; set; }

        [Column("status")] // e.g., "Active", "Inactive", "Completed"
        public string? Status { get; set; }

        [Column("created_at")]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; }
    }
}
