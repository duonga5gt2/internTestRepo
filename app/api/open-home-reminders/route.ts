import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, query } from '@/lib/db';
import {
  ContactInput,
  PropertyInput,
  upsertContact,
  upsertProperty,
} from '@/lib/repo';

interface OpenHomeReminderBody {
  contact: ContactInput;
  property: PropertyInput;
  openTime: string;     // ISO for open home
  reminderTime: string; // ISO for when to send reminder
}



export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Number(limitParam || '20') || 20, 100);

    const result = await query(
      `
      SELECT *
      FROM realestate.open_home_reminders
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit],
    );

    return NextResponse.json({ reminders: result.rows }, { status: 200 });
  } catch (err) {
    console.error('Error fetching open-home reminders', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as OpenHomeReminderBody;

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
    if (!body.openTime || !body.reminderTime) {
      return NextResponse.json(
        { error: 'openTime and reminderTime are required' },
        { status: 400 },
      );
    }

    const reminder = await withTransaction(async (client) => {
      const contactId = await upsertContact(client, body.contact, 'BUYER');
      const propertyId = await upsertProperty(client, body.property);

      const { rows } = await client.query(
        `
        INSERT INTO realestate.open_home_reminders
          (contact_id, property_id, open_time, reminder_time, status)
        VALUES ($1, $2, $3, $4, 'ACTIVE')
        RETURNING *
        `,
        [contactId, propertyId, body.openTime, body.reminderTime],
      );

      return rows[0];
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (err) {
    console.error('Error creating open-home reminder', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
