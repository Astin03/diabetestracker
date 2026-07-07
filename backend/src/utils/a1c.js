/** Estimated A1C from average glucose (mg/dL) - ADAG formula */
export function estimateA1C(avgGlucose) {
  if (!avgGlucose || avgGlucose <= 0) return null;
  return Math.round((avgGlucose + 46.7) / 28.7 * 10) / 10;
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
