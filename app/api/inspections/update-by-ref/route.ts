import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

interface ContactLookupInput {
    mobile: string;
}

interface PropertyLookupInput {
    addressLine1?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
}

interface UpdateInspectionByRefBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    targetScheduledAt: string;   // original time (ISO) to match
    newScheduledAt?: string;     // new time (ISO)
    status?: string;
    notes?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as UpdateInspectionByRefBody;

        if (!body.contact?.mobile) {
            return NextResponse.json(
                { error: 'contact.mobile is required' },
                { status: 400 },
            );
        }
        if (!body.targetScheduledAt) {
            return NextResponse.json(
                { error: 'targetScheduledAt is required' },
                { status: 400 },
            );
        }
        if (
            !body.newScheduledAt &&
            !body.status &&
            body.notes === undefined
        ) {
            return NextResponse.json(
                { error: 'No update fields provided' },
                { status: 400 },
            );
        }

        const result = await withTransaction(async (client) => {
            const params: any[] = [
                body.contact.mobile,
                body.targetScheduledAt,
            ];
            let idx = 2;
            let where = `c.mobile = $1 AND i.scheduled_at = $2`;

            if (body.property?.addressLine1) {
                where += ` AND p.address_line1 ILIKE $${++idx}`;
                params.push(body.property.addressLine1);
            }
            if (body.property?.suburb) {
                where += ` AND p.suburb ILIKE $${++idx}`;
                params.push(body.property.suburb);
            }
            if (body.property?.state) {
                where += ` AND p.state = $${++idx}`;
                params.push(body.property.state);
            }
            if (body.property?.postcode) {
                where += ` AND p.postcode = $${++idx}`;
                params.push(body.property.postcode);
            }

            const { rows: matches } = await client.query(
                `
        SELECT i.*
        FROM realestate.inspections i
        JOIN realestate.contacts c ON c.id = i.contact_id
        JOIN realestate.properties p ON p.id = i.property_id
        WHERE ${where}
        ORDER BY i.scheduled_at ASC
        LIMIT 1
        `,
                params,
            );

            if (matches.length === 0) {
                return { inspection: null };
            }

            const inspection = matches[0];

            const fields: string[] = [];
            const values: any[] = [];
            let u = 1;

            if (body.newScheduledAt) {
                fields.push(`scheduled_at = $${u++}`);
                values.push(body.newScheduledAt);
            }
            if (body.status) {
                fields.push(`status = $${u++}`);
                values.push(body.status);
            }
            if (body.notes !== undefined) {
                fields.push(`notes = $${u++}`);
                values.push(body.notes);
            }

            fields.push('updated_at = now()');
            values.push(inspection.id);

            const { rows: updated } = await client.query(
                `
        UPDATE realestate.inspections
        SET ${fields.join(', ')}
        WHERE id = $${u}
        RETURNING *
        `,
                values,
            );

            return { inspection: updated[0] };
        });

        if (!result.inspection) {
            return NextResponse.json(
                { error: 'No matching inspection found for that reference' },
                { status: 404 },
            );
        }

        return NextResponse.json({ inspection: result.inspection }, { status: 200 });
    } catch (err) {
        console.error('Error updating inspection by ref', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
