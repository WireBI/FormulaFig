import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { buildQuery, QueryConfig } from '@/lib/queryBuilder';

export async function POST(request: Request) {
  try {
    const config: QueryConfig = await request.json();

    if (!config || !config.tableName || !config.dimensions) {
      return NextResponse.json(
        { error: 'Missing required query configuration fields.' },
        { status: 400 }
      );
    }

    // Use our secure query builder
    const { sql, params } = buildQuery(config);

    // Execute query against Railway DB
    const result = await query(sql, params);

    return NextResponse.json({
      data: result.rows,
      rowCount: result.rowCount,
      metadata: { executedSql: sql } // For debugging/transparency
    });
  } catch (error: any) {
    console.error('Self-Service API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error?.message },
      { status: 500 }
    );
  }
}
