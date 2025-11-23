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

    const result = await query(
      `
      SELECT *
      FROM realestate.inspections
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit],
    );

    return NextResponse.json({ inspections: result.rows }, { status: 200 });
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

    const result = await withTransaction(async (client) => {
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

      // Also create/attach a BUYER lead
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

    return NextResponse.json({ inspection: result }, { status: 201 });
  } catch (err) {
    console.error('Error creating inspection', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
