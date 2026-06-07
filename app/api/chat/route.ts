import { NextResponse } from "next/server";
import { list } from "@vercel/blob";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

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
            const ext = name.split(".").pop()?.toLowerCase();

            if (ext === "pdf") {
              const base64 = Buffer.from(buffer).toString("base64");
              return {
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 },
              };
            } else if (ext === "docx") {
              const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
              return {
                type: "text",
                text: `【Wordファイル: ${name}】\n${result.value}`,
              };
            } else if (ext === "xlsx" || ext === "xls") {
              const wb = XLSX.read(buffer);
              const text = wb.SheetNames.map((sheetName) => {
                const ws = wb.Sheets[sheetName];
                return `【シート: ${sheetName}】\n${XLSX.utils.sheet_to_csv(ws)}`;
              }).join("\n\n");
              return {
                type: "text",
                text: `【Excelファイル: ${name}】\n${text}`,
              };
            } else if (ext === "pptx") {
              const text = await extractPptxText(buffer);
              return {
                type: "text",
                text: `【PowerPointファイル: ${name}】\n${text}`,
              };
            }
            return null;
          })
        )
      ).filter(Boolean);

      if (fileContents.length > 0) {
        userContent = [
          ...fileContents,
          {
            type: "text",
            text: `以下の${fileContents.length}件のファイルを参照して回答してください。\n\n${userMessage.content}`,
          },
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
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system,
        messages: [...history, { role: "user", content: userContent }],
      }),
    });

    const data = await res.json();
    if (data.type === "error" && data.error?.message?.includes("maximum of 100 PDF pages")) {
      return NextResponse.json({
        content: [{ type: "text", text: "このPDFは大きすぎます（100ページ以内にしてください）。" }],
      });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

async function extractPptxText(buffer: ArrayBuffer): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml$/))
    .sort();

  const texts = await Promise.all(
    slideFiles.map(async (slideFile, i) => {
      const xml = await zip.files[slideFile].async("text");
      const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) || [];
      const text = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ");
      return `スライド${i + 1}: ${text}`;
    })
  );
  return texts.join("\n");
}