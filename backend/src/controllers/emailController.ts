import { Request, Response } from 'express';
import prisma from '../config/db';
import { emailQueue } from '../queues/emailQueue';

export const scheduleEmails = async (req: Request, res: Response) => {
    try {
        const { subject, body, htmlBody, attachments = [], recipients, startTime, delayBetweenEmails, hourlyLimit, senderEmail, recipientData: defaultRecipientData = {} } = req.body;

        const smtpConfig = await prisma.smtpConfig.findUnique({ where: { id: 'default' } });
        const resolvedSenderEmail = smtpConfig?.username || process.env.SMTP_USER || senderEmail;

        if (!subject || !resolvedSenderEmail || !startTime || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({ error: 'Subject, sender, start time, and at least one recipient are required.' });
        }

        // 1. Get or Create Sender
        let sender = await prisma.sender.findUnique({ where: { email: resolvedSenderEmail } });
        if (!sender) {
            sender = await prisma.sender.create({ data: { email: resolvedSenderEmail, name: smtpConfig?.fromName || 'Default Sender' } });
        }

        const scheduledJobs = [];

        // 2. Create Email records and add to Queue
        for (const recipient of recipients) {
            const to = typeof recipient === 'string' ? recipient : recipient.email;
            const recipientData = typeof recipient === 'string' ? defaultRecipientData : recipient.data || defaultRecipientData;
            if (!to) continue;
            const email = await prisma.email.create({
                data: {
                    to,
                    subject,
                    body,
                    htmlBody: htmlBody || null,
                    attachments,
                    recipientData,
                    scheduledAt: new Date(startTime),
                    senderId: sender.id,
                },
            });

            const delay = Math.max(0, new Date(startTime).getTime() - Date.now());

            const job = await emailQueue.add(
                'send-email',
                {
                    emailId: email.id,
                    senderId: sender.id,
                    hourlyLimit,
                    delayBetweenEmails,
                },
                { delay }
            );

            scheduledJobs.push({ emailId: email.id, jobId: job.id });
        }

        res.status(201).json({ message: 'Emails scheduled successfully', jobs: scheduledJobs });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getScheduledEmails = async (_req: Request, res: Response) => {
    try {
        const emails = await prisma.email.findMany({
            where: { status: 'PENDING' },
            orderBy: { scheduledAt: 'asc' },
            include: { sender: true }
        });
        res.json(emails);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getSentEmails = async (_req: Request, res: Response) => {
    try {
        const emails = await prisma.email.findMany({
            where: { status: 'SENT' },
            orderBy: { sentAt: 'desc' },
            include: { sender: true }
        });
        res.json(emails);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getEmailById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const emailId = Array.isArray(id) ? id[0] : id;
        
        const email = await prisma.email.findUnique({
            where: { id: emailId },
            include: { sender: true }
        });

        if (!email) {
            return res.status(404).json({ error: 'Email not found' });
        }

        res.json(email);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getSenders = async (_req: Request, res: Response) => {
    try {
        const senders = await prisma.sender.findMany({ orderBy: { createdAt: 'asc' } });
        res.json(senders);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const createSender = async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;
        if (!email) return res.status(400).json({ error: 'A sender email is required.' });
        const sender = await prisma.sender.upsert({
            where: { email },
            update: { name: name || undefined },
            create: { email, name: name || null },
        });
        res.status(201).json(sender);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getTemplates = async (_req: Request, res: Response) => {
    try {
        let templates = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } });
        if (templates.length === 0) {
            await prisma.template.createMany({ data: starterTemplates });
            templates = await prisma.template.findMany({ orderBy: { updatedAt: 'desc' } });
        }
        res.json(templates);
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

const starterTemplates = [
    {
        name: 'Warm introduction',
        subject: '{{first_name}}, a thoughtful idea for {{company}}',
        body: 'Hi {{first_name}},\n\nI noticed the work your team is doing at {{company}}. I have one practical idea that may help your {{role}} team move faster.\n\nWould a short conversation next week be useful?\n\nBest,\nOliver',
        htmlBody: '<div style="font-family:Arial,sans-serif;color:#20352a;line-height:1.7;max-width:620px"><p>Hi {{first_name}},</p><p>I noticed the work your team is doing at <strong>{{company}}</strong>. I have one practical idea that may help your {{role}} team move faster.</p><p>Would a short conversation next week be useful?</p><p>Best,<br>Oliver</p></div>',
    },
    {
        name: 'Product update',
        subject: 'A small update for {{company}}',
        body: 'Hi {{first_name}},\n\nYour {{plan}} workspace just received a set of improvements designed to make daily work simpler.\n\nSee what is new: {{booking_link}}\n\nThanks,\nThe team',
        htmlBody: '<div style="font-family:Arial,sans-serif;background:#f5f7f3;padding:32px;color:#20352a"><div style="background:#ffffff;padding:32px;max-width:620px;margin:auto"><p style="color:#6a7b70;text-transform:uppercase;letter-spacing:2px;font-size:11px">Product update</p><h1 style="font-size:28px;font-weight:500">A calmer workflow for {{company}}</h1><p>Hi {{first_name}}, your <strong>{{plan}}</strong> workspace just received improvements designed to make daily work simpler.</p><p><a href="{{booking_link}}" style="background:#20352a;color:#fff;padding:12px 18px;text-decoration:none">See what is new</a></p><p style="font-size:12px;color:#829087">You are receiving this because you use Reachbox. <a href="{{unsubscribe_url}}">Unsubscribe</a></p></div></div>',
    },
    {
        name: 'Renewal reminder',
        subject: '{{company}} renewal is coming up',
        body: 'Hi {{first_name}},\n\nA quick reminder that your {{plan}} renewal date is {{renewal_date}}.\n\nReply to this email if you would like to review anything before then.',
        htmlBody: '<div style="font-family:Arial,sans-serif;color:#20352a;max-width:620px;padding:24px"><p>Hi {{first_name}},</p><p>A quick reminder that your <strong>{{plan}}</strong> renewal date is <strong>{{renewal_date}}</strong>.</p><p>Reply to this email if you would like to review anything before then.</p></div>',
    },
];

export const createTemplate = async (req: Request, res: Response) => {
    try {
        const { name, subject, body, htmlBody } = req.body;
        if (!name || !subject || !body) return res.status(400).json({ error: 'Template name, subject, and text body are required.' });
        res.status(201).json(await prisma.template.create({ data: { name, subject, body, htmlBody: htmlBody || null } }));
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const getSmtpConfig = async (_req: Request, res: Response) => {
    try {
        const config = await prisma.smtpConfig.findUnique({ where: { id: 'default' } });
        res.json(config ? { ...config, password: undefined, configured: true } : { configured: false });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

export const saveSmtpConfig = async (req: Request, res: Response) => {
    try {
        const { host, port, secure, username, password, fromName } = req.body;
        if (!host || !username || !password) return res.status(400).json({ error: 'SMTP host, username, and password are required.' });
        const config = await prisma.smtpConfig.upsert({
            where: { id: 'default' },
            update: { host, port: Number(port) || 587, secure: Boolean(secure), username, password, fromName: fromName || null },
            create: { id: 'default', host, port: Number(port) || 587, secure: Boolean(secure), username, password, fromName: fromName || null },
        });
        res.status(201).json({ ...config, password: undefined, configured: true });
    } catch (error: unknown) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
};

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : 'Unable to complete this request. Confirm PostgreSQL is running and DATABASE_URL is configured.';
