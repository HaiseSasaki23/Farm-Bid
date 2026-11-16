
using FarmBid.Api.DTOs;
using FarmBid.Api.Models;
using FarmBid.Api.Repositories;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace FarmBid.Api.Services;

public class AuthService
{
    private readonly UserRepository _userRepository;
    private readonly EmailService _emailService;
    private readonly IConfiguration _configuration;

    private const int VerificationCodeExpiryMinutes = 10;
    private const int ResendCooldownSeconds = 60;

    private const int MaxVerificationAttempts = 5;

    public AuthService(
        UserRepository userRepository,
        EmailService emailService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<string> RegisterAsync(RegisterRequest request)
    {
        if (request.Role != UserRole.Farmer &&
            request.Role != UserRole.Buyer)
        {
            throw new ArgumentException("Invalid user role.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existingUser = await _userRepository.GetByEmailAsync(
            normalizedEmail
        );

        if (existingUser != null)
        {
            throw new InvalidOperationException(
                "Email is already registered."
            );
        }

        string passwordHash = BCrypt.Net.BCrypt.HashPassword(
            request.Password
        );

        string verificationCode = GenerateVerificationCode();

        var now = DateTime.UtcNow;

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = normalizedEmail,
            PasswordHash = passwordHash,
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
                ? null
                : request.PhoneNumber.Trim(),
            Role = request.Role,
            AccountStatus = AccountStatus.Pending,
            EmailVerificationCodeHash =
                BCrypt.Net.BCrypt.HashPassword(verificationCode),
            EmailVerificationExpiresAt =
                now.AddMinutes(VerificationCodeExpiryMinutes),
            EmailVerificationSentAt = now,
            EmailVerifiedAt = null,
            CreatedAt = now
        };

        await _userRepository.AddAsync(user);

        await _emailService.SendVerificationCodeAsync(
            user.Email,
            verificationCode
        );

        return "Registration successful. Please check your email for the verification code.";
    }

    public async Task<string> VerifyEmailAsync(
        string email,
        string verificationCode)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(
            normalizedEmail
        );

        if (user == null)
        {
            throw new InvalidOperationException(
                "Invalid email or verification code."
            );
        }

        if (user.EmailVerifiedAt != null)
        {
            throw new InvalidOperationException(
                "Email is already verified."
            );
        }

        if (user.AccountStatus != AccountStatus.Pending)
        {
            throw new InvalidOperationException(
                "This account cannot be verified."
            );
        }

        if (user.EmailVerificationAttempts >= MaxVerificationAttempts)
        {
            throw new InvalidOperationException(
                "Maximum verification attempts reached. Please request a new code."
            );
        }

        if (string.IsNullOrWhiteSpace(verificationCode) ||
            verificationCode.Length != 6 ||
            !verificationCode.All(char.IsDigit))
        {
            throw new ArgumentException(
                "Please enter a valid 6-digit verification code."
            );
        }

        if (string.IsNullOrWhiteSpace(user.EmailVerificationCodeHash) ||
            user.EmailVerificationExpiresAt == null ||
            user.EmailVerificationExpiresAt <= DateTime.UtcNow)
        {
            throw new InvalidOperationException(
                "Verification code has expired. Please request a new one."
            );
        }

        bool isCodeValid = BCrypt.Net.BCrypt.Verify(
            verificationCode,
            user.EmailVerificationCodeHash
        );

        if (!isCodeValid)
        {
            user.EmailVerificationAttempts++;

            if (user.EmailVerificationAttempts >= MaxVerificationAttempts)
            {
                user.EmailVerificationCodeHash = null;
                user.EmailVerificationExpiresAt = null;
            }

            await _userRepository.UpdateAsync(user);

            if (user.EmailVerificationAttempts >= MaxVerificationAttempts)
            {
                throw new InvalidOperationException(
                    "Maximum verification attempts reached. Please request a new code."
                );
            }

            throw new UnauthorizedAccessException(
                $"Incorrect verification code. {MaxVerificationAttempts - user.EmailVerificationAttempts} attempts remaining."
            );
        }

        if (!isCodeValid)
        {
            throw new UnauthorizedAccessException(
                "Incorrect verification code."
            );
        }

        user.EmailVerifiedAt = DateTime.UtcNow;
        user.AccountStatus = AccountStatus.Active;
        user.EmailVerificationAttempts = 0;

        user.EmailVerificationCodeHash = null;
        user.EmailVerificationExpiresAt = null;
        user.EmailVerificationSentAt = null;

        await _userRepository.UpdateAsync(user);

        return "Email verified successfully. Your account is now active.";
    }

    public async Task<string> ResendVerificationCodeAsync(string email)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(
            normalizedEmail
        );

        if (user == null)
        {
            throw new InvalidOperationException(
                "Account not found."
            );
        }

        if (user.EmailVerifiedAt != null)
        {
            throw new InvalidOperationException(
                "Email is already verified."
            );
        }

        if (user.AccountStatus != AccountStatus.Pending)
        {
            throw new InvalidOperationException(
                "This account cannot request a verification code."
            );
        }

        var now = DateTime.UtcNow;

        if (user.EmailVerificationSentAt.HasValue)
        {
            var elapsed = now - user.EmailVerificationSentAt.Value;

            if (elapsed.TotalSeconds < ResendCooldownSeconds)
            {
                var remainingSeconds = ResendCooldownSeconds -
                    (int)elapsed.TotalSeconds;

                throw new InvalidOperationException(
                    $"Please wait {remainingSeconds} seconds before requesting another code."
                );
            }
        }

        string verificationCode = GenerateVerificationCode();

        user.EmailVerificationCodeHash =
            BCrypt.Net.BCrypt.HashPassword(verificationCode);

        user.EmailVerificationAttempts = 0;

        user.EmailVerificationExpiresAt =
            now.AddMinutes(VerificationCodeExpiryMinutes);

        user.EmailVerificationSentAt = now;

        await _userRepository.UpdateAsync(user);

        await _emailService.SendVerificationCodeAsync(
            user.Email,
            verificationCode
        );

        return "A new verification code has been sent to your email.";
    }

    public async Task<string> LoginAsync(LoginRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _userRepository.GetByEmailAsync(
            normalizedEmail
        );

        if (user == null ||
            !BCrypt.Net.BCrypt.Verify(
                request.Password,
                user.PasswordHash))
        {
            throw new UnauthorizedAccessException(
                "Invalid email or password."
            );
        }

        if (user.EmailVerifiedAt == null ||
            user.AccountStatus != AccountStatus.Active)
        {
            throw new UnauthorizedAccessException(
                "Please verify your email before logging in."
            );
        }

        return GenerateJwtToken(user);
    }

    private string GenerateVerificationCode()
    {
        return RandomNumberGenerator
            .GetInt32(0, 1_000_000)
            .ToString("D6");
    }

    private string GenerateJwtToken(User user)
    {
        var key = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException(
                "JWT key is missing."
            );

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        var expirationMinutes =
            _configuration.GetValue<int>("Jwt:ExpirationMinutes");

        var securityKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(key)
        );

        var credentials = new SigningCredentials(
            securityKey,
            SecurityAlgorithms.HmacSha256
        );

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
