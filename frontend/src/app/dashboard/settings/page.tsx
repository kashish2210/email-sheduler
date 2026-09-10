"use client"
import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function SettingsPage() {
    const [form, setForm] = useState({ host: '', port: '587', secure: false, username: '', password: '', fromName: '' });
    const [saved, setSaved] = useState(false);

    const update = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        await axios.post(`${api}/emails/settings/smtp`, { ...form, port: Number(form.port) });
        setSaved(true);
    };

    return <section className="page-surface max-w-3xl mx-auto">
        <div className="mb-8"><p className="text-xs uppercase tracking-[.2em] text-gray-400 mb-2">Workspace settings</p><h1 className="text-3xl font-semibold">Connect your sending mailbox</h1><p className="text-gray-500 mt-2">Use SMTP to send from your own domain. Credentials are used by the worker and never returned to the browser.</p></div>
        <form onSubmit={save} className="glass-card p-6 grid gap-5">
            <div className="grid md:grid-cols-2 gap-4"><label className="grid gap-2 text-sm">SMTP host<input required value={form.host} onChange={(e) => update('host', e.target.value)} placeholder="smtp.gmail.com" className="compose-input rounded-lg border p-3" /></label><label className="grid gap-2 text-sm">Port<input required type="number" value={form.port} onChange={(e) => update('port', e.target.value)} className="compose-input rounded-lg border p-3" /></label></div>
            <div className="grid md:grid-cols-2 gap-4"><label className="grid gap-2 text-sm">Username<input required value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="you@company.com" className="compose-input rounded-lg border p-3" /></label><label className="grid gap-2 text-sm">Password<input required type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="compose-input rounded-lg border p-3" /></label></div>
            <label className="grid gap-2 text-sm">From name<input value={form.fromName} onChange={(e) => update('fromName', e.target.value)} placeholder="Reachbox team" className="compose-input rounded-lg border p-3" /></label>
            <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.secure} onChange={(e) => update('secure', e.target.checked)} /> Use secure TLS (usually port 465)</label>
            <div className="flex items-center gap-4"><button className="btn-primary" type="submit">Save SMTP connection</button>{saved && <span className="text-sm text-green-700">Connection saved.</span>}</div>
        </form>
        <p className="text-sm text-gray-500 mt-6">Need a provider? Gmail, Outlook, Amazon SES, Mailgun, and any standard SMTP relay work. Use an app password where your provider requires one.</p>
        <Link href="/dashboard/docs" className="text-sm text-green-800 underline mt-4 inline-block">Read sending docs</Link>
    </section>;
}
