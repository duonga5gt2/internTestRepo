import { NextRequest, NextResponse } from 'next/server';
import { withTransaction, query } from '@/lib/db';
import {
  ContactInput,
  PropertyInput,
  upsertContact,
  upsertProperty,
} from '@/lib/repo';

type CallerRole = 'TENANT' | 'LANDLORD' | 'OTHER';
type Urgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';

interface MaintenanceBody {
  contact?: ContactInput;
  property?: PropertyInput;
  callerRole?: CallerRole;
  description: string;
  urgency?: Urgency;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Number(limitParam || '20') || 20, 100);

    const result = await query(
      `
      SELECT *
      FROM realestate.maintenance_requests
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [limit],
    );

    return NextResponse.json(
      { maintenanceRequests: result.rows },
      { status: 200 },
    );
  } catch (err) {
    console.error('Error fetching maintenance requests', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}



export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MaintenanceBody;

    if (!body.description) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 },
      );
    }

    const request = await withTransaction(async (client) => {
      let contactId: number | null = null;
      let propertyId: number | null = null;

      if (body.contact?.fullName && body.contact.mobile) {
        contactId = await upsertContact(
          client,
          body.contact,
          'TENANT',
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

      const callerRole: CallerRole = body.callerRole ?? 'TENANT';
      const urgency: Urgency = body.urgency ?? 'MEDIUM';

      const { rows } = await client.query(
        `
        INSERT INTO realestate.maintenance_requests
          (contact_id, property_id, caller_role,
           description, urgency, status)
        VALUES ($1, $2, $3, $4, $5, 'OPEN')
        RETURNING *
        `,
        [
          contactId,
          propertyId,
          callerRole,
          body.description,
          urgency,
        ],
      );

      return rows[0];
    });

    return NextResponse.json({ maintenanceRequest: request }, { status: 201 });
  } catch (err) {
    console.error('Error creating maintenance request', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
