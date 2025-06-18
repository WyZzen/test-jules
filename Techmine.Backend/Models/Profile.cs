using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Techmine.Backend.Models
{
    [Table("profiles")]
    public class Profile
    {
        [Key]
        [Column("id")] // This ID should match auth.users.id from Supabase
        public Guid Id { get; set; }

        [Column("full_name")]
        public string? FullName { get; set; }

        [Column("email")] // This might be redundant if auth.users.email is the source of truth
        public string? Email { get; set; }

        [Column("role")]
        public string? Role { get; set; } // e.g., "Admin", "User"

        [Column("created_at")] // Optional, if you track profile creation time separately
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; }

        // Add other profile-specific fields if any
    }
}
