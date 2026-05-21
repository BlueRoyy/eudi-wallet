/**
 * mDoc parser — decodes base64url-encoded mDoc CBOR into structured types.
 *
 * NOTE: Full CBOR/COSE decoding requires the `cbor2` library.
 * This module defines the parsing interface; the implementation
 * calls into cbor2 for actual decoding.
 */

import type { MDoc, MdlData } from './types.js'
import { MDL_NAMESPACE } from './namespaces.js'

/** Parse a base64url-encoded mDoc (as returned by OID4VCI issuer) */
export async function parseMDoc(base64urlEncoded: string): Promise<MDoc> {
  // Decode base64url → Uint8Array
  const bytes = base64urlToBytes(base64urlEncoded)
  // CBOR decoding is deferred to the cbor2 library (loaded dynamically)
  const { decode } = await import('cbor2')
  return decode(bytes) as MDoc
}

/** Extract readable mDL fields from a parsed mDoc */
export function extractMdlData(mdoc: MDoc): MdlData | null {
  const doc = mdoc.documents.find((d) => d.docType === 'org.iso.18013.5.1.mDL')
  if (!doc) return null

  const ns = doc.issuerSigned.nameSpaces?.get(MDL_NAMESPACE)
  if (!ns) return null

  const fields: Record<string, unknown> = {}
  for (const item of ns) {
    fields[item.elementIdentifier] = item.elementValue
  }

  return {
    familyName: String(fields['family_name'] ?? ''),
    givenName: String(fields['given_name'] ?? ''),
    birthDate: String(fields['birth_date'] ?? ''),
    issueDate: String(fields['issue_date'] ?? ''),
    expiryDate: String(fields['expiry_date'] ?? ''),
    issuingCountry: String(fields['issuing_country'] ?? ''),
    issuingAuthority: fields['issuing_authority'] ? String(fields['issuing_authority']) : undefined,
    documentNumber: String(fields['document_number'] ?? ''),
    portrait: fields['portrait'] instanceof Uint8Array ? fields['portrait'] : undefined,
    drivingPrivileges: fields['driving_privileges'] as MdlData['drivingPrivileges'],
    ...fields,
  }
}

function base64urlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}
