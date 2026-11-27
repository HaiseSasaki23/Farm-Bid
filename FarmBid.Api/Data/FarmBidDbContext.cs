
using FarmBid.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace FarmBid.Api.Data;

public class FarmBidDbContext : DbContext
{
    public FarmBidDbContext(DbContextOptions<FarmBidDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<CropCategory> CropCategories => Set<CropCategory>();
    public DbSet<Crop> Crops => Set<Crop>();
    public DbSet<HarvestingListing> HarvestingListings => Set<HarvestingListing>();
    public DbSet<Bid> Bids => Set<Bid>();
    public DbSet<ListingImage> ListingImages => Set<ListingImage>();
    public DbSet<AiAnalysis> AiAnalyses => Set<AiAnalysis>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<AiMarketReport> AiMarketReports => Set<AiMarketReport>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // USER
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("user");

            entity.HasKey(u => u.Id);

            entity.Property(u => u.Id)
                .HasColumnName("user_id");

            entity.Property(u => u.FullName)
                .HasColumnName("full_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(u => u.Email)
                .HasColumnName("email")
                .HasMaxLength(150)
                .IsRequired();

            entity.HasIndex(u => u.Email)
                .IsUnique();

            entity.Property(u => u.PasswordHash)
                .HasColumnName("password_hash")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(u => u.PhoneNumber)
                .HasColumnName("phone_number")
                .HasMaxLength(20);

            entity.Property(u => u.Role)
                .HasColumnName("role")
                .HasConversion<string>();

            entity.Property(u => u.AccountStatus)
                .HasColumnName("account_status")
                .HasConversion<string>();

            entity.Property(u => u.EmailVerificationCodeHash)
                .HasColumnName("email_verification_code_hash")
                .HasMaxLength(255);
            entity.Property(u => u.EmailVerificationAttempts)
                .HasColumnName("email_verification_attempts")
                .HasDefaultValue(0);

            entity.Property(u => u.EmailVerificationExpiresAt)
                .HasColumnName("email_verification_expires_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(u => u.EmailVerificationSentAt)
                .HasColumnName("email_verification_sent_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(u => u.EmailVerifiedAt)
                .HasColumnName("email_verified_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(u => u.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone");
        });

        // CROP CATEGORY
        modelBuilder.Entity<CropCategory>(entity =>
        {
            entity.ToTable("crop_category");

            entity.HasKey(c => c.Id);

            entity.Property(c => c.Id)
                .HasColumnName("category_id");

            entity.Property(c => c.CategoryName)
                .HasColumnName("category_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(c => c.CategoryName)
                .IsUnique();

            entity.Property(c => c.Description)
                .HasColumnName("description");
        });

        // CROP
        modelBuilder.Entity<Crop>(entity =>
        {
            entity.ToTable("crop");

            entity.HasKey(c => c.Id);

            entity.Property(c => c.Id)
                .HasColumnName("crop_id");

            entity.Property(c => c.CategoryId)
                .HasColumnName("category_id");

            entity.Property(c => c.CropName)
                .HasColumnName("crop_name")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(c => c.Description)
                .HasColumnName("description");

            entity.HasOne(c => c.Category)
                .WithMany(category => category.Crops)
                .HasForeignKey(c => c.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // HARVEST LISTING
        modelBuilder.Entity<HarvestingListing>(entity =>
        {
            entity.ToTable("harvest_listing");

            entity.HasKey(l => l.Id);

            entity.Property(l => l.Id)
                .HasColumnName("listing_id");

            entity.Property(l => l.FarmerId)
                .HasColumnName("farmer_id");

            entity.Property(l => l.CropId)
                .HasColumnName("crop_id");

            entity.Property(l => l.Quantity)
                .HasColumnName("quantity")
                .HasPrecision(12, 2);

            entity.Property(l => l.Unit)
                .HasColumnName("unit")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(l => l.QualityGrade)
                .HasColumnName("quality_grade")
                .HasMaxLength(50);

            entity.Property(l => l.StartingPrice)
                .HasColumnName("starting_price")
                .HasPrecision(12, 2);

            entity.Property(l => l.Location)
                .HasColumnName("location")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(l => l.HarvestDate)
                .HasColumnName("harvest_date")
                .HasColumnType("date");

            entity.Property(l => l.BidDeadline)
                .HasColumnName("bid_deadline")
                .HasColumnType("timestamp with time zone");

            entity.Property(l => l.Description)
                .HasColumnName("description");

            entity.Property(l => l.Status)
                .HasColumnName("status")
                .HasMaxLength(20)
                .HasDefaultValue("Active");

            entity.Property(l => l.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone");

            entity.HasOne(l => l.Farmer)
                .WithMany()
                .HasForeignKey(l => l.FarmerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Crop)
                .WithMany(c => c.HarvestingListings)
                .HasForeignKey(l => l.CropId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // BID
        modelBuilder.Entity<Bid>(entity =>
        {
            entity.ToTable("bid");

            entity.HasKey(b => b.Id);

            entity.Property(b => b.Id)
                .HasColumnName("bid_id");

            entity.Property(b => b.ListingId)
                .HasColumnName("listing_id");

            entity.Property(b => b.BuyerId)
                .HasColumnName("buyer_id");

            entity.Property(b => b.OfferedPrice)
                .HasColumnName("offered_price")
                .HasPrecision(12, 2);

            entity.Property(b => b.RequestedQuantity)
                .HasColumnName("requested_quantity")
                .HasPrecision(12, 2);

            entity.Property(b => b.Message)
                .HasColumnName("message");

            entity.Property(b => b.Status)
                .HasColumnName("status")
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            entity.Property(b => b.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(b => b.UpdatedAt)
                .HasColumnName("updated_at")
                .HasColumnType("timestamp with time zone");

            entity.HasOne(b => b.Listing)
                .WithMany(l => l.Bids)
                .HasForeignKey(b => b.ListingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Buyer)
                .WithMany()
                .HasForeignKey(b => b.BuyerId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // LISTING IMAGE
        modelBuilder.Entity<ListingImage>(entity =>
        {
            entity.ToTable("listing_image");

            entity.HasKey(i => i.Id);

            entity.Property(i => i.Id)
                .HasColumnName("image_id");

            entity.Property(i => i.ListingId)
                .HasColumnName("listing_id");

            entity.Property(i => i.ImageUrl)
                .HasColumnName("image_url")
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(i => i.UploadedAt)
                .HasColumnName("uploaded_at")
                .HasColumnType("timestamp with time zone");

            entity.HasOne(i => i.Listing)
                .WithMany(l => l.Images)
                .HasForeignKey(i => i.ListingId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AI ANALYSIS
        modelBuilder.Entity<AiAnalysis>(entity =>
        {
            entity.ToTable("ai_analysis");

            entity.HasKey(a => a.Id);

            entity.Property(a => a.Id)
                .HasColumnName("analysis_id");

            entity.Property(a => a.ListingId)
                .HasColumnName("listing_id");

            entity.Property(a => a.GeneratedBy)
                .HasColumnName("generated_by");

            entity.Property(a => a.AnalysisResult)
                .HasColumnName("analysis_result")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(a => a.GeneratedAt)
                .HasColumnName("generated_at")
                .HasColumnType("timestamp with time zone");

            entity.HasOne(a => a.Listing)
                .WithMany(l => l.AiAnalyses)
                .HasForeignKey(a => a.ListingId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.GeneratedByUser)
                .WithMany()
                .HasForeignKey(a => a.GeneratedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AI MARKET REPORT
        modelBuilder.Entity<AiMarketReport>(entity =>
        {
            entity.ToTable("ai_market_report");

            entity.HasKey(r => r.ReportId);

            entity.Property(r => r.ReportId)
                .HasColumnName("report_id");

            entity.Property(r => r.GeneratedBy)
                .HasColumnName("generated_by");

            entity.Property(r => r.ReportType)
                .HasColumnName("report_type")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(r => r.PeriodStart)
                .HasColumnName("period_start")
                .HasColumnType("date");

            entity.Property(r => r.PeriodEnd)
                .HasColumnName("period_end")
                .HasColumnType("date");

            entity.Property(r => r.ReportContent)
                .HasColumnName("report_content")
                .HasColumnType("text")
                .IsRequired();

            entity.Property(r => r.ModelName)
                .HasColumnName("model_name")
                .HasMaxLength(100);

            entity.Property(r => r.GeneratedAt)
                .HasColumnName("generated_at")
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(r => r.GeneratedByUser)
                .WithMany(u => u.GeneratedReports)
                .HasForeignKey(r => r.GeneratedBy)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TRANSACTION
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("transaction");

            entity.HasKey(t => t.Id);

            entity.Property(t => t.Id)
                .HasColumnName("transaction_id");

            entity.Property(t => t.BidId)
                .HasColumnName("bid_id");

            entity.HasIndex(t => t.BidId)
                .IsUnique();

            entity.Property(t => t.AgreedPrice)
                .HasColumnName("agreed_price")
                .HasPrecision(12, 2);

            entity.Property(t => t.AgreedQuantity)
                .HasColumnName("agreed_quantity")
                .HasPrecision(12, 2);

            entity.Property(t => t.TotalAmount)
                .HasColumnName("total_amount")
                .HasPrecision(12, 2);

            entity.Property(t => t.TransactionStatus)
                .HasColumnName("transaction_status")
                .HasMaxLength(20)
                .HasDefaultValue("Pending");

            entity.Property(t => t.CreatedAt)
                .HasColumnName("created_at")
                .HasColumnType("timestamp with time zone");

            entity.Property(t => t.CompletedAt)
                .HasColumnName("completed_at")
                .HasColumnType("timestamp with time zone");

            entity.HasOne(t => t.Bid)
                .WithOne(b => b.Transaction)
                .HasForeignKey<Transaction>(t => t.BidId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
