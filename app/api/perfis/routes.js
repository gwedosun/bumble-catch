// app/api/perfis/route.js
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { idade, altura, localizacao, objetivos, superswipe, beleza, profissao } = body;

    const result = await sql`
      INSERT INTO perfis (idade, altura, localizacao, objetivos, superswipe, beleza, profissao)
      VALUES (${idade}, ${altura}, ${localizacao}, ${objetivos}, ${superswipe}, ${beleza}, ${profissao})
      RETURNING *;
    `;

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { rows } = await sql`SELECT * FROM perfis ORDER BY id DESC;`;
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}