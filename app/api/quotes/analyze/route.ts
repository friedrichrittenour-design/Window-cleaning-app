import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  calculateQuote,
  DEFAULT_PRICING,
  type PricingConfig,
  type QuoteInput,
  type ServiceId,
} from "@/lib/pricing";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SERVICE_SCHEMA: Record<ServiceId, string> = {
  window_cleaning:
    '"window_cleaning": {"windows": {"small": <int>, "medium": <int>, "large": <int>}, "screens": <int, estimated number of window screens visible>, "notes": "<short note>"}',
  gutter_cleaning:
    '"gutter_cleaning": {"linear_feet": <int, estimated total linear feet of gutter visible>, "debris_level": "light"|"moderate"|"heavy", "notes": "<short note>"}',
  house_washing:
    '"house_washing": {"square_feet": <int, estimated exterior wall square footage visible>, "dirtiness": "light"|"moderate"|"heavy", "notes": "<short note>"}',
};

function buildPrompt(services: ServiceId[]): string {
  const sections = services.map((s) => SERVICE_SCHEMA[s]).join(",\n  ");

  return `You are an expert exterior-cleaning estimator. Look at the attached photo(s) of a house, porch, or building and estimate the following, based only on the services requested below.

Requested services: ${services.join(", ")}

Respond with ONLY strict JSON in this exact shape, no other text:
{
  ${sections},
  "stories_visible": <int>
}`;
}

function extractJson(text: string): any {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in model response");
  return JSON.parse(match[0]);
}

export async function POST(request: NextRequest) {
  const { quoteId } = await request.json();
  if (!quoteId) {
    return NextResponse.json({ error: "quoteId is required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", quoteId)
    .single();

  if (quoteError || !quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const services: ServiceId[] = quote.services ?? [];

  const { data: photoRows } = await supabase
    .from("quote_photos")
    .select("storage_path")
    .eq("quote_id", quoteId);

  if (!photoRows || photoRows.length === 0) {
    return NextResponse.json({ error: "No photos to analyze" }, { status: 400 });
  }

  const images = await Promise.all(
    photoRows.map(async (row: { storage_path: string }) => {
      const { data, error } = await supabase.storage
        .from("quote-photos")
        .download(row.storage_path);
      if (error || !data) throw new Error(`Could not download ${row.storage_path}`);
      const buffer = Buffer.from(await data.arrayBuffer());
      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: (data.type || "image/jpeg") as
            | "image/jpeg"
            | "image/png"
            | "image/webp"
            | "image/gif",
          data: buffer.toString("base64"),
        },
      };
    })
  );

  const { data: pricingRow } = await supabase
    .from("pricing_config")
    .select("*")
    .eq("id", 1)
    .single();

  const pricing: PricingConfig = pricingRow
    ? {
        windowCleaning: {
          small: {
            exterior: pricingRow.small_window_exterior_price,
            interiorExterior: pricingRow.small_window_interior_price,
          },
          medium: {
            exterior: pricingRow.medium_window_exterior_price,
            interiorExterior: pricingRow.medium_window_interior_price,
          },
          large: {
            exterior: pricingRow.large_window_exterior_price,
            interiorExterior: pricingRow.large_window_interior_price,
          },
          tiers: {
            basic: 0,
            plus_tracks: pricingRow.tier_plus_tracks_fee,
            premium: pricingRow.tier_premium_fee,
          },
          screensFee: pricingRow.screens_fee,
        },
        gutterCleaning: {
          pricePerLinearFoot: pricingRow.gutter_price_per_linear_foot,
          debrisMultipliers: {
            light: pricingRow.gutter_debris_light_multiplier,
            moderate: pricingRow.gutter_debris_moderate_multiplier,
            heavy: pricingRow.gutter_debris_heavy_multiplier,
          },
        },
        houseWashing: {
          pricePerSqFt: pricingRow.house_wash_price_per_sqft,
          dirtinessMultipliers: {
            light: pricingRow.house_wash_dirtiness_light_multiplier,
            moderate: pricingRow.house_wash_dirtiness_moderate_multiplier,
            heavy: pricingRow.house_wash_dirtiness_heavy_multiplier,
          },
        },
        storySurchargePerLevel: pricingRow.story_surcharge_per_level,
        minimumJobPrice: pricingRow.minimum_job_price,
      }
    : DEFAULT_PRICING;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const prompt = buildPrompt(services);

  let analysis: any = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2 && !analysis; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [...images, { type: "text", text: prompt }],
          },
        ],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      analysis = extractJson(textBlock?.type === "text" ? textBlock.text : "");
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  if (!analysis) {
    await supabase
      .from("quotes")
      .update({
        ai_analysis: {
          error: lastError ?? "Could not parse AI response",
          notes: "Automatic analysis failed — needs manual review.",
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteId);

    return NextResponse.json(
      { error: "AI analysis failed, flagged for manual review" },
      { status: 502 }
    );
  }

  const quoteInput: QuoteInput = {
    services,
    stories: quote.stories,
  };

  if (services.includes("window_cleaning") && analysis.window_cleaning) {
    quoteInput.window = {
      windowCounts: {
        small: Number(analysis.window_cleaning.windows?.small ?? 0),
        medium: Number(analysis.window_cleaning.windows?.medium ?? 0),
        large: Number(analysis.window_cleaning.windows?.large ?? 0),
      },
      cleaningType: quote.cleaning_type,
      serviceTier: quote.service_tier,
      addScreens: quote.add_screens,
      screenCount: Number(analysis.window_cleaning.screens ?? 0),
    };
  }

  if (services.includes("gutter_cleaning") && analysis.gutter_cleaning) {
    quoteInput.gutter = {
      linearFeet: Number(analysis.gutter_cleaning.linear_feet ?? 0),
      debrisLevel: analysis.gutter_cleaning.debris_level ?? "moderate",
    };
  }

  if (services.includes("house_washing") && analysis.house_washing) {
    quoteInput.houseWash = {
      squareFeet: Number(analysis.house_washing.square_feet ?? 0),
      dirtiness: analysis.house_washing.dirtiness ?? "moderate",
    };
  }

  const result = calculateQuote(quoteInput, pricing);

  await supabase
    .from("quotes")
    .update({
      ai_analysis: analysis,
      estimated_low: result.low,
      estimated_high: result.high,
      service_breakdown: result.perService,
      status: "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  return NextResponse.json({
    estimated_low: result.low,
    estimated_high: result.high,
    service_breakdown: result.perService,
  });
}
