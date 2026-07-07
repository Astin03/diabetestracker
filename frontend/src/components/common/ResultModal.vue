<script setup>
import { computed } from 'vue';
import { useResultModalStore } from '../../stores/resultModal';
import { categoryLabel } from '../../utils/glucose';

const modal = useResultModalStore();

const config = computed(() => {
  const p = modal.payload;
  if (!p) return null;

  if (p.kind === 'glucose') {
    if (p.category === 'hyperglycemia') {
      return {
        icon: 'ph ph-warning-circle',
        iconClass: 'text-orange-500',
        ringClass: 'ring-orange-500/30',
        bgClass: 'bg-orange-50 dark:bg-orange-950/40',
        title: 'High blood sugar',
        subtitle: 'This reading is above your target range.',
        value: `${p.value} mg/dL`,
        badge: categoryLabel(p.category),
        badgeClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
      };
    }
    if (p.category === 'hypoglycemia') {
      return {
        icon: 'ph ph-warning-octagon',
        iconClass: 'text-red-500',
        ringClass: 'ring-red-500/30',
        bgClass: 'bg-red-50 dark:bg-red-950/40',
        title: 'Low blood sugar',
        subtitle: 'This reading is below your target range. Take action if needed.',
        value: `${p.value} mg/dL`,
        badge: categoryLabel(p.category),
        badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
      };
    }
    return {
      icon: 'ph ph-check-circle',
      iconClass: 'text-emerald-500',
      ringClass: 'ring-emerald-500/30',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      title: 'Reading saved',
      subtitle: 'Your glucose record was added successfully.',
      value: `${p.value} mg/dL`,
      badge: categoryLabel(p.category),
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }

  if (p.kind === 'insulin') {
    return {
      icon: 'ph ph-check-circle',
      iconClass: 'text-emerald-500',
      ringClass: 'ring-emerald-500/30',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
      title: 'Insulin logged',
      subtitle: `${p.insulinLabel} · ${p.mealLabel}`,
      value: `${p.units} units`,
      badge: null,
      badgeClass: '',
    };
  }

  const variants = {
    success: { icon: 'ph ph-check-circle', iconClass: 'text-emerald-500', ringClass: 'ring-emerald-500/30', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40' },
    error: { icon: 'ph ph-x-circle', iconClass: 'text-red-500', ringClass: 'ring-red-500/30', bgClass: 'bg-red-50 dark:bg-red-950/40' },
    warning: { icon: 'ph ph-warning', iconClass: 'text-amber-500', ringClass: 'ring-amber-500/30', bgClass: 'bg-amber-50 dark:bg-amber-950/40' },
    info: { icon: 'ph ph-info', iconClass: 'text-astin-600', ringClass: 'ring-astin-500/30', bgClass: 'bg-astin-50 dark:bg-astin-950/40' },
  };
  const v = variants[p.variant] || variants.success;
  return {
    ...v,
    title: p.title,
    subtitle: p.message,
    value: null,
    badge: null,
    badgeClass: '',
  };
});

const readingDetail = computed(() => {
  if (modal.payload?.kind !== 'glucose') return null;
  return modal.payload.readingLabel;
});
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modal.visible && config"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
      >
        <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="modal.close" />

        <div
          class="relative w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          :class="config.bgClass"
          @click.stop
        >
          <div class="p-6 text-center">
            <div
              class="w-16 h-16 mx-auto rounded-full flex items-center justify-center ring-4 mb-4"
              :class="[config.ringClass, 'bg-white dark:bg-slate-900']"
            >
              <i :class="[config.icon, config.iconClass]" class="text-4xl" />
            </div>

            <h2 class="text-xl font-bold text-slate-900 dark:text-white">{{ config.title }}</h2>
            <p class="text-sm text-slate-600 dark:text-slate-400 mt-1">{{ config.subtitle }}</p>

            <p v-if="config.value" class="text-4xl font-bold mt-4 tracking-tight">{{ config.value }}</p>

            <div v-if="config.badge || readingDetail" class="flex flex-wrap justify-center gap-2 mt-3">
              <span
                v-if="config.badge"
                class="text-xs font-semibold px-3 py-1 rounded-full border"
                :class="config.badgeClass"
              >
                {{ config.badge }}
              </span>
              <span v-if="readingDetail" class="text-xs text-slate-500 px-2 py-1">
                {{ readingDetail }}
              </span>
            </div>
          </div>

          <div class="px-6 pb-6">
            <button type="button" class="btn-primary w-full py-3 text-base" @click="modal.close">
              OK
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
