import { YieldCurvePoint } from '@/types';

/**
 * Linearly interpolates a yield curve to find the exact rate for a given WAL (Weighted Average Life).
 * This ensures tranches are priced accurately against the risk-free curve based on their actual duration.
 */
export const interpolateYield = (curve: YieldCurvePoint[], targetWal: number): number => {
  if (!curve || curve.length === 0) return 0;
  
  // Sort curve by tenor (X-axis)
  const sortedCurve = [...curve].sort((a, b) => a.tenor - b.tenor);
  
  // Edge case: WAL is less than or equal to the first point (e.g., extremely short paper)
  if (targetWal <= sortedCurve[0].tenor) {
    return sortedCurve[0].rate;
  }
  
  // Edge case: WAL is greater than or equal to the max point (extrapolation flat)
  if (targetWal >= sortedCurve[sortedCurve.length - 1].tenor) {
    return sortedCurve[sortedCurve.length - 1].rate;
  }
  
  // Linear Interpolation
  for (let i = 0; i < sortedCurve.length - 1; i++) {
    const p1 = sortedCurve[i];
    const p2 = sortedCurve[i + 1];
    
    if (targetWal >= p1.tenor && targetWal <= p2.tenor) {
      // Formula: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
      const slope = (p2.rate - p1.rate) / (p2.tenor - p1.tenor);
      return p1.rate + slope * (targetWal - p1.tenor);
    }
  }
  
  return 0; // Fallback
};
