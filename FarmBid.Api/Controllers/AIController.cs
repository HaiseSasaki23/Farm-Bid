
using Microsoft.AspNetCore.Mvc;
using FarmBid.Api.Services;

namespace FarmBid.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly GeminiService _geminiService;

    public AIController(GeminiService geminiService)
    {
        _geminiService = geminiService;
    }

    // Test if the API is running
    [HttpGet("status")]
    public IActionResult Status()
    {
        return Ok(new
        {
            success = true,
            message = "FarmBid API is running!"
        });
    }

    // Test Gemini connection
    [HttpPost("test")]
    public async Task<IActionResult> TestGemini(
        [FromBody] GeminiTestRequest request)
    {
        var result = await _geminiService.GenerateResponseAsync(
            request.Prompt);

        return Ok(new
        {
            success = true,
            response = result
        });
    }
}

public class GeminiTestRequest
{
    public string Prompt { get; set; } = string.Empty;
}
