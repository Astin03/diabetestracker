import { defineStore } from 'pinia';
import { ref } from 'vue';
import { readingLabel } from '../utils/glucose';
import { mealLabel } from '../utils/insulin';
import { insulinLabel } from '../utils/insulin';

export const useResultModalStore = defineStore('resultModal', () => {
  const visible = ref(false);
  const payload = ref(null);
  let onCloseCallback = null;

  function showGlucoseLog(log) {
    payload.value = {
      kind: 'glucose',
      value: log.value,
      category: log.category,
      readingType: log.readingType,
      readingLabel: readingLabel(log.readingType),
    };
    onCloseCallback = null;
    visible.value = true;
  }

  function showInsulinLog(log) {
    payload.value = {
      kind: 'insulin',
      units: log.units,
      insulinLabel: insulinLabel(log.insulinType),
      mealLabel: mealLabel(log.meal),
    };
    onCloseCallback = null;
    visible.value = true;
  }

  function showMessage({ title, message, variant = 'success', onClose }) {
    payload.value = { kind: 'message', title, message, variant };
    onCloseCallback = onClose || null;
    visible.value = true;
  }

  function close() {
    visible.value = false;
    payload.value = null;
    const cb = onCloseCallback;
    onCloseCallback = null;
    if (cb) cb();
  }

  return { visible, payload, showGlucoseLog, showInsulinLog, showMessage, close };
});
