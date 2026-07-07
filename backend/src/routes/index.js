import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  registerValidation, loginValidation, glucoseValidation,
  medicationValidation, appointmentValidation, insulinValidation, validate,
} from './validators.js';
import * as auth from '../controllers/authController.js';
import * as glucose from '../controllers/glucoseController.js';
import * as medication from '../controllers/medicationController.js';
import * as appointment from '../controllers/appointmentController.js';
import * as dashboard from '../controllers/dashboardController.js';
import * as notification from '../controllers/notificationController.js';
import * as exportCtrl from '../controllers/exportController.js';
import * as insulin from '../controllers/insulinController.js';

const router = Router();

router.post('/auth/register', registerValidation, validate, auth.register);
router.post('/auth/login', loginValidation, validate, auth.login);
router.get('/auth/profile', authenticate, auth.getProfile);
router.put('/auth/profile', authenticate, auth.updateProfile);

router.get('/glucose', authenticate, glucose.list);
router.get('/glucose/summary', authenticate, glucose.summary);
router.post('/glucose', authenticate, glucoseValidation, validate, glucose.create);
router.get('/glucose/:id', authenticate, glucose.getOne);
router.put('/glucose/:id', authenticate, glucoseValidation, validate, glucose.update);
router.delete('/glucose/:id', authenticate, glucose.remove);

router.get('/insulin', authenticate, insulin.list);
router.get('/insulin/summary', authenticate, insulin.summary);
router.post('/insulin', authenticate, insulinValidation, validate, insulin.create);
router.put('/insulin/:id', authenticate, insulinValidation, validate, insulin.update);
router.delete('/insulin/:id', authenticate, insulin.remove);

router.get('/medications', authenticate, medication.list);
router.post('/medications', authenticate, medicationValidation, validate, medication.create);
router.put('/medications/:id', authenticate, medication.update);
router.delete('/medications/:id', authenticate, medication.remove);
router.get('/medications/checklist/today', authenticate, medication.todayChecklist);
router.post('/medications/checklist/today/reset', authenticate, medication.resetTodayChecklist);
router.get('/medications/checklist/date/:date', authenticate, medication.checklistByDate);
router.get('/medications/checklist/calendar', authenticate, medication.calendarMeds);
router.get('/medications/missed', authenticate, medication.missed);
router.post('/medications/checklist/:id/taken', authenticate, medication.markTaken);

router.get('/appointments', authenticate, appointment.list);
router.post('/appointments', authenticate, appointmentValidation, validate, appointment.create);
router.put('/appointments/:id', authenticate, appointment.update);
router.delete('/appointments/:id', authenticate, appointment.remove);

router.get('/dashboard', authenticate, dashboard.getDashboard);
router.get('/calendar/:date', authenticate, dashboard.getCalendarDay);

router.get('/notifications', authenticate, notification.list);
router.put('/notifications/:id/read', authenticate, notification.markRead);
router.put('/notifications/read-all', authenticate, notification.markAllRead);
router.get('/reminders/pending', authenticate, notification.pendingReminders);

router.get('/export/csv', authenticate, exportCtrl.exportCsv);
router.get('/export/backup', authenticate, exportCtrl.exportData);
router.post('/export/restore', authenticate, exportCtrl.restoreData);

export default router;
