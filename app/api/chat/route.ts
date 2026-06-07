import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { messages, system, fileContents } = body;

  const userMessage = messages[messages.length - 1];
  const history = messages.slice(0, -1);

  let userContent: unknown;
  if (fileContents && fileContents.length > 0) {
    userContent = [
      ...fileContents,
      { type: "text", text: `以下の${fileContents.length}件のファイルの内容を参照して回答してください。\n\n${userMessage.content}` }
    ];
  } else {
    userContent = userMessage.content;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system,
      messages: [...history, { role: "user", content: userContent }]
    })
  });

  const data = await res.json();
  return NextResponse.json(data);
}
