import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Groq from "groq-sdk";

// Support both variable names: GROQ_API_KEY (new) and GOOGLE_GENERATIVE_AI_API_KEY (legacy fallback)
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

// Use Groq's vision-capable model (llama3-8b-8192 is text-only and cannot process images)
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const PROMPT = `You are an expert academic tutor. Analyze the lecture image(s) provided and return ONLY valid JSON with this exact structure:
{
  "summary": "A comprehensive markdown summary of the lecture content in 3-5 paragraphs",
  "flashcards": [
    {"front": "Question or concept", "back": "Answer or explanation"}
  ],
  "keyQuestions": ["Exam-style question 1", "Exam-style question 2"]
}

Requirements:
- summary: 3-5 detailed paragraphs in markdown, covering all key concepts
- flashcards: 5-10 cards covering the most important points
- keyQuestions: 3-7 exam-style questions a student should be able to answer

Return ONLY the JSON object, no markdown fences, no other text.`;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.user.isPremium)
    return NextResponse.json({ error: "Premium required" }, { status: 403 });

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (!files.length)
    return NextResponse.json({ error: "No images provided" }, { status: 400 });

  // Convert uploaded images to base64 data URLs for Groq vision
  const imageParts = await Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = file.type || "image/jpeg";
      return { base64, mimeType };
    })
  );

  try {
    const result = await groq.chat.completions.create({
      model: VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            ...imageParts.map((img) => ({
              type: "image_url" as const,
              image_url: {
                url: `data:${img.mimeType};base64,${img.base64}`,
              },
            })),
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.3,
    });

    const text = result.choices[0]?.message?.content ?? "";

    // Strip markdown code fences if present, then extract JSON
    const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("[AI/summarize] Groq error:", err?.message ?? err);
    return NextResponse.json(
      { error: err?.message || "AI request failed" },
      { status: 500 }
    );
  }
}
