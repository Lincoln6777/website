import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY not set");
  return new OpenAI({ apiKey: key });
}

const CATEGORIES = [
  "Dining",
  "Travel",
  "Software",
  "Office Supplies",
  "Marketing",
  "Other",
];

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'text'" },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expense categorizer. Reply with exactly one of: ${CATEGORIES.join(", ")}. No other text.`,
        },
        {
          role: "user",
          content: `Categorize this expense description: "${text.slice(0, 500)}"`,
        },
      ],
      max_tokens: 20,
    });

    const raw =
      completion.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, "") ?? "";
    const category = CATEGORIES.find(
      (c) => c.toLowerCase() === raw.toLowerCase()
    ) ?? "Other";

    return NextResponse.json({ category });
  } catch (e) {
    console.error("Categorize error", e);
    return NextResponse.json(
      { error: "Categorization failed", category: "Other" },
      { status: 200 }
    );
  }
}
