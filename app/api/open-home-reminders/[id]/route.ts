import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type ReminderStatus = 'PENDING' | 'SENT' | 'CANCELLED';

interface ReminderPatchBody {
    openHomeTime?: string;  // ISO string
    channel?: string;       // e.g. SMS / EMAIL
    status?: ReminderStatus;
    notes?: string;
}

function parseIdOr400(idStr: string) {
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
        return { error: 'Invalid id', id: null };
    }
    return { error: null, id };
}

// PATCH /api/open-home-reminders/:id
export async function PATCH(
    req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await ctx.params
        const { error, id } = parseIdOr400(idParam);
        if (error || id === null) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const body = (await req.json()) as ReminderPatchBody;

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.openHomeTime) {
            fields.push(`open_home_time = $${i++}`);
            values.push(body.openHomeTime);
        }
        if (body.channel) {
            fields.push(`channel = $${i++}`);
            values.push(body.channel);
        }
        if (body.status) {
            fields.push(`status = $${i++}`);
            values.push(body.status);
        }
        if (body.notes !== undefined) {
            fields.push(`notes = $${i++}`);
            values.push(body.notes);
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
        UPDATE realestate.open_home_reminders
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `,
            values,
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Open-home reminder not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ reminder: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error updating open-home reminder', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// DELETE /api/open-home-reminders/:id
export async function DELETE(
    _req: NextRequest,
    ctx: { params: Promise<{ id: string }> },
) {
    try {
        const { id: idParam } = await ctx.params
        const { error, id } = parseIdOr400(idParam);
        if (error || id === null) {
            return NextResponse.json({ error }, { status: 400 });
        }

        const { rows } = await query(
            `
        DELETE FROM realestate.open_home_reminders
        WHERE id = $1
        RETURNING *
      `,
            [id],
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Open-home reminder not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ deleted: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error deleting open-home reminder', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
