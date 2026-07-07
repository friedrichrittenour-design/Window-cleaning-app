import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { calculateQuote, DEFAULT_PRICING, type PricingConfig } from "@/lib/pricing";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const ANALYSIS_PROMPT = `You are an expert window-cleaning estimator. Look at the attached photo(s) of a house, porch, or building and estimate:
- the number of windows visible, classified as "small", "medium", or "large"
- the number of stories visible
- any complexity notes (e.g. bay windows, hard-to-reach areas, heavy dirt/hard water staining)

Respond with ONLY strict JSON in this exact shape, no other text:
{"windows": {"small": <int>, "medium": <int>, "large": <int>}, "stories_visible": <int>, "notes": "<one or two sentence summary>"}`;

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
        small: pricingRow.small_window_price,
        medium: pricingRow.medium_window_price,
        large: pricingRow.large_window_price,
        interiorMultiplier: pricingRow.interior_multiplier,
        storySurchargePerLevel: pricingRow.story_surcharge_per_level,
        tiers: {
          basic: 0,
          plus_tracks: pricingRow.tier_plus_tracks_fee,
          premium: pricingRow.tier_premium_fee,
        },
        screensFee: pricingRow.screens_fee,
        minimumJobPrice: pricingRow.minimum_job_price,
      }
    : DEFAULT_PRICING;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let analysis: any = null;
  let lastError: string | null = null;

  for (let attempt = 0; attempt < 2 && !analysis; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: [...images, { type: "text", text: ANALYSIS_PROMPT }],
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

  const windowCounts = {
    small: Number(analysis.windows?.small ?? 0),
    medium: Number(analysis.windows?.medium ?? 0),
    large: Number(analysis.windows?.large ?? 0),
  };

  const result = calculateQuote(
    {
      windowCounts,
      stories: quote.stories,
      cleaningType: quote.cleaning_type,
      serviceTier: quote.service_tier,
      addScreens: quote.add_screens,
    },
    pricing
  );

  await supabase
    .from("quotes")
    .update({
      ai_analysis: analysis,
      estimated_low: result.low,
      estimated_high: result.high,
      status: "quoted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", quoteId);

  return NextResponse.json({
    estimated_low: result.low,
    estimated_high: result.high,
  });
}
