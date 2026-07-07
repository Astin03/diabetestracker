import { useResultModalStore } from '../stores/resultModal';

export function useAlert() {
  const modal = useResultModalStore();

  return {
    success(title, message = '', onClose) {
      modal.showMessage({ title, message, variant: 'success', onClose });
    },
    error(message, title = 'Error') {
      modal.showMessage({ title, message, variant: 'error' });
    },
    info(title, message = '') {
      modal.showMessage({ title, message, variant: 'info' });
    },
    warning(title, message = '') {
      modal.showMessage({ title, message, variant: 'warning' });
    },
    glucose: modal.showGlucoseLog,
    insulin(log) {
      modal.showInsulinLog(log);
    },
    close: modal.close,
  };
}
