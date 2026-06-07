import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, system, fileNames } = body;

    const userMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1);

    let userContent: unknown = userMessage.content;

    if (fileNames && fileNames.length > 0) {
      const { blobs } = await list();
      const fileContents = (
        await Promise.all(
          fileNames.map(async (name: string) => {
            const blob = blobs.find((b) => b.pathname === name);
            if (!blob) return null;
            const res = await fetch(blob.url);
            const buffer = await res.arrayBuffer();
            const base64 = Buffer.from(buffer).toString("base64");
            return {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            };
          })
        )
      ).filter(Boolean);

      if (fileContents.length > 0) {
        userContent = [
          ...fileContents,
          { type: "text", text: `以下の${fileContents.length}件のPDFを参照して回答してください。\n\n${userMessage.content}` },
        ];
      }
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system,
        messages: [...history, { role: "user", content: userContent }],
      }),
    });

    const data = await res.json();
    if (data.type === "error" && data.error?.message?.includes("maximum of 100 PDF pages")) {
  return NextResponse.json({
    content: [{ type: "text", text: "このPDFは大きすぎます（100ページ以内にしてください）。" }]
  });
}
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}