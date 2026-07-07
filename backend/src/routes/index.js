import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { resolvePatientContext, requireWriteAccess } from '../middleware/patientContext.js';
import {
  registerValidation, loginValidation, glucoseValidation,
  medicationValidation, appointmentValidation, insulinValidation,
  inviteViewerValidation, validate,
} from './validators.js';
import * as auth from '../controllers/authController.js';
import * as glucose from '../controllers/glucoseController.js';
import * as medication from '../controllers/medicationController.js';
import * as appointment from '../controllers/appointmentController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as notification from '../controllers/notificationController.js';
import * as exportCtrl from '../controllers/exportController.js';
import * as insulin from '../controllers/insulinController.js';
import * as care from '../controllers/careAccessController.js';

const router = Router();

const withPatient = [authenticate, resolvePatientContext];
const withWrite = [authenticate, resolvePatientContext, requireWriteAccess];

router.post('/auth/register', registerValidation, validate, auth.register);
router.post('/auth/login', loginValidation, validate, auth.login);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/profile', authenticate, auth.updateProfile);

router.get('/care/viewers', authenticate, care.listViewers);
router.post('/care/viewers', authenticate, inviteViewerValidation, validate, care.inviteViewer);
router.delete('/care/viewers/:id', authenticate, care.revokeViewer);
router.get('/care/patients', authenticate, care.listPatients);
router.get('/care/invites', authenticate, care.listInvites);
router.post('/care/invites/:id/accept', authenticate, care.acceptInvite);

router.get('/glucose', ...withPatient, glucose.list);
router.get('/glucose/summary', ...withPatient, glucose.summary);
router.post('/glucose', ...withWrite, glucoseValidation, validate, glucose.create);
router.get('/glucose/:id', ...withPatient, glucose.getOne);
router.put('/glucose/:id', ...withWrite, glucoseValidation, validate, glucose.update);
router.delete('/glucose/:id', ...withWrite, glucose.remove);

router.get('/insulin', ...withPatient, insulin.list);
router.get('/insulin/summary', ...withPatient, insulin.summary);
router.post('/insulin', ...withWrite, insulinValidation, validate, insulin.create);
router.put('/insulin/:id', ...withWrite, insulinValidation, validate, insulin.update);
router.delete('/insulin/:id', ...withWrite, insulin.remove);

router.get('/medications', ...withPatient, medication.list);
router.post('/medications', ...withWrite, medicationValidation, validate, medication.create);
router.put('/medications/:id', ...withWrite, medication.update);
router.delete('/medications/:id', ...withWrite, medication.remove);
router.get('/medications/checklist/today', ...withPatient, medication.todayChecklist);
router.post('/medications/checklist/today/reset', ...withWrite, medication.resetTodayChecklist);
router.get('/medications/checklist/date/:date', ...withPatient, medication.checklistByDate);
router.get('/medications/checklist/calendar', ...withPatient, medication.calendarMeds);
router.get('/medications/missed', ...withPatient, medication.missed);
router.post('/medications/checklist/:id/taken', ...withWrite, medication.markTaken);

router.get('/appointments', ...withPatient, appointment.list);
router.post('/appointments', ...withWrite, appointmentValidation, validate, appointment.create);
router.put('/appointments/:id', ...withWrite, appointment.update);
router.delete('/appointments/:id', ...withWrite, appointment.remove);

router.get('/dashboard', ...withPatient, dashboard.getDashboard);
router.get('/calendar/:date', ...withPatient, dashboard.getCalendarDay);

router.get('/notifications', authenticate, notification.list);
router.put('/notifications/:id/read', authenticate, notification.markRead);
router.put('/notifications/read-all', authenticate, notification.markAllRead);
router.get('/reminders/pending', authenticate, notification.pendingReminders);

router.get('/export/csv', authenticate, exportCtrl.exportCsv);
router.get('/export/backup', authenticate, exportCtrl.exportData);
router.post('/export/restore', authenticate, exportCtrl.restoreData);

export default router;
