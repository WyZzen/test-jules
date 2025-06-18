using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations; // Not strictly needed for these DTOs but good practice if they evolve

namespace Techmine.Backend.Models // Or Techmine.Backend.Dtos
{
    public class DashboardStatsDto
    {
        public int RecentReportsCount { get; set; } // e.g., last 7 days
        public int OpenIncidentsCount { get; set; }
        public int ActiveWorksitesCount { get; set; }
    }

    public class ActivityItemDto
    {
        public Guid Id { get; set; }
        public string ItemType { get; set; } = string.Empty; // "Report" or "Incident"
        public string Title { get; set; } = string.Empty;
        public DateTime ActivityDate { get; set; }
        public string? Status { get; set; } // Optional, mainly for incidents
    }

    public class HomePageDataDto
    {
        public DashboardStatsDto Stats { get; set; } = new DashboardStatsDto();
        public List<ActivityItemDto> RecentActivity { get; set; } = new List<ActivityItemDto>();
    }

    public class RecapPageDataDto
    {
        public int TotalReports { get; set; }
        public int TotalAttachments { get; set; } // Metadata count
        public int OpenIncidents { get; set; }
        // Potentially more stats for recap page can be added here
    }
}
