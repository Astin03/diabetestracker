/** Estimated A1C from average glucose (mg/dL) - ADAG formula */
export function estimateA1C(avgGlucose) {
  if (!avgGlucose || avgGlucose <= 0) return null;
  return Math.round((avgGlucose + 46.7) / 28.7 * 10) / 10;
}

export function categoryBreakdown(readings) {
  if (!readings?.length) return { low: 0, normal: 0, high: 0, total: 0 };
  return readings.reduce(
    (acc, r) => {
      const cat = r.category || categorizeReadingValue(r);
      if (cat === 'hypoglycemia') acc.low += 1;
      else if (cat === 'hyperglycemia') acc.high += 1;
      else acc.normal += 1;
      acc.total += 1;
      return acc;
    },
    { low: 0, normal: 0, high: 0, total: 0 }
  );
}

function categorizeReadingValue(r) {
  const v = parseFloat(r.value);
  if (Number.isNaN(v)) return 'normal';
  if (v < 70) return 'hypoglycemia';
  if (v > 180) return 'hyperglycemia';
  return 'normal';
}

export function timeInRange(readings, targetLow = 70, targetHigh = 180) {
  if (!readings?.length) return { percent: 0, inRange: 0, total: 0 };
  const inRange = readings.filter(
    (r) => parseFloat(r.value) >= targetLow && parseFloat(r.value) <= targetHigh
  ).length;
  return {
    percent: Math.round((inRange / readings.length) * 100),
    inRange,
    total: readings.length,
  };
}

export function glucoseStats(readings) {
  if (!readings?.length) {
    return { avg: null, min: null, max: null, count: 0 };
  }
  const values = readings.map((r) => parseFloat(r.value));
  return {
    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    min: Math.min(...values),
    max: Math.max(...values),
    count: values.length,
  };
}
