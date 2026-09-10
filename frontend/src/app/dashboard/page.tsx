"use client"
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    scheduledAt: string;
    status: string;
}

export default function DashboardPage() {
    const [emails, setEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchScheduledEmails = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/emails/scheduled`);
                setEmails(response.data);
            } catch (error) {
                console.error('Failed to fetch scheduled emails:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchScheduledEmails();
    }, []);

    if (loading) {
        return (
            <div className="empty-state p-8 text-center text-gray-400">
                Loading scheduled emails...
            </div>
        );
    }

    if (emails.length === 0) {
        return (
            <div className="empty-state p-8 text-center text-gray-400">
                <p className="text-lg mb-2">No scheduled emails yet</p>
                <p className="text-sm">Click "Compose" to schedule your first email</p>
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
                            <span className="email-status bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1 shrink-0">
                                <span className="w-2 h-2 rounded-full border border-orange-400"></span> 
                                {new Date(email.scheduledAt).toLocaleString()}
                            </span>
                            <span className="font-bold text-sm truncate">{email.subject} - </span>
                            <span className="text-gray-400 text-sm truncate">{email.body}</span>
                        </div>

                        <button 
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-300 hover:text-orange-400 transition-colors"
                        >
                            <Star size={18} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
