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

interface CancelAppraisalByRefBody {
    contact: ContactLookupInput;
    property?: PropertyLookupInput;
    targetScheduledAt: string; // which appraisal
    reason?: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CancelAppraisalByRefBody;

        if (!body.contact?.mobile) {
            return NextResponse.json(
                { error: 'contact.mobile is required' },
                { status: 400 },
            );
        }
        if (!body.targetScheduledAt) {
            return NextResponse.json(
                { error: 'targetScheduledAt is required' },
                { status: 400 },
            );
        }

        const result = await withTransaction(async (client) => {
            const params: any[] = [body.contact.mobile, body.targetScheduledAt];
            let idx = 2;
            let where = `c.mobile = $1 AND a.scheduled_at = $2`;

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
        SELECT a.*
        FROM realestate.appraisals a
        JOIN realestate.contacts c ON c.id = a.contact_id
        JOIN realestate.properties p ON p.id = a.property_id
        WHERE ${where}
        ORDER BY a.scheduled_at ASC
        LIMIT 1
        `,
                params,
            );

            if (matches.length === 0) {
                return { appraisal: null };
            }

            const appraisal = matches[0];
            const cancelNotes =
                body.reason ?? 'Appraisal cancelled via AI assistant.';

            const { rows: updated } = await client.query(
                `
        UPDATE realestate.appraisals
        SET status = 'CANCELLED',
            notes = COALESCE($1, notes),
            updated_at = now()
        WHERE id = $2
        RETURNING *
        `,
                [cancelNotes, appraisal.id],
            );

            return { appraisal: updated[0] };
        });

        if (!result.appraisal) {
            return NextResponse.json(
                { error: 'No matching appraisal found for that reference' },
                { status: 404 },
            );
        }

        return NextResponse.json({ appraisal: result.appraisal }, { status: 200 });
    } catch (err) {
        console.error('Error cancelling appraisal by ref', err);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
