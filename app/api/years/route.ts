import { sql, initDB } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  await initDB();
  const rows = await sql`SELECT academic_year, data FROM year_data ORDER BY academic_year DESC`;
  const result: Record<number, unknown> = {};
  rows.forEach((r) => { result[r.academic_year] = r.data; });
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  await initDB();
  const body = await req.json();
  const { academicYear, data } = body;
  await sql`
    INSERT INTO year_data (academic_year, data)
    VALUES (${academicYear}, ${JSON.stringify(data)})
    ON CONFLICT (academic_year)
    DO UPDATE SET data = ${JSON.stringify(data)}, updated_at = NOW()
  `;
  return NextResponse.json({ ok: true });
}
