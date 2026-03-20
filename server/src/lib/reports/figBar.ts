import { query } from '../db';

export interface FigBarMetrics {
  daily: MetricSet;
  wtd: MetricSet;
  mtd: MetricSet;
  metadata: {
    last_date: string;
    location_id?: string;
  };
}

interface MetricSet {
  revenue: number;
  revenueByType: {
    memberships: number;
    treatments: number;
    products: number;
  };
  uniqueGuests: number;
  newGuests: number;
  activeMembers: number;
  repeatNonMembers: number; // Placeholder/estimated
  aov: number;
  treatmentProductSplit: {
    treatments: number;
    products: number;
  };
  laborPercent: number; // Placeholder
  ebitda: number; // Placeholder
  bookingConversionRate: number;
  targets: {
    revenue: number;
    guests: number;
  };
}

export async function getFigBarPerformance(targetDate?: string, locationId?: string): Promise<FigBarMetrics> {
  // If no date provided, find the latest date in the database
  let activeDate = targetDate;
  if (!activeDate) {
    const lastDateRes = await query('SELECT MAX(sale_date) as last_date FROM vw_mbo_purchase_line_items');
    activeDate = lastDateRes.rows[0]?.last_date 
      ? new Date(lastDateRes.rows[0].last_date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
  }

  const getPeriodMetrics = async (start: string, end: string): Promise<MetricSet> => {
    const locFilter = locationId ? `AND location_id = $3` : '';
    const locParam = locationId ? [locationId] : [];

    // Revenue & Split
    const revSql = `
      SELECT 
        SUM(line_total_amount) as total_revenue,
        SUM(CASE WHEN LOWER(description) LIKE '%membership%' THEN line_total_amount ELSE 0 END) as memberships,
        SUM(CASE WHEN is_service = true AND LOWER(description) NOT LIKE '%membership%' THEN line_total_amount ELSE 0 END) as treatments,
        SUM(CASE WHEN is_service = false AND LOWER(description) NOT LIKE '%membership%' THEN line_total_amount ELSE 0 END) as products
      FROM vw_mbo_purchase_line_items
      WHERE CAST(sale_date AS DATE) >= $1 AND CAST(sale_date AS DATE) <= $2 ${locFilter};
    `;

    // Guests & AOV
    const guestSql = `
      SELECT COUNT(DISTINCT client_id) as count
      FROM mbo_sales
      WHERE CAST(sale_date AS DATE) >= $1 AND CAST(sale_date AS DATE) <= $2 ${locFilter};
    `;

    // New Guests
    const newGuestSql = `
      SELECT COUNT(*) as count
      FROM mbo_clients
      WHERE CAST(creation_date AS DATE) >= $1 AND CAST(creation_date AS DATE) <= $2;
    `;

    // Active Members (as of end date)
    const activeMembersSql = `
      SELECT COUNT(DISTINCT mbo_client_id) as count
      FROM mbo_memberships
      WHERE start_date <= $2 AND (end_date IS NULL OR end_date >= $2);
    `;

    // Booking Conversion
    const bookingSql = `
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_appointments
      FROM mbo_appointments
      WHERE CAST(start_time AS DATE) >= $1 AND CAST(start_time AS DATE) <= $2 ${locFilter};
    `;

    const [revRes, guestRes, newGuestRes, activeRes, bookingRes] = await Promise.all([
      query(revSql, [start, end, ...locParam]),
      query(guestSql, [start, end, ...locParam]),
      query(newGuestSql, [start, end]),
      query(activeMembersSql, [start, end]),
      query(bookingSql, [start, end, ...locParam])
    ]);

    const rev = revRes.rows[0];
    const guests = parseInt(guestRes.rows[0].count);
    const totalRev = parseFloat(rev.total_revenue || 0);

    return {
      revenue: totalRev,
      revenueByType: {
        memberships: parseFloat(rev.memberships || 0),
        treatments: parseFloat(rev.treatments || 0),
        products: parseFloat(rev.products || 0)
      },
      uniqueGuests: guests,
      newGuests: parseInt(newGuestRes.rows[0].count),
      activeMembers: parseInt(activeRes.rows[0].count),
      repeatNonMembers: Math.floor(guests * 0.4), // Placeholder estimation
      aov: guests > 0 ? totalRev / guests : 0,
      treatmentProductSplit: {
          treatments: totalRev > 0 ? (parseFloat(rev.treatments || 0) / totalRev) * 100 : 0,
          products: totalRev > 0 ? (parseFloat(rev.products || 0) / totalRev) * 100 : 0
      },
      laborPercent: 35.5, // Mocked
      ebitda: totalRev * 0.22, // Mocked 22% margin
      bookingConversionRate: parseInt(bookingRes.rows[0].total_appointments) > 0 
        ? (parseInt(bookingRes.rows[0].completed_appointments) / parseInt(bookingRes.rows[0].total_appointments)) * 100 
        : 0,
      targets: {
        revenue: 5000, // Mocked daily target
        guests: 40
      }
    };
  };

  // Helper dates
  const d = new Date(activeDate);
  const startOfWeek = new Date(d);
  startOfWeek.setDate(d.getDate() - d.getDay()); // Sunday
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);

  const [daily, wtd, mtd] = await Promise.all([
    getPeriodMetrics(activeDate, activeDate),
    getPeriodMetrics(startOfWeek.toISOString().split('T')[0], activeDate),
    getPeriodMetrics(startOfMonth.toISOString().split('T')[0], activeDate)
  ]);

  return { 
    daily, 
    wtd, 
    mtd, 
    metadata: { 
      last_date: activeDate,
      location_id: locationId
    } 
  };
}
