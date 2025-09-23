import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface Paginated<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  page = 1,
  limit = 20,
): Promise<Paginated<T>> {
  const p = Math.max(1, Number(page || 1));
  const l = Math.min(100, Math.max(1, Number(limit || 20)));

  const [data, total] = await qb
    .skip((p - 1) * l)
    .take(l)
    .getManyAndCount();

  return {
    data,
    meta: {
      total,
      page: p,
      limit: l,
      totalPages: Math.max(1, Math.ceil(total / l)),
    },
  };
}
