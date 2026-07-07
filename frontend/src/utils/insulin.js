export const MEALS = [
  { value: 'breakfast', label: 'Breakfast', icon: 'ph ph-sun-horizon' },
  { value: 'lunch', label: 'Lunch', icon: 'ph ph-sun' },
  { value: 'dinner', label: 'Dinner', icon: 'ph ph-moon-stars' },
];

export function mealLabel(meal) {
  return MEALS.find((m) => m.value === meal)?.label || meal;
}

export const INSULIN_TYPES = [
  {
    value: 'apidra',
    label: 'Apidra',
    description: 'Rapid-acting (mealtime)',
    color: 'bg-sky-500/10 border-sky-500/40 text-sky-700 dark:text-sky-300',
  },
  {
    value: 'lantus',
    label: 'Lantus',
    description: 'Long-acting (basal)',
    color: 'bg-violet-500/10 border-violet-500/40 text-violet-700 dark:text-violet-300',
  },
];

export function insulinMeta(type) {
  return INSULIN_TYPES.find((t) => t.value === type) || INSULIN_TYPES[0];
}

export function insulinLabel(type) {
  return insulinMeta(type).label;
}
