using System.Net.Http.Json;
using System.Text.Json;
using System.Net;

namespace FarmBid.Api.Services;

public class GeminiService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GeminiService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> GenerateResponseAsync(
        string prompt,
        CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Gemini:ApiKey"];
        var model = _configuration["Gemini:Model"];

        if (string.IsNullOrWhiteSpace(apiKey))
            throw new InvalidOperationException(
                "Gemini API key is missing.");

        if (string.IsNullOrWhiteSpace(model))
            throw new InvalidOperationException(
                "Gemini model is missing.");

        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = prompt }
                    }
                }
            }
        };

    const int maxAttempts = 3;

    for (int attempt = 1; attempt <= maxAttempts; attempt++)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"v1beta/models/{model}:generateContent");

        request.Headers.Add("x-goog-api-key", apiKey);
        request.Content = JsonContent.Create(requestBody);

        using var response = await _httpClient.SendAsync(
            request, cancellationToken);

        var responseBody = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            using var document = JsonDocument.Parse(responseBody);

            return document.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString()
                ?? "Gemini returned an empty response.";
        }

        bool temporaryError =
            response.StatusCode == HttpStatusCode.ServiceUnavailable ||
            response.StatusCode == HttpStatusCode.TooManyRequests ||
            response.StatusCode == HttpStatusCode.BadGateway ||
            response.StatusCode == HttpStatusCode.GatewayTimeout;

        if (!temporaryError || attempt == maxAttempts)
        {
            throw new HttpRequestException(
                $"Gemini API error: {response.StatusCode}. " +
                responseBody);
        }

        await Task.Delay(
            TimeSpan.FromSeconds(Math.Pow(2, attempt)),
            cancellationToken);
    }

    throw new InvalidOperationException(
        "Gemini request failed after multiple attempts.");

    }
}
