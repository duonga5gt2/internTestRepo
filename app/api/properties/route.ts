import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const limitParam = searchParams.get('limit');
        const limit = Math.min(Number(limitParam || '50') || 50, 200);

        const { rows } = await query(
            `
      SELECT
        p.*
      FROM realestate.properties p
      ORDER BY p.created_at DESC
      LIMIT $1
      `,
            [limit],
        );

        return NextResponse.json({ properties: rows }, { status: 200 });
    } catch (err) {
        console.error('Error fetching properties', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
