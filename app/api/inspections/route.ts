import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, query } from '@/lib/db';
import {
  ContactInput,
  PropertyInput,
  upsertContact,
  upsertProperty,
} from '@/lib/repo';

interface InspectionRequestBody {
  contact: ContactInput;
  property: PropertyInput;
  scheduledAt: string; // ISO string
  notes?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Number(limitParam || '20') || 20, 100);

    const mobile = searchParams.get('mobile') ?? undefined;
    const suburb = searchParams.get('suburb') ?? undefined;
    const state = searchParams.get('state') ?? undefined;

    const params: any[] = [limit];
    let where = '1=1';
    let idx = 1;
    if (mobile) {
      where += ` AND c.mobile = $${++idx}`;
      params.push(mobile);
    }
    if (suburb) {
      where += ` AND p.suburb ILIKE $${++idx}`;
      params.push(suburb);
    }
    if (state) {
      where += ` AND p.state = $${++idx}`;
      params.push(state);
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
      ORDER BY i.scheduled_at DESC
      LIMIT $1
      `,
      params,
    );

    return NextResponse.json({ inspections: rows }, { status: 200 });
  } catch (err) {
    console.error('Error fetching inspections', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InspectionRequestBody;
    console.log(body)
    if (!body.contact?.fullName || !body.contact?.mobile) {
      return NextResponse.json(
        { error: 'contact.fullName and contact.mobile are required' },
        { status: 400 },
      );
    }
    if (
      !body.property?.addressLine1 ||
      !body.property?.suburb ||
      !body.property?.state ||
      !body.property?.postcode
    ) {
      return NextResponse.json(
        { error: 'property addressLine1, suburb, state, postcode are required' },
        { status: 400 },
      );
    }
    if (!body.scheduledAt) {
      return NextResponse.json(
        { error: 'scheduledAt is required (ISO string)' },
        { status: 400 },
      );
    }

    const inspection = await withTransaction(async (client) => {
      const contactId = await upsertContact(client, body.contact, 'BUYER');
      const propertyId = await upsertProperty(client, body.property);

      const { rows: inspections } = await client.query(
        `
        INSERT INTO realestate.inspections
          (contact_id, property_id, scheduled_at, status, source, notes)
        VALUES ($1, $2, $3, 'BOOKED', 'AI_CALL', $4)
        RETURNING *
        `,
        [contactId, propertyId, body.scheduledAt, body.notes ?? null],
      );

      await client.query(
        `
        INSERT INTO realestate.leads
          (contact_id, property_id, lead_type, source, status, summary)
        VALUES ($1, $2, 'BUYER', 'AI_CALL', 'OPEN', $3)
        `,
        [
          contactId,
          propertyId,
          body.notes ??
          'Buyer booked inspection via AI assistant.',
        ],
      );

      return inspections[0];
    });

    return NextResponse.json({ inspection }, { status: 201 });
  } catch (err) {
    console.error('Error creating inspection', err);
    return NextResponse.json(
      { error: 'Internal server error', time: Date.now() },
      { status: 500 },
    );
  }
}
