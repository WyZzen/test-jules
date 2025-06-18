using Microsoft.EntityFrameworkCore;
using Techmine.Backend.Models;

namespace Techmine.Backend.Services
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Report> Reports { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Incident> Incidents { get; set; }
        public DbSet<Worksite> Worksites { get; set; }
        public DbSet<Client> Clients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Example: If you want to enforce snake_case naming convention for all tables and columns
            // (and didn't want to use [Table] and [Column] attributes everywhere)
            // you could iterate through entities and properties here.
            // For now, attributes on models are used, which is clear and explicit.

            // Example of configuring a specific entity if not using attributes:
            // modelBuilder.Entity<Report>(entity =>
            // {
            //     entity.ToTable("reports");
            //     entity.Property(e => e.Id).HasColumnName("id");
            //     // ... other properties
            // });

            // If your Supabase tables use 'uuid' type for IDs and you want EF Core to generate them:
            // modelBuilder.Entity<Report>().Property(e => e.Id).HasDefaultValueSql("gen_random_uuid()");
            // (This is often handled by Supabase itself if 'id' is a PK with default gen_random_uuid())

            // Ensure `created_at` columns are handled correctly by the database (e.g., default value)
            // The [DatabaseGenerated(DatabaseGeneratedOption.Identity)] attribute on models
            // combined with Supabase 'DEFAULT now()' on timestampz columns usually works.
            // Or, ensure CreatedAt is set in application code before saving if not DB generated.
             modelBuilder.Entity<Report>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            modelBuilder.Entity<Profile>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            modelBuilder.Entity<Attachment>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            modelBuilder.Entity<Incident>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            modelBuilder.Entity<Worksite>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");
            modelBuilder.Entity<Client>()
                .Property(b => b.CreatedAt)
                .HasDefaultValueSql("now() at time zone 'utc'");

        }
    }
}
