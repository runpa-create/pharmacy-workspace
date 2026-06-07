import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf") {
      return NextResponse.json({ error: "PDFファイルのみ対応しています" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "PDFは20MB以内にしてください" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: [
              { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } },
              {
                type: "text",
                text: `このPDFは薬学実務実習の年間日程表です。第Ⅰ期・第Ⅱ期・第Ⅲ期・第Ⅳ期それぞれの開始日と終了日を読み取り、必ず以下のJSON形式のみで返してください。他の文字は一切含めないでください。
[{"id":"p1","label":"第Ⅰ期","start":"YYYY-MM-DD","end":"YYYY-MM-DD"},{"id":"p2","label":"第Ⅱ期","start":"YYYY-MM-DD","end":"YYYY-MM-DD"},{"id":"p3","label":"第Ⅲ期","start":"YYYY-MM-DD","end":"YYYY-MM-DD"},{"id":"p4","label":"第Ⅳ期","start":"YYYY-MM-DD","end":"YYYY-MM-DD"}]`,
              },
            ],
          },
        ],
      }),
    });

    const data = await res.json();
    const text =
      data.content
        ?.filter((c: { type: string }) => c.type === "text")
        .map((c: { text: string }) => c.text)
        .join("") ?? "";

    return NextResponse.json({ text });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
