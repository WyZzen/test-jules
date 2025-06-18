using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using Techmine.Backend.Models;
using Techmine.Backend.Services;

namespace Techmine.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All dashboard/recap data requires authentication
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(AppDbContext context, ILogger<DashboardController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/dashboard/homepage
        [HttpGet("homepage")]
        public async Task<ActionResult<HomePageDataDto>> GetHomePageData()
        {
            _logger.LogInformation("Fetching homepage data.");
            try
            {
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

                var recentReportsCount = await _context.Reports
                    .AsNoTracking()
                    .CountAsync(r => r.CreatedAt >= sevenDaysAgo);

                var openIncidentsCount = await _context.Incidents
                    .AsNoTracking()
                    .CountAsync(i => i.Status != null && i.Status.ToLower() == "open");

                var activeWorksitesCount = await _context.Worksites
                    .AsNoTracking()
                    .CountAsync(w => w.Status != null && w.Status.ToLower() == "active");

                var stats = new DashboardStatsDto
                {
                    RecentReportsCount = recentReportsCount,
                    OpenIncidentsCount = openIncidentsCount,
                    ActiveWorksitesCount = activeWorksitesCount
                };

                var recentReports = await _context.Reports
                    .AsNoTracking()
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5)
                    .Select(r => new ActivityItemDto {
                        Id = r.Id,
                        ItemType = "Report",
                        Title = r.Title,
                        ActivityDate = r.CreatedAt,
                        Status = r.Status
                    }).ToListAsync();

                var recentIncidents = await _context.Incidents
                    .AsNoTracking()
                    .OrderByDescending(i => i.CreatedAt) // Order by creation for recency
                    .Take(5)
                    .Select(i => new ActivityItemDto {
                        Id = i.Id,
                        ItemType = "Incident",
                        Title = i.Title,
                        ActivityDate = i.CreatedAt, // Using CreatedAt for consistent sorting key with reports
                        Status = i.Status
                    }).ToListAsync();

                var recentActivity = recentReports.Concat(recentIncidents)
                                       .OrderByDescending(a => a.ActivityDate)
                                       .Take(5) // Take top 5 overall after combining and sorting
                                       .ToList();

                return Ok(new HomePageDataDto { Stats = stats, RecentActivity = recentActivity });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching homepage data.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Internal server error while fetching homepage data." });
            }
        }

        // GET: api/dashboard/recap
        [HttpGet("recap")]
        public async Task<ActionResult<RecapPageDataDto>> GetRecapPageData()
        {
            _logger.LogInformation("Fetching recap page data.");
            try
            {
                var totalReports = await _context.Reports.AsNoTracking().CountAsync();
                var totalAttachments = await _context.Attachments.AsNoTracking().CountAsync(); // Metadata count
                var openIncidents = await _context.Incidents
                    .AsNoTracking()
                    .CountAsync(i => i.Status != null && i.Status.ToLower() == "open");

                return Ok(new RecapPageDataDto
                {
                    TotalReports = totalReports,
                    TotalAttachments = totalAttachments,
                    OpenIncidents = openIncidents
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching recap page data.");
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "Internal server error while fetching recap page data." });
            }
        }
    }
}
