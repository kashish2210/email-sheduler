"use client"
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, CheckCircle, Paperclip, Braces } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ComposePage() {
    const router = useRouter();
    const [recipients, setRecipients] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [htmlBody, setHtmlBody] = useState('');
    const [editorMode, setEditorMode] = useState<'text' | 'html'>('text');
    const [attachments, setAttachments] = useState<{ filename: string; content: string; contentType: string }[]>([]);
    const [recipientData, setRecipientData] = useState<Record<string, string>>({});
    const [recipientDataByEmail, setRecipientDataByEmail] = useState<Record<string, Record<string, string>>>({});
    const [templates, setTemplates] = useState<{ id: string; name: string; subject: string; body: string; htmlBody?: string }[]>([]);
    const [templateName, setTemplateName] = useState('');
    const [startTime, setStartTime] = useState('');
    const [delayBetweenEmails, setDelayBetweenEmails] = useState('2000');
    const [hourlyLimit, setHourlyLimit] = useState('200');
    const [senderEmail, setSenderEmail] = useState('');
    const [smtpConfigured, setSmtpConfigured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const textEditorRef = useRef<HTMLTextAreaElement>(null);
    const htmlEditorRef = useRef<HTMLTextAreaElement>(null);
    const [customPill, setCustomPill] = useState('');
    const [showPillPicker, setShowPillPicker] = useState(false);
    const commonPills = ['first_name', 'last_name', 'company', 'role', 'plan', 'renewal_date', 'booking_link', 'unsubscribe_url'];

    useEffect(() => {
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
        Promise.all([
            axios.get(`${api}/emails/templates`),
            axios.get(`${api}/emails/settings/smtp`),
        ]).then(([templateResponse, smtpResponse]) => {
            setTemplates(templateResponse.data);
            if (smtpResponse.data.configured && smtpResponse.data.username) {
                setSenderEmail(smtpResponse.data.username);
                setSmtpConfigured(true);
            }
        }).catch(() => undefined);
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.split(/\r?\n/).filter(Boolean);
                const headers = lines[0]?.split(',').map((item) => item.trim().toLowerCase()) || [];
                const emailIndex = Math.max(headers.indexOf('email'), headers.indexOf('e-mail'), 0);
                const parsed = lines.slice(headers.includes('email') ? 1 : 0).map((line) => {
                    const values = line.split(',').map((item) => item.trim());
                    const email = values[emailIndex] || '';
                    const data = headers.reduce<Record<string, string>>((result, key, index) => {
                        if (key && key !== 'email') result[key] = values[index] || '';
                        return result;
                    }, {});
                    return { email, data };
                }).filter((item) => item.email.includes('@'));
                const emails = parsed.map((item) => item.email);
                if (emails.length) setRecipients(Array.from(new Set(emails)));
                if (parsed[0]?.data) setRecipientData(parsed[0].data);
                setRecipientDataByEmail(parsed.reduce<Record<string, Record<string, string>>>((result, item) => {
                    result[item.email] = item.data;
                    return result;
                }, {}));
            };
            reader.readAsText(file);
        }
    };

    const handleSchedule = async () => {
        if (!subject || !body || recipients.length === 0 || !startTime || !senderEmail || !smtpConfigured) {
            alert('Please fill all required fields');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/emails/schedule`, {
                subject,
                body,
                recipients: recipients.map((email) => ({ email, data: recipientDataByEmail[email] || recipientData })),
                startTime: new Date(startTime).toISOString(),
                delayBetweenEmails: parseInt(delayBetweenEmails),
                hourlyLimit: parseInt(hourlyLimit),
                senderEmail,
                htmlBody: htmlBody || undefined,
                attachments,
                recipientData
            });

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);
        } catch (error) {
            console.error('Failed to schedule emails:', error);
            alert('Failed to schedule emails. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleAttachments = (e: React.ChangeEvent<HTMLInputElement>) => {
        Array.from(e.target.files || []).forEach((file) => {
            const reader = new FileReader();
            reader.onload = () => setAttachments((current) => [...current, {
                filename: file.name,
                content: String(reader.result).split(',')[1] || '',
                contentType: file.type || 'application/octet-stream',
            }]);
            reader.readAsDataURL(file);
        });
    };

    const insertPill = (pill = 'name') => {
        const token = `{{${pill}}}`;
        if (editorMode === 'html') {
            const editor = htmlEditorRef.current;
            if (!editor) return setHtmlBody((current) => `${current}${token}`);
            const start = editor.selectionStart;
            const end = editor.selectionEnd;
            setHtmlBody((current) => `${current.slice(0, start)}${token}${current.slice(end)}`);
            requestAnimationFrame(() => {
                editor.focus();
                const position = start + token.length;
                editor.setSelectionRange(position, position);
            });
            return;
        }
        const editor = textEditorRef.current;
        if (!editor) return setBody((current) => `${current}${token}`);
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        setBody((current) => `${current.slice(0, start)}${token}${current.slice(end)}`);
        requestAnimationFrame(() => {
            editor.focus();
            const position = start + token.length;
            editor.setSelectionRange(position, position);
        });
    };
    const applyTemplate = (id: string) => {
        const template = templates.find((item) => item.id === id);
        if (template) {
            setSubject(template.subject);
            setBody(template.body);
            setHtmlBody(template.htmlBody || '');
        }
    };

    const saveTemplate = async () => {
        if (!templateName || !subject || !body) return alert('Add a template name, subject, and text body first.');
        try {
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/emails/templates`, { name: templateName, subject, body, htmlBody });
            setTemplates((current) => [response.data, ...current]);
            setTemplateName('');
        } catch (error) {
            console.error('Failed to save template:', error);
            alert('Could not save this template.');
        }
    };

    return (
        <div className="compose-surface h-full flex flex-col pt-4">
            <div className="compose-toolbar px-8 flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
                    <h1 className="text-xl font-semibold">Compose New Email</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSchedule}
                        disabled={loading || success}
                        className="compose-action px-6 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {success ? <><CheckCircle size={16} /> Scheduled!</> : loading ? 'Scheduling...' : 'Schedule Emails'}
                    </button>
                </div>
            </div>

            <div className="compose-content px-32 flex-1 relative">
                <div className="flex flex-col gap-6">
                    <div className="compose-field flex items-center gap-4">
                        <span className="compose-label text-gray-400 w-24">From</span>
                            <input
                            value={senderEmail}
                            readOnly
                            placeholder="Configure SMTP first"
                            className="compose-input flex-1 bg-gray-50 px-3 py-1.5 rounded-lg border outline-none text-sm font-medium"
                        />
                        {!smtpConfigured && <Link href="/dashboard/settings" className="text-xs text-green-800 underline">Set up SMTP</Link>}
                    </div>

                    <div className="compose-field flex items-center gap-4">
                        <span className="compose-label text-gray-400 w-24">Template</span>
                        <select onChange={(e) => applyTemplate(e.target.value)} defaultValue="" className="compose-select flex-1 px-3 py-2 rounded-lg border outline-none text-sm">
                            <option value="">Start from a template...</option>
                            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="compose-field flex items-center gap-4 group">
                            <span className="compose-label text-gray-400 w-24">To</span>
                            <input
                                type="text"
                                placeholder="recipient@example.com"
                                value={recipients.join(', ')}
                                onChange={(e) => setRecipients(e.target.value.split(',').map(s => s.trim()))}
                                className="compose-input flex-1 outline-none border-b border-transparent focus:border-gray-100 py-1"
                            />
                            <label className="text-green-600 text-sm font-medium cursor-pointer hover:underline flex items-center gap-1">
                                <Send size={14} className="-rotate-45" /> Upload List
                                <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileUpload} />
                            </label>
                        </div>
                        {recipients.length > 0 && (
                            <div className="ml-28 text-xs text-gray-400">
                                {recipients.length} recipients detected
                            </div>
                        )}
                    </div>

                    <div className="compose-field flex items-center gap-4">
                        <span className="compose-label text-gray-400 w-24">Subject</span>
                        <input 
                            type="text" 
                            placeholder="Subject" 
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="compose-input flex-1 outline-none border-b border-transparent focus:border-gray-100 py-1" 
                        />
                    </div>

                    <div className="compose-field flex items-center gap-4">
                        <span className="compose-label text-gray-400 w-24">Start Time</span>
                        <input 
                            type="datetime-local" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="compose-input bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 outline-none text-sm" 
                        />
                    </div>

                    <div className="compose-options flex items-center gap-8 border-t border-gray-50 pt-6">
                        <div className="compose-option flex items-center gap-3">
                            <span className="text-gray-400 text-sm">Delay between emails (ms)</span>
                            <input 
                                type="number" 
                                value={delayBetweenEmails}
                                onChange={(e) => setDelayBetweenEmails(e.target.value)}
                                placeholder="2000" 
                                className="compose-number w-24 h-10 bg-gray-50 rounded-lg text-center outline-none border border-gray-100" 
                            />
                        </div>
                        <div className="compose-option flex items-center gap-3">
                            <span className="text-gray-400 text-sm">Hourly Limit</span>
                            <input 
                                type="number" 
                                value={hourlyLimit}
                                onChange={(e) => setHourlyLimit(e.target.value)}
                                placeholder="200" 
                                className="compose-number w-24 h-10 bg-gray-50 rounded-lg text-center outline-none border border-gray-100" 
                            />
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <button type="button" onClick={() => setEditorMode('text')} className={`px-3 py-1.5 rounded-lg text-xs ${editorMode === 'text' ? 'bg-green-900 text-white' : 'bg-gray-100'}`}>Text</button>
                            <button type="button" onClick={() => setEditorMode('html')} className={`px-3 py-1.5 rounded-lg text-xs ${editorMode === 'html' ? 'bg-green-900 text-white' : 'bg-gray-100'}`}>HTML</button>
                            <button type="button" onClick={() => setShowPillPicker((current) => !current)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs"><Braces size={14} /> {showPillPicker ? 'Close data pills' : 'Add data pill'}</button>
                            <label className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs cursor-pointer"><Paperclip size={14} /> Attach files<input type="file" multiple className="hidden" onChange={handleAttachments} /></label>
                            <input value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Template name" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs" />
                            <button type="button" onClick={saveTemplate} className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs">Save template</button>
                        </div>
                        {showPillPicker && <div className="glass-card p-3 mb-3 flex flex-wrap gap-2 items-center">
                            {commonPills.map((pill) => <button key={pill} type="button" onClick={() => { insertPill(pill); setShowPillPicker(false); }} className="rounded-full bg-white border border-green-200 px-3 py-1 text-xs text-green-800 hover:bg-green-50">{`{{${pill}}}`}</button>)}
                            <input value={customPill} onChange={(e) => setCustomPill(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} onKeyDown={(e) => { if (e.key === 'Enter' && customPill) { e.preventDefault(); insertPill(customPill); setCustomPill(''); setShowPillPicker(false); } }} placeholder="your_field" className="w-28 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs" />
                            <button type="button" disabled={!customPill} onClick={() => { insertPill(customPill); setCustomPill(''); setShowPillPicker(false); }} className="rounded-full bg-gray-100 px-3 py-1 text-xs disabled:opacity-50">Add field</button>
                        </div>}
                        {editorMode === 'text' ? <textarea ref={textEditorRef} placeholder="Write your message. Use the pills above for recipient data." value={body} onChange={(e) => setBody(e.target.value)} className="compose-textarea w-full h-64 outline-none resize-none text-gray-600 leading-relaxed border rounded-lg p-4" /> : <textarea ref={htmlEditorRef} placeholder="Write email-safe HTML here, then add pills directly into the markup..." value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)} className="compose-textarea w-full h-64 outline-none resize-none text-gray-600 font-mono text-sm border rounded-lg p-4" />}
                        <div className="mt-3 flex flex-wrap gap-2">
                            {attachments.map((attachment) => <span key={attachment.filename} className="text-xs bg-gray-100 rounded-full px-3 py-1">{attachment.filename}</span>)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
