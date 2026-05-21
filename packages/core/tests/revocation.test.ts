import { describe, it, expect } from 'vitest'
import { checkRevocationStatus } from '../src/revocation/status-list.js'

describe('Status List revocation', () => {
  it('returns non-revoked on fetch error (fail-open)', async () => {
    // Deliberately unreachable URI — should fail gracefully
    const result = await checkRevocationStatus('https://invalid.localhost/status/1', 0)
    expect(result.isRevoked).toBe(false)
    expect(result.checkedAt).toBeDefined()
    expect(result.reason).toContain('Status check failed')
  })
})
