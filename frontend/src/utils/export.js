import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { readingLabel } from './glucose';
import { getApiUrl } from './appConfig';

export async function exportCsv() {
  const token = localStorage.getItem('astin_token');
  const base = getApiUrl();
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
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont('helvetica');
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text('Astin Diabetes System - Glucose Report', 14, 12);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 17);

  const categoryBorder = {
    hypoglycemia: [239, 68, 68],
    hyperglycemia: [249, 115, 22],
    normal: [34, 197, 94],
  };

  autoTable(doc, {
    startY: 22,
    head: [['Date', 'Time', 'Value', 'Type', 'Category', 'Notes']],
    body: logs.map((l) => [
      format(new Date(l.recordedAt), 'yyyy-MM-dd'),
      format(new Date(l.recordedAt), 'HH:mm'),
      `${l.value} mg/dL`,
      readingLabel(l.readingType),
      l.category,
      l.notes || '',
    ]),
    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [0, 0, 0],
      lineColor: [210, 210, 210],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 7,
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    margin: { left: 14, right: 14 },
    didParseCell(data) {
      if (data.section !== 'body') return;
      const log = logs[data.row.index];
      if (!log) return;
      const color = categoryBorder[log.category] || categoryBorder.normal;
      if (data.column.index === 2 || data.column.index === 4) {
        data.cell.styles.lineColor = color;
        data.cell.styles.lineWidth = 0.35;
      }
    },
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
