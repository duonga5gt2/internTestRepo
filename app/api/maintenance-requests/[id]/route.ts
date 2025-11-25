import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface MaintenancePatchBody {
    issueDescription?: string;
    priority?: string;  // e.g. LOW / MEDIUM / HIGH
    status?: MaintenanceStatus;
    notes?: string;
}

function parseIdOr400(idStr: string) {
    const id = Number(idStr);
    if (!Number.isInteger(id) || id <= 0) {
        return { error: 'Invalid id', id: null };
    }
    return { error: null, id };
}

// PATCH /api/maintenance-requests/:id
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

        const body = (await req.json()) as MaintenancePatchBody;

        const fields: string[] = [];
        const values: any[] = [];
        let i = 1;

        if (body.issueDescription) {
            fields.push(`issue_description = $${i++}`);
            values.push(body.issueDescription);
        }
        if (body.priority) {
            fields.push(`priority = $${i++}`);
            values.push(body.priority);
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
        UPDATE realestate.maintenance_requests
        SET ${fields.join(', ')}
        WHERE id = $${i}
        RETURNING *
      `,
            values,
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Maintenance request not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ maintenanceRequest: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error updating maintenance request', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

// DELETE /api/maintenance-requests/:id
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
        DELETE FROM realestate.maintenance_requests
        WHERE id = $1
        RETURNING *
      `,
            [id],
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Maintenance request not found' },
                { status: 404 },
            );
        }

        return NextResponse.json({ deleted: rows[0] }, { status: 200 });
    } catch (err) {
        console.error('Error deleting maintenance request', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
