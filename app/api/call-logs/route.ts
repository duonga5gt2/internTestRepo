import { NextRequest, NextResponse } from 'next/server';
import { withTransaction } from '@/lib/db';
import {
  ContactInput,
  PropertyInput,
  upsertContact,
  upsertProperty,
} from '@/lib/repo';

interface CallLogBody {
  externalCallId?: string;
  contactId?: number;
  contact?: ContactInput;
  property?: PropertyInput;
  callType?: string;   // e.g. INSPECTION_BOOKING
  startedAt?: string;  // ISO
  endedAt?: string;    // ISO
  transcript?: string;
  aiSummary?: string;
  outcome?: string;    // e.g. BOOKED_INSPECTION
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CallLogBody;

    const log = await withTransaction(async (client) => {
      let contactId = body.contactId ?? null;
      let propertyId: number | null = null;

      if (!contactId && body.contact?.fullName && body.contact.mobile) {
        contactId = await upsertContact(
          client,
          body.contact,
          'OTHER',
        );
      }

      if (
        body.property?.addressLine1 &&
        body.property.suburb &&
        body.property.state &&
        body.property.postcode
      ) {
        propertyId = await upsertProperty(client, body.property);
      }

      const { rows } = await client.query(
        `
        INSERT INTO realestate.call_logs
          (external_call_id, contact_id, property_id,
           call_type, started_at, ended_at, transcript,
           ai_summary, outcome)
        VALUES ($1, $2, $3, $4,
                COALESCE($5, NOW()),
                $6, $7, $8, $9)
        RETURNING *
        `,
        [
          body.externalCallId ?? null,
          contactId,
          propertyId,
          body.callType ?? null,
          body.startedAt ?? null,
          body.endedAt ?? null,
          body.transcript ?? null,
          body.aiSummary ?? null,
          body.outcome ?? null,
        ],
      );

      return rows[0];
    });

    return NextResponse.json({ callLog: log }, { status: 201 });
  } catch (err) {
    console.error('Error creating call log', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
