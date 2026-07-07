<script setup>
import { computed } from 'vue';
import { format } from 'date-fns';

const props = defineProps({
  logs: { type: Array, default: () => [] },
  targetLow: { type: Number, default: 70 },
  targetHigh: { type: Number, default: 180 },
  medications: { type: Array, default: () => [] },
  height: { type: Number, default: 280 },
});

const series = computed(() => [{
  name: 'Glucose',
  data: props.logs.map((l) => ({
    x: new Date(l.recordedAt).getTime(),
    y: l.value,
  })),
}]);

const options = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    background: 'transparent',
  },
  theme: { mode: 'dark' },
  stroke: { curve: 'smooth', width: 3, colors: ['#14b8a6'] },
  fill: {
    type: 'gradient',
    gradient: {
      shadeIntensity: 1,
      opacityFrom: 0.45,
      opacityTo: 0.05,
      stops: [0, 100],
      colorStops: [
        { offset: 0, color: '#14b8a6', opacity: 0.4 },
        { offset: 100, color: '#14b8a6', opacity: 0 },
      ],
    },
  },
  colors: ['#14b8a6'],
  dataLabels: { enabled: false },
  xaxis: {
    type: 'datetime',
    labels: { datetimeUTC: false, format: 'HH:mm' },
  },
  yaxis: {
    min: 40,
    max: 350,
    title: { text: 'mg/dL' },
  },
  annotations: {
    yaxis: [
      {
        y: props.targetLow,
        borderColor: '#ef4444',
        strokeDashArray: 4,
        label: { text: 'Low', style: { color: '#ef4444', background: 'transparent' } },
      },
      {
        y: props.targetHigh,
        borderColor: '#f97316',
        strokeDashArray: 4,
        label: { text: 'High', style: { color: '#f97316', background: 'transparent' } },
      },
    ],
  },
  markers: {
    size: props.logs.map((l) => 5),
    colors: props.logs.map((l) =>
      l.category === 'hypoglycemia' ? '#ef4444'
        : l.category === 'hyperglycemia' ? '#f97316' : '#22c55e'
    ),
    strokeWidth: 2,
    strokeColors: '#fff',
  },
  tooltip: {
    x: { format: 'MMM d, HH:mm' },
    y: { formatter: (v) => `${v} mg/dL` },
  },
  grid: { borderColor: 'rgba(148,163,184,0.2)' },
}));
</script>

<template>
  <apexchart
    v-if="logs.length"
    type="area"
    :height="height"
    :options="options"
    :series="series"
  />
  <div v-else class="flex items-center justify-center text-slate-500" :style="{ height: height + 'px' }">
    No readings for this period
  </div>
</template>
