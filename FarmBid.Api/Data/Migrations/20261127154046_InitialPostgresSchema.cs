using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FarmBid.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgresSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "crop_category",
                columns: table => new
                {
                    category_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_crop_category", x => x.category_id);
                });

            migrationBuilder.CreateTable(
                name: "user",
                columns: table => new
                {
                    user_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    full_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    email = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    phone_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    role = table.Column<string>(type: "text", nullable: false),
                    account_status = table.Column<string>(type: "text", nullable: false),
                    email_verification_code_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    email_verification_attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    email_verification_expires_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    email_verification_sent_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    email_verified_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user", x => x.user_id);
                });

            migrationBuilder.CreateTable(
                name: "crop",
                columns: table => new
                {
                    crop_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category_id = table.Column<long>(type: "bigint", nullable: false),
                    crop_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_crop", x => x.crop_id);
                    table.ForeignKey(
                        name: "FK_crop_crop_category_category_id",
                        column: x => x.category_id,
                        principalTable: "crop_category",
                        principalColumn: "category_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ai_market_report",
                columns: table => new
                {
                    report_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    generated_by = table.Column<long>(type: "bigint", nullable: false),
                    report_type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    period_start = table.Column<DateTime>(type: "date", nullable: false),
                    period_end = table.Column<DateTime>(type: "date", nullable: false),
                    report_content = table.Column<string>(type: "text", nullable: false),
                    model_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    generated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_market_report", x => x.report_id);
                    table.ForeignKey(
                        name: "FK_ai_market_report_user_generated_by",
                        column: x => x.generated_by,
                        principalTable: "user",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "harvest_listing",
                columns: table => new
                {
                    listing_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    farmer_id = table.Column<long>(type: "bigint", nullable: false),
                    crop_id = table.Column<long>(type: "bigint", nullable: false),
                    quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    unit = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    quality_grade = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    starting_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    harvest_date = table.Column<DateTime>(type: "date", nullable: false),
                    bid_deadline = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Active"),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_harvest_listing", x => x.listing_id);
                    table.ForeignKey(
                        name: "FK_harvest_listing_crop_crop_id",
                        column: x => x.crop_id,
                        principalTable: "crop",
                        principalColumn: "crop_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_harvest_listing_user_farmer_id",
                        column: x => x.farmer_id,
                        principalTable: "user",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ai_analysis",
                columns: table => new
                {
                    analysis_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    listing_id = table.Column<long>(type: "bigint", nullable: false),
                    generated_by = table.Column<long>(type: "bigint", nullable: false),
                    analysis_result = table.Column<string>(type: "text", nullable: false),
                    generated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_analysis", x => x.analysis_id);
                    table.ForeignKey(
                        name: "FK_ai_analysis_harvest_listing_listing_id",
                        column: x => x.listing_id,
                        principalTable: "harvest_listing",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ai_analysis_user_generated_by",
                        column: x => x.generated_by,
                        principalTable: "user",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "bid",
                columns: table => new
                {
                    bid_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    listing_id = table.Column<long>(type: "bigint", nullable: false),
                    buyer_id = table.Column<long>(type: "bigint", nullable: false),
                    offered_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    requested_quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    message = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bid", x => x.bid_id);
                    table.ForeignKey(
                        name: "FK_bid_harvest_listing_listing_id",
                        column: x => x.listing_id,
                        principalTable: "harvest_listing",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_bid_user_buyer_id",
                        column: x => x.buyer_id,
                        principalTable: "user",
                        principalColumn: "user_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "listing_image",
                columns: table => new
                {
                    image_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    listing_id = table.Column<long>(type: "bigint", nullable: false),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    uploaded_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_listing_image", x => x.image_id);
                    table.ForeignKey(
                        name: "FK_listing_image_harvest_listing_listing_id",
                        column: x => x.listing_id,
                        principalTable: "harvest_listing",
                        principalColumn: "listing_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "transaction",
                columns: table => new
                {
                    transaction_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    bid_id = table.Column<long>(type: "bigint", nullable: false),
                    agreed_price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    agreed_quantity = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    transaction_status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "Pending"),
                    created_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transaction", x => x.transaction_id);
                    table.ForeignKey(
                        name: "FK_transaction_bid_bid_id",
                        column: x => x.bid_id,
                        principalTable: "bid",
                        principalColumn: "bid_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ai_analysis_generated_by",
                table: "ai_analysis",
                column: "generated_by");

            migrationBuilder.CreateIndex(
                name: "IX_ai_analysis_listing_id",
                table: "ai_analysis",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "IX_ai_market_report_generated_by",
                table: "ai_market_report",
                column: "generated_by");

            migrationBuilder.CreateIndex(
                name: "IX_bid_buyer_id",
                table: "bid",
                column: "buyer_id");

            migrationBuilder.CreateIndex(
                name: "IX_bid_listing_id",
                table: "bid",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "IX_crop_category_id",
                table: "crop",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_crop_category_category_name",
                table: "crop_category",
                column: "category_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_harvest_listing_crop_id",
                table: "harvest_listing",
                column: "crop_id");

            migrationBuilder.CreateIndex(
                name: "IX_harvest_listing_farmer_id",
                table: "harvest_listing",
                column: "farmer_id");

            migrationBuilder.CreateIndex(
                name: "IX_listing_image_listing_id",
                table: "listing_image",
                column: "listing_id");

            migrationBuilder.CreateIndex(
                name: "IX_transaction_bid_id",
                table: "transaction",
                column: "bid_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_user_email",
                table: "user",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_analysis");

            migrationBuilder.DropTable(
                name: "ai_market_report");

            migrationBuilder.DropTable(
                name: "listing_image");

            migrationBuilder.DropTable(
                name: "transaction");

            migrationBuilder.DropTable(
                name: "bid");

            migrationBuilder.DropTable(
                name: "harvest_listing");

            migrationBuilder.DropTable(
                name: "crop");

            migrationBuilder.DropTable(
                name: "user");

            migrationBuilder.DropTable(
                name: "crop_category");
        }
    }
}
