using FarmBid.Api.Services;
using FarmBid.Api.Data;
using FarmBid.Api.Repositories;
using FarmBid.Api.Repositories.AI;
using FarmBid.Api.Services.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Microsoft.OpenApi;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


// DATABASE CONNECTION
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is missing.");

builder.Services.AddDbContext<FarmBidDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);


// CONTROLLERS
builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

// The Vite client runs on a different local origin during development. Keep
// browser access explicit instead of relying on a frontend proxy or disabling
// CORS globally.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FarmBidClient", policy =>
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});


// AUTHENTICATION SERVICES
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<EmailService>();

builder.Services.AddScoped<ListingRepository>();
builder.Services.AddScoped<ListingService>();

builder.Services.AddScoped<BidRepository>();
builder.Services.AddScoped<BidService>();

builder.Services.AddScoped<StatisticsRepository>();
builder.Services.AddScoped<MarketInsightsService>();

builder.Services.AddScoped<AIReportService>();


// JWT AUTHENTICATION
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is missing.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "JWT key must be at least 32 bytes long."
    );
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,

            ValidateAudience = true,
            ValidAudience = jwtAudience,

            ValidateLifetime = true,

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            ClockSkew = TimeSpan.FromMinutes(1),

            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.Name
        };
    });

builder.Services.AddAuthorization();


// SWAGGER WITH BEARER AUTHENTICATION
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "FarmBid.Api",
        Version = "v1",
        Description = "FarmBid Agricultural Marketplace and Bidding API"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token."
    });

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document)] = []
        });
});



// GEMINI AI SERVICE
builder.Services.AddHttpClient<GeminiService>(client =>
{
    client.BaseAddress = new Uri(
        "https://generativelanguage.googleapis.com/");

    client.Timeout = TimeSpan.FromMinutes(3);
});


// BUILD APPLICATION
var app = builder.Build();


// SWAGGER
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


// The HTTP launch profile is intentionally used by the Vite development
// server. Redirect only when an HTTPS endpoint is actually configured.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("FarmBidClient");

app.UseAuthentication();
app.UseAuthorization();


// MAP CONTROLLERS
app.MapControllers();

app.Run();
