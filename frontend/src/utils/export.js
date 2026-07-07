import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { readingLabel } from './glucose';

export async function exportCsv() {
  const token = localStorage.getItem('astin_token');
  const base = import.meta.env.VITE_API_URL || '/api';
  const res = await fetch(`${base}/export/csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `astin-glucose-${format(new Date(), 'yyyy-MM-dd')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportPdf(logs) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Astin Diabetes System - Glucose Report', 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 28);

  autoTable(doc, {
    startY: 35,
    head: [['Date', 'Time', 'Value', 'Type', 'Category', 'Notes']],
    body: logs.map((l) => [
      format(new Date(l.recordedAt), 'yyyy-MM-dd'),
      format(new Date(l.recordedAt), 'HH:mm'),
      `${l.value} mg/dL`,
      readingLabel(l.readingType),
      l.category,
      l.notes || '',
    ]),
  });

  doc.save(`astin-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}

export async function backupData() {
  const { data } = await api.get('/export/backup');
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `astin-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function restoreData(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  await api.post('/export/restore', {
    glucoseLogs: data.glucoseLogs,
    medications: data.medications,
    appointments: data.appointments,
  });
}
