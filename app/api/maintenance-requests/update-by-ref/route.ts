import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';

type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface ContactLookupInput {
    mobile: string;
}

interface PropertyLookupInput {
    addressLine1?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
}

interface UpdateMaintenanceByRefBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    targetCreatedAt: string;   // ISO timestamp of the original request
    issueDescription?: string;
    priority?: string;          // LOW / MEDIUM / HIGH
    status?: MaintenanceStatus;
    notes?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as UpdateMaintenanceByRefBody;

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
        if (
            !body.issueDescription &&
            !body.priority &&
            !body.status &&
            body.notes === undefined
        ) {
            return NextResponse.json(
                { error: 'No update fields provided' },
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

            const fields: string[] = [];
            const values: any[] = [];
            let u = 1;

            if (body.issueDescription) {
                fields.push(`issue_description = $${u++}`);
                values.push(body.issueDescription);
            }
            if (body.priority) {
                fields.push(`priority = $${u++}`);
                values.push(body.priority);
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
            values.push(maintenance.id);

            const { rows: updated } = await client.query(
                `
        UPDATE realestate.maintenance_requests
        SET ${fields.join(', ')}
        WHERE id = $${u}
        RETURNING *
        `,
                values,
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
        console.error('Error updating maintenance request by ref', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
