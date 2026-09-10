import { Worker, Job } from 'bullmq';
import { redisConfig, getBullMQRedisConfig } from '../config/redis';
import { EMAIL_QUEUE_NAME } from '../queues/emailQueue';
import { createTransporter } from '../services/mailService';
import prisma from '../config/db';
import Redis from 'ioredis';

type Attachment = { filename: string; content: string; contentType?: string };
const renderTemplate = (content: string | null, data: Record<string, unknown>) =>
    content?.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key) => String(data[key] ?? ''));

const redis = new Redis(redisConfig as any);

export const setupWorker = () => {
    const worker = new Worker(
        EMAIL_QUEUE_NAME,
        async (job: Job) => {
            const { emailId, senderId, hourlyLimit, delayBetweenEmails } = job.data;

            // 1. Rate Limiting Logic (Hourly)
            const currentHour = new Date().toISOString().substring(0, 13); // YYYY-MM-DDTHH
            const rateLimitKey = `rate-limit:${senderId}:${currentHour}`;

            const count = await redis.incr(rateLimitKey);
            if (count === 1) {
                await redis.expire(rateLimitKey, 3600);
            }

            if (count > hourlyLimit) {
                // Re-schedule for next hour
                const nextHour = new Date();
                nextHour.setHours(nextHour.getHours() + 1);
                nextHour.setMinutes(0);
                nextHour.setSeconds(0);

                const delay = nextHour.getTime() - Date.now();

                await job.updateData({ ...job.data, status: 'RESCHEDULED' });
                // In a real system, we'd move this to a delayed state or a separate "overflow" queue
                // For this assignment, we'll just throw an error to trigger a retry with backoff, 
                // or manually re-add to queue with delay.
                // Better: BullMQ custom delay
                throw new Error('RATE_LIMIT_EXCEEDED');
            }

            // 2. Fetch Email Data
            const email = await prisma.email.findUnique({
                where: { id: emailId },
                include: { sender: true }
            });

            if (!email || email.status === 'SENT') return;

            // 3. Send Email
            try {
                const transporter = await createTransporter();
                await transporter.sendMail({
                    from: email.sender.email,
                    to: email.to,
                    subject: renderTemplate(email.subject, (email.recipientData as Record<string, unknown>) || {}) || email.subject,
                    text: renderTemplate(email.body, (email.recipientData as Record<string, unknown>) || {}) || email.body,
                    html: renderTemplate(email.htmlBody, (email.recipientData as Record<string, unknown>) || {}) || undefined,
                    attachments: Array.isArray(email.attachments) ? email.attachments as Attachment[] : [],
                });

                // 4. Update status
                await prisma.email.update({
                    where: { id: emailId },
                    data: { status: 'SENT', sentAt: new Date() }
                });

                // 5. Enforce delay between emails (Custom delay in logic)
                if (delayBetweenEmails > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
                }

            } catch (error) {
                console.error(`Failed to send email ${emailId}:`, error);
                await prisma.email.update({
                    where: { id: emailId },
                    data: { status: 'FAILED' }
                });
                throw error;
            }
        },
        {
            connection: getBullMQRedisConfig(),
            concurrency: 5, // Configurable concurrency
        }
    );

    worker.on('completed', (job) => {
        console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        console.error(`Job ${job?.id} failed: ${err.message}`);
    });

    return worker;
};
