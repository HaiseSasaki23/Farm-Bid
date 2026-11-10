
using FarmBid.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Register controllers
builder.Services.AddControllers();

// Register Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register GeminiService
builder.Services.AddHttpClient<GeminiService>(client =>
{
    client.BaseAddress = new Uri(
        "https://generativelanguage.googleapis.com/");
});

var app = builder.Build();

// Enable Swagger in development
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapControllers();

app.Run();
