import { NextResponse } from 'next/server';

export async function POST(request) {
  const { password } = await request.json();

  if (password === process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ success: true, token: password });
  }

  return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
}
