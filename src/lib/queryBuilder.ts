/**
 * Query Builder for Self-Service Analytics
 * Safely generates SQL queries with parameterization for PostgreSQL
 */

export interface QueryConfig {
  tableName: string;
  dimensions: string[]; // Columns to GROUP BY
  metrics: { column: string; agg: 'SUM' | 'COUNT' | 'AVG' }[]; // Columns to aggregate
  dateRange?: {
    column: string;
    start: string;
    end: string;
  };
}

// Whitelist configuration to prevent SQL injection on identifiers
// Ensure these match the schema introspection provided
const VALID_TABLES = [
  'mbo_appointments',
  'mbo_memberships',
  'mbo_sale_items',
  'mbo_sale_payments',
  'mbo_client_services',
  'mbo_staff',
  'mbo_locations',
  'mbo_sale_contracts',
  'mbo_sale_contract_items',
  'mbo_sales',
  'mbo_site_categories',
  'mbo_site_subcategories',
  'mbo_sale_transactions',
  'mbo_sale_products',
  'mbo_sale_services',
];

const VALID_AGGS = ['SUM', 'COUNT', 'AVG'];

export function buildQuery(config: QueryConfig) {
  const { tableName, dimensions, metrics, dateRange } = config;

  if (!VALID_TABLES.includes(tableName)) {
    throw new Error(`Invalid table name: ${tableName}`);
  }

  // Escape identifiers (columns/tables) using double quotes
  // We don't parameterize identifiers in Postgres, we escape them.
  const escapeId = (id: string) => `"${id.replace(/"/g, '""')}"`;

  const selectCols: string[] = [];
  const groupByCols: string[] = [];
  
  // 1. Process Dimensions
  dimensions.forEach((dim) => {
    // Basic validation to ensure dim looks and acts like a column
    // The safest way is validating against a schema map, 
    // but for now we escape it to prevent breakout.
    const escapedDim = escapeId(dim);
    selectCols.push(`${escapedDim} as ${escapedDim}`);
    groupByCols.push(escapedDim);
  });

  // 2. Process Metrics
  metrics.forEach((metric) => {
    if (!VALID_AGGS.includes(metric.agg.toUpperCase())) {
      throw new Error(`Invalid aggregate function: ${metric.agg}`);
    }
    const escapedCol = escapeId(metric.column);
    const alias = escapeId(`${metric.agg}_${metric.column}`);
    selectCols.push(`${metric.agg.toUpperCase()}(${escapedCol}) as ${alias}`);
  });

  // 3. Process Date Filters (Where Clause)
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (dateRange && dateRange.column && dateRange.start && dateRange.end) {
    const escapedDateCol = escapeId(dateRange.column);
    whereClauses.push(`${escapedDateCol} >= $1::timestamp`);
    whereClauses.push(`${escapedDateCol} <= $2::timestamp`);
    params.push(dateRange.start);
    params.push(dateRange.end);
  }

  // Construct Query String
  let sql = `SELECT ${selectCols.join(', ')} FROM ${escapeId(tableName)}`;
  
  if (whereClauses.length > 0) {
    sql += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (groupByCols.length > 0) {
    sql += ` GROUP BY ${groupByCols.join(', ')}`;
  }

  // Enforce a hard limit to prevent overwhelming the application
  sql += ` LIMIT 10000;`;

  return { sql, params };
}
