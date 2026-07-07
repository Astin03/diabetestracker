<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v),
  },
  variant: {
    type: String,
    default: 'full',
    validator: (v) => ['full', 'brand'].includes(v),
  },
  centered: {
    type: Boolean,
    default: false,
  },
});

const sizeClass = {
  sm: 'max-h-8',
  md: 'max-h-12',
  lg: 'max-h-20',
  xl: 'max-h-36',
};

const logoClass = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

const titleClass = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};
</script>

<template>
  <div
    v-if="variant === 'brand'"
    class="flex items-center gap-3 min-w-0"
    :class="centered ? 'justify-center' : ''"
  >
    <img
      src="/logo.png"
      alt="Astin"
      :class="[logoClass[size], 'shrink-0 object-contain select-none rounded-[15px] border border-slate-200 dark:border-slate-700']"
      draggable="false"
    />
    <div class="min-w-0 leading-none" :class="titleClass[size]">
      <p class="font-bold tracking-tight text-slate-900 dark:text-slate-100">Diabetes</p>
      <p class="font-normal tracking-tight text-slate-600 dark:text-slate-400 mt-0.5">Tracker / Monitoring</p>
    </div>
  </div>

  <img
    v-else
    src="/logo.png"
    alt="Astin Diabetes System"
    :class="[sizeClass[size], 'w-auto object-contain select-none', centered ? 'mx-auto block' : '']"
    draggable="false"
  />
</template>
