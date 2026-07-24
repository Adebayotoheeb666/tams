import { describe, expect, it } from 'vitest';
import { resolveCustomerId } from '@/lib/utils/customer-id';

describe('resolveCustomerId', () => {
  it('prefers the selected customer ID over the manual entry', () => {
    expect(resolveCustomerId('customer-001', 'manual-123')).toBe('customer-001');
  });

  it('falls back to the manual customer ID when no selection is made', () => {
    expect(resolveCustomerId('', 'manual-123')).toBe('manual-123');
  });

  it('returns an empty string when both values are blank', () => {
    expect(resolveCustomerId('   ', '  ')).toBe('');
  });
});
