import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        timestamp: '2026-02-07T13:58:00Z',
        message: 'Server is responding and picking up new changes.'
    });
}
