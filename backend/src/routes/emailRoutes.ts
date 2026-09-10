import { Router } from 'express';
import { scheduleEmails, getScheduledEmails, getSentEmails, getEmailById, getSenders, createSender, getTemplates, createTemplate, getSmtpConfig, saveSmtpConfig } from '../controllers/emailController';

const router = Router();

router.post('/schedule', scheduleEmails);
router.get('/senders', getSenders);
router.post('/senders', createSender);
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.get('/settings/smtp', getSmtpConfig);
router.post('/settings/smtp', saveSmtpConfig);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/:id', getEmailById);

export default router;
