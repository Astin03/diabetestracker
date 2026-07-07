export function categorizeGlucose(value, targetLow = 70, targetHigh = 180) {
  const v = parseFloat(value);
  if (v < targetLow) return 'hypoglycemia';
  if (v > targetHigh) return 'hyperglycemia';
  return 'normal';
}

export function getGlucoseColor(category) {
  switch (category) {
    case 'hypoglycemia':
      return '#ef4444';
    case 'hyperglycemia':
      return '#f97316';
    default:
      return '#22c55e';
  }
}

export function getGlucoseLabel(category) {
  switch (category) {
    case 'hypoglycemia':
      return 'Low';
    case 'hyperglycemia':
      return 'High';
    default:
      return 'Normal';
  }
}

export const READING_TYPES = [
  'pre_breakfast',
  'post_breakfast_2h',
  'pre_lunch',
  'post_lunch_2h',
  'pre_dinner',
  'post_dinner_2h',
  'before_sleep',
  'random',
];

export const READING_LABELS = {
  pre_breakfast: 'Pre-breakfast',
  post_breakfast_2h: '2h after breakfast',
  pre_lunch: 'Pre-lunch',
  post_lunch_2h: '2h after lunch',
  pre_dinner: 'Pre-dinner',
  post_dinner_2h: '2h after dinner',
  before_sleep: 'Before sleep',
  random: 'Random',
};
