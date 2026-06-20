import { describe, it, expect } from 'vitest';
import * as schema from '@/lib/db/schema';

describe('Drizzle schema exports', () => {
  it('exports products and accounts tables', () => {
    expect(schema.products).toBeDefined();
    expect(schema.accounts).toBeDefined();
  });
});
