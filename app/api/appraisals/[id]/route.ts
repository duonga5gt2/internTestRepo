import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type AppraisalType = 'SELLER' | 'LANDLORD';
type AppraisalStatus = 'BOOKED' | 'CANCELLED' | 'COMPLETED' | 'PENDING';

interface AppraisalPatchBody {
    scheduledAt?: string;
    appraisalType?: AppraisalType;
    motivation?: string;
    notes?: string;
    status?: AppraisalStatus;
}

function parseIdOr400(idStr: string) {
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
        return { error: 'Invalid id', id: null };
    }
    return { error: null, id };
}

// PATCH /api/appraisals/:id
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

        const body = (await req.json()) as AppraisalPatchBody;

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.scheduledAt) {
            fields.push(`scheduled_at = $${i++}`);
            values.push(body.scheduledAt);
        }
        if (body.appraisalType) {
            fields.push(`appraisal_type = $${i++}`);
            values.push(body.appraisalType);
        }
        if (body.motivation !== undefined) {
            fields.push(`motivation = $${i++}`);
            values.push(body.motivation);
        }
        if (body.notes !== undefined) {
            fields.push(`notes = $${i++}`);
            values.push(body.notes);
        }
        if (body.status) {
            fields.push(`status = $${i++}`);
            values.push(body.status);
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
        UPDATE realestate.appraisals
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `,
            values,
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Appraisal not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ appraisal: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error updating appraisal', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// DELETE /api/appraisals/:id
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
        DELETE FROM realestate.appraisals
        WHERE id = $1
        RETURNING *
      `,
            [id],
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Appraisal not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ deleted: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error deleting appraisal', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
