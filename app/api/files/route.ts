import { put, list, del } from "@vercel/blob";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { blobs } = await list();
    return NextResponse.json(blobs);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 200 });
  }
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = new Set(["pdf", "doc", "docx", "xls", "xlsx", "pptx"]);

function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/[^\w.\-]/g, "_")
    .slice(0, 200);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "ファイルサイズは50MB以内にしてください" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "対応していないファイル形式です" }, { status: 400 });
    }

    const safeName = sanitizeFilename(file.name);
    const blob = await put(safeName, file, { access: "public" });
    return NextResponse.json(blob);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { url } = await req.json();
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}


