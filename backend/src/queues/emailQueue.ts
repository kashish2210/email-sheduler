import { Queue } from 'bullmq';
import { getBullMQRedisConfig } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
    connection: getBullMQRedisConfig(),
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
    },
});
