// lib/repo.ts
import { PoolClient } from 'pg';

export type LeadType = 'BUYER' | 'SELLER' | 'LANDLORD' | 'TENANT' | 'OTHER';

export interface ContactInput {
  fullName: string;
  mobile: string;
  email?: string;
  leadType?: LeadType;
}

export interface PropertyInput {
  addressLine1: string;
  suburb: string;
  state: string;
  postcode: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
}

// Upsert contact by mobile OR email
export async function upsertContact(
  client: PoolClient,
  input: ContactInput,
  defaultLeadType: LeadType,
): Promise<number> {
  const leadType = input.leadType ?? defaultLeadType;

  const { rows: existing } = await client.query<{ id: number }>(
    `
    SELECT id
    FROM realestate.contacts
    WHERE mobile = $1
       OR (email IS NOT NULL AND email = COALESCE($2, email))
    LIMIT 1
    `,
    [input.mobile, input.email ?? null],
  );

  if (existing.length > 0) {
    const id = existing[0].id;

    await client.query(
      `
      UPDATE realestate.contacts
         SET full_name = $1,
             email = COALESCE($2, email),
             lead_type = COALESCE($3, lead_type),
             updated_at = NOW()
       WHERE id = $4
      `,
      [input.fullName, input.email ?? null, leadType, id],
    );

    return id;
  }

  const { rows } = await client.query<{ id: number }>(
    `
    INSERT INTO realestate.contacts (full_name, mobile, email, lead_type)
    VALUES ($1, $2, $3, $4)
    RETURNING id
    `,
    [input.fullName, input.mobile, input.email ?? null, leadType],
  );

  return rows[0].id;
}

// Upsert property by address
export async function upsertProperty(
  client: PoolClient,
  input: PropertyInput,
): Promise<number> {
  const { rows: existing } = await client.query<{ id: number }>(
    `
    SELECT id
    FROM realestate.properties
    WHERE address_line1 = $1
      AND suburb = $2
      AND state = $3
      AND postcode = $4
    LIMIT 1
    `,
    [input.addressLine1, input.suburb, input.state, input.postcode],
  );

  if (existing.length > 0) {
    const id = existing[0].id;

    await client.query(
      `
      UPDATE realestate.properties
         SET property_type = COALESCE($1, property_type),
             bedrooms      = COALESCE($2, bedrooms),
             bathrooms     = COALESCE($3, bathrooms),
             car_spaces    = COALESCE($4, car_spaces),
             updated_at    = NOW()
       WHERE id = $5
      `,
      [
        input.propertyType ?? null,
        input.bedrooms ?? null,
        input.bathrooms ?? null,
        input.carSpaces ?? null,
        id,
      ],
    );

    return id;
  }

  const { rows } = await client.query<{ id: number }>(
    `
    INSERT INTO realestate.properties
      (address_line1, suburb, state, postcode,
       property_type, bedrooms, bathrooms, car_spaces)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
    `,
    [
      input.addressLine1,
      input.suburb,
      input.state,
      input.postcode,
      input.propertyType ?? null,
      input.bedrooms ?? null,
      input.bathrooms ?? null,
      input.carSpaces ?? null,
    ],
  );

  return rows[0].id;
}
