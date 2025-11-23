import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, query } from '@/lib/db';
import {
  ContactInput,
  PropertyInput,
  upsertContact,
  upsertProperty,
} from '@/lib/repo';

type AppraisalType = 'SELLER' | 'LANDLORD';

interface AppraisalRequestBody {
  contact: ContactInput;
  property: PropertyInput;
  scheduledAt: string;          // ISO string
  appraisalType: AppraisalType; // SELLER | LANDLORD
  motivation?: string;
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
      FROM realestate.appraisals
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit],
    );

    return NextResponse.json({ appraisals: result.rows }, { status: 200 });
  } catch (err) {
    console.error('Error fetching appraisals', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AppraisalRequestBody;

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
    if (!body.scheduledAt || !body.appraisalType) {
      return NextResponse.json(
        { error: 'scheduledAt and appraisalType are required' },
        { status: 400 },
      );
    }

    const result = await withTransaction(async (client) => {
      const leadType =
        body.appraisalType === 'SELLER' ? 'SELLER' : 'LANDLORD';

      const contactId = await upsertContact(client, body.contact, leadType);
      const propertyId = await upsertProperty(client, body.property);

      const { rows: appraisals } = await client.query(
        `
        INSERT INTO realestate.appraisals
          (contact_id, property_id, appraisal_type,
           scheduled_at, status, motivation, notes)
        VALUES ($1, $2, $3, $4, 'BOOKED', $5, $6)
        RETURNING *
        `,
        [
          contactId,
          propertyId,
          body.appraisalType,
          body.scheduledAt,
          body.motivation ?? null,
          body.notes ?? null,
        ],
      );

      await client.query(
        `
        INSERT INTO realestate.leads
          (contact_id, property_id, lead_type, source, status, summary)
        VALUES ($1, $2, $3, 'AI_CALL', 'OPEN', $4)
        `,
        [
          contactId,
          propertyId,
          leadType,
          body.motivation ??
            'Owner requested appraisal via AI assistant.',
        ],
      );

      return appraisals[0];
    });

    return NextResponse.json({ appraisal: result }, { status: 201 });
  } catch (err) {
    console.error('Error creating appraisal', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
