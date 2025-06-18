var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore; // For DbContext
using Techmine.Backend.Services; // For AppDbContext

// Configure Supabase JWT Authentication
var supabaseUrl = builder.Configuration["Supabase:Url"];
var supabaseJwtSecret = builder.Configuration["Supabase:JwtSecret"];

if (string.IsNullOrEmpty(supabaseUrl) || string.IsNullOrEmpty(supabaseJwtSecret))
{
    // Consider throwing an exception or logging a critical error if these are not set,
    // as authentication will not work. For now, we'll let it proceed and fail at runtime if used.
    Console.WriteLine("Warning: Supabase URL or JWT Secret is not configured in appsettings.json. JWT authentication will likely fail.");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Authority: Helps the middleware discover the .well-known/openid-configuration or jwks_uri
        // For Supabase, the auth URL itself can serve this purpose for issuer validation if setup correctly,
        // or you might point directly to the JWKS URI if using asymmetric keys.
        // If using symmetric secret, Authority might be less critical if Issuer is set explicitly.
        options.Authority = $"{supabaseUrl}/auth/v1"; // e.g., https://<your-project-ref>.supabase.co/auth/v1

        // Audience: The 'aud' claim in the Supabase JWT. Often 'authenticated' for logged-in users.
        options.Audience = "authenticated"; // Verify this against your Supabase JWTs

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(supabaseJwtSecret ?? string.Empty)), // Use empty string if null to avoid ArgumentNullException, though it will fail validation

            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1", // Or from token: "https://<project-ref>.supabase.co/auth/v1"

            ValidateAudience = true,
            ValidAudience = "authenticated", // Or from token: "authenticated"

            NameClaimType = "sub", // Maps JWT 'sub' claim to User.Identity.Name / ClaimTypes.NameIdentifier
            RoleClaimType = "role", // If your Supabase JWTs contain a 'role' claim directly
                                    // Often, roles are managed in a separate 'profiles' table and added as claims later.

            ClockSkew = TimeSpan.FromSeconds(5) // Tolerance for clock differences
        };

        // Optional: Event handlers for more control (e.g., OnTokenValidated)
        // options.Events = new JwtBearerEvents
        // {
        //     OnTokenValidated = context =>
        //     {
        //         // Custom logic after token validation (e.g., add custom claims from DB)
        //         return Task.CompletedTask;
        //     },
        //     OnAuthenticationFailed = context =>
        //     {
        //         Console.WriteLine("Authentication failed: " + context.Exception.Message);
        //         return Task.CompletedTask;
        //     }
        // };
    });

builder.Services.AddAuthorization();

// Configure DbContext for Supabase PostgreSQL
var connectionString = builder.Configuration.GetConnectionString("SupabaseDB");
if (string.IsNullOrEmpty(connectionString))
{
    Console.WriteLine("Warning: SupabaseDB connection string is not configured in appsettings.json. Database operations will fail.");
}
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();

// TODO: Configure CORS if the frontend and backend are served from different origins
// For development, a permissive policy might be okay. For production, be more restrictive.
app.UseCors(policy =>
    policy.AllowAnyHeader()
          .AllowAnyMethod()
          .WithOrigins(builder.Configuration["FrontendOrigin"] ?? "http://localhost:3000") // Allow frontend origin
          .AllowCredentials() // If your frontend sends credentials (e.g., cookies, auth headers)
);


app.UseAuthentication(); // IMPORTANT: Call UseAuthentication before UseAuthorization
app.UseAuthorization();

app.MapControllers();

app.Run();
