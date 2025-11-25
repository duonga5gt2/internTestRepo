import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

type MaintenanceStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface ContactLookupInput {
    mobile: string;
    fullName?: string;
}

interface PropertyLookupInput {
    addressLine1?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
}

interface FindMaintenanceBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    openOnly?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as FindMaintenanceBody;

        if (!body.contact?.mobile) {
            return NextResponse.json(
                { error: 'contact.mobile is required' },
                { status: 400 },
            );
        }

        const params: any[] = [body.contact.mobile];
        let idx = 1;
        let where = `c.mobile = $${idx}`;

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
        if (body.openOnly) {
            where += ` AND m.status IN ('OPEN', 'IN_PROGRESS')`;
        }

        const { rows } = await query(
            `
      SELECT
        m.*,
        to_jsonb(c.*) AS contact,
        to_jsonb(p.*) AS property
      FROM realestate.maintenance_requests m
      JOIN realestate.contacts c ON c.id = m.contact_id
      JOIN realestate.properties p ON p.id = m.property_id
      WHERE ${where}
      ORDER BY m.created_at ASC
      `,
            params,
        );

        return NextResponse.json({ maintenanceRequests: rows }, { status: 200 });
    } catch (err) {
        console.error('Error finding maintenance requests for contact', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
