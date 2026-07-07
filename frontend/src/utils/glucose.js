export const READING_TYPES = [
  { value: 'pre_breakfast', label: 'Pre-breakfast' },
  { value: 'post_breakfast_2h', label: '2h after breakfast' },
  { value: 'pre_lunch', label: 'Pre-lunch' },
  { value: 'post_lunch_2h', label: '2h after lunch' },
  { value: 'pre_dinner', label: 'Pre-dinner' },
  { value: 'post_dinner_2h', label: '2h after dinner' },
  { value: 'before_sleep', label: 'Before sleep' },
  { value: 'random', label: 'Random' },
];

export function categoryColor(category) {
  if (category === 'hypoglycemia') return 'text-red-500 bg-red-500/10 border-red-500/30';
  if (category === 'hyperglycemia') return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
  return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
}

export function categoryLabel(category) {
  if (category === 'hypoglycemia') return 'Low';
  if (category === 'hyperglycemia') return 'High';
  return 'Normal';
}

export function estimateA1C(avg) {
  if (!avg) return '—';
  return ((avg + 46.7) / 28.7).toFixed(1);
}

export function readingLabel(type) {
  return READING_TYPES.find((r) => r.value === type)?.label || type;
}
