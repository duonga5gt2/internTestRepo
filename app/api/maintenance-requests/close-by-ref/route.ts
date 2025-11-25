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

interface CloseMaintenanceByRefBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    targetCreatedAt: string; // which request
    resolutionNotes?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CloseMaintenanceByRefBody;

        if (!body.contact?.mobile) {
            return NextResponse.json(
                { error: 'contact.mobile is required' },
                { status: 400 },
            );
        }
        if (!body.targetCreatedAt) {
            return NextResponse.json(
                { error: 'targetCreatedAt is required' },
                { status: 400 },
            );
        }

        const result = await withTransaction(async (client) => {
            const params: any[] = [body.contact.mobile, body.targetCreatedAt];
            let idx = 2;
            let where = `c.mobile = $1 AND m.created_at = $2`;

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
        SELECT m.*
        FROM realestate.maintenance_requests m
        JOIN realestate.contacts c ON c.id = m.contact_id
        JOIN realestate.properties p ON p.id = m.property_id
        WHERE ${where}
        ORDER BY m.created_at ASC
        LIMIT 1
        `,
                params,
            );

            if (matches.length === 0) {
                return { maintenance: null };
            }

            const maintenance = matches[0];
            const resolvedNotes =
                body.resolutionNotes ??
                'Maintenance request marked completed via AI assistant.';

            const { rows: updated } = await client.query(
                `
        UPDATE realestate.maintenance_requests
        SET status = 'COMPLETED',
            notes = COALESCE($1, notes),
            updated_at = now()
        WHERE id = $2
        RETURNING *
        `,
                [resolvedNotes, maintenance.id],
            );

            return { maintenance: updated[0] };
        });

        if (!result.maintenance) {
            return NextResponse.json(
                { error: 'No matching maintenance request found for that reference' },
                { status: 404 },
            );
        }

        return NextResponse.json(
            { maintenanceRequest: result.maintenance },
            { status: 200 },
        );
    } catch (err) {
        console.error('Error closing maintenance request by ref', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
