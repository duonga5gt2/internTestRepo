import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface CallLogPatchBody {
    outcome?: string;  // e.g. SUCCESS / NO_ANSWER / VOICEMAIL
    notes?: string;
    metadata?: Record<string, unknown>;
}

function parseIdOr400(idStr: string) {
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
        return { error: 'Invalid id', id: null };
    }
    return { error: null, id };
}

// PATCH /api/call-logs/:id
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { error, id } = parseIdOr400(params.id);
        if (error || id === null) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const body = (await req.json()) as CallLogPatchBody;

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.outcome) {
            fields.push(`outcome = $${i++}`);
            values.push(body.outcome);
        }
        if (body.notes !== undefined) {
            fields.push(`notes = $${i++}`);
            values.push(body.notes);
        }
        if (body.metadata !== undefined) {
            fields.push(`metadata = $${i++}`);
            values.push(body.metadata);
        }

        if (fields.length === 0) {
            return NextResponse.json(
                { error: 'No updatable fields provided' },
                { status: 400 },
            );
        }

        fields.push('updated_at = now()');
        values.push(id);

        const { rows } = await query(
            `
        UPDATE realestate.call_logs
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `,
            values,
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Call log not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ callLog: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error updating call log', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// DELETE /api/call-logs/:id
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } },
) {
    try {
        const { error, id } = parseIdOr400(params.id);
        if (error || id === null) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const { rows } = await query(
            `
        DELETE FROM realestate.call_logs
        WHERE id = $1
        RETURNING *
      `,
            [id],
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Call log not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ deleted: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error deleting call log', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
