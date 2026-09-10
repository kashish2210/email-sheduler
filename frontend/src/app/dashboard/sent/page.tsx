"use client"
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    sentAt: string;
    status: string;
}

export default function SentPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchSentEmails = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/emails/sent`);
                setEmails(response.data);
            } catch (error) {
                console.error('Failed to fetch sent emails:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSentEmails();
    }, []);

    if (loading) {
        return (
            <div className="empty-state p-8 text-center text-gray-400">
                Loading sent emails...
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="empty-state p-8 text-center text-gray-400">
                <p className="text-lg mb-2">No sent emails yet</p>
                <p className="text-sm">Emails will appear here after they are sent</p>
            </div>
        );
    }

    return (
        <div className="page-surface p-8">
            <div className="email-list flex flex-col gap-1">
                {emails.map((email) => (
                    <div 
                        key={email.id} 
                        onClick={() => router.push(`/dashboard/email/${email.id}`)}
                        className="email-row flex items-center gap-4 py-3 border-b border-gray-50 hover:bg-gray-50/50 transition-colors px-4 group cursor-pointer"
                    >
                        <div className="w-1/4">
                            <span className="email-recipient font-semibold text-sm">To: {email.to}</span>
                        </div>

                        <div className="email-preview flex-1 flex items-center gap-3">
                            <span className="email-status bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0">
                                <CheckCircle size={10} /> 
                                {new Date(email.sentAt).toLocaleString()}
                            </span>
                            <span className="font-bold text-sm truncate">{email.subject} - </span>
                            <span className="text-gray-400 text-sm truncate">{email.body}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
