import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

interface FindInspectionsBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    upcomingOnly?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as FindInspectionsBody;

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
        if (body.upcomingOnly) {
            where += ` AND i.scheduled_at >= now()`;
        }

        const { rows } = await query(
            `
      SELECT
        i.*,
        to_jsonb(c.*) AS contact,
        to_jsonb(p.*) AS property
      FROM realestate.inspections i
      JOIN realestate.contacts c ON c.id = i.contact_id
      JOIN realestate.properties p ON p.id = i.property_id
      WHERE ${where}
      ORDER BY i.scheduled_at ASC
      `,
            params,
        );

        return NextResponse.json({ inspections: rows }, { status: 200 });
    } catch (err) {
        console.error('Error finding inspections for contact', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
