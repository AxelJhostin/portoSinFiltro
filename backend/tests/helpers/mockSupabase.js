import { vi } from 'vitest';

/** Builder thenable compatible con la cadena de supabase-js v2. */
export function mockQuery(result) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    gte: vi.fn(() => builder),
    order: vi.fn(() => builder),
    range: vi.fn(() => builder),
    single: vi.fn(() => builder),
    maybeSingle: vi.fn(() => builder),
    then(onFulfilled, onRejected) {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    },
  };
  return builder;
}

export function createSupabaseMock() {
  const from = vi.fn(() => mockQuery({ data: null, error: null }));
  return {
    from,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/foto.jpg' } })),
      })),
    },
  };
}
