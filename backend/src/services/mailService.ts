import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import prisma from '../config/db';

dotenv.config();

export const createTransporter = async () => {
    const savedConfig = await prisma.smtpConfig.findUnique({ where: { id: 'default' } });
    const config = savedConfig || {
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        username: process.env.SMTP_USER || 'prince.senger76@ethereal.email',
        password: process.env.SMTP_PASS || 'mw3rRHE8vJe1kfdETA',
    };
    return nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
            user: config.username,
            pass: config.password,
        },
    });
};
