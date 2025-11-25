import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface InspectionPatchBody {
    scheduledAt?: string;   // ISO string
    status?: string;        // e.g. BOOKED / CANCELLED / COMPLETED
    notes?: string;
}

function parseIdOr400(idStr: string) {
    const id = Number(idStr);
    console.log(id)
    if (!Number.isInteger(id) || id <= 0) {
        return { error: 'Invalid id', id: null };
    }
    return { error: null, id };
}

// PATCH /api/inspections/:id
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

        const body = (await req.json()) as InspectionPatchBody;

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.scheduledAt) {
            fields.push(`scheduled_at = $${i++}`);
            values.push(body.scheduledAt);
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
        UPDATE realestate.inspections
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `,
            values,
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Inspection not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ inspection: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error updating inspection', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// DELETE /api/inspections/:id
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
        DELETE FROM realestate.inspections
        WHERE id = $1
        RETURNING *
      `,
            [id],
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Inspection not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ deleted: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error deleting inspection', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
