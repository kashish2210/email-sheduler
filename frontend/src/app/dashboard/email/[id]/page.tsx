"use client"
import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, Trash2, Archive } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

interface Email {
    id: string;
    to: string;
    subject: string;
    body: string;
    scheduledAt?: string;
    sentAt?: string;
    status: string;
    sender: {
        name: string;
        email: string;
    };
}

export default function EmailDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [email, setEmail] = useState<Email | null>(null);
    const [loading, setLoading] = useState(true);
    const unwrappedParams = use(params);

    useEffect(() => {
        const fetchEmail = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/emails/${unwrappedParams.id}`);
                setEmail(response.data);
            } catch (error) {
                console.error('Failed to fetch email:', error);
            } finally {
                setLoading(false);
            }
        };

        if (unwrappedParams.id) {
            fetchEmail();
        }
    }, [unwrappedParams.id]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-gray-400">Loading email...</p>
            </div>
        );
    }

    if (!email) {
        return (
            <div className="h-full flex flex-col items-center justify-center">
                <p className="text-gray-400 mb-4">Email not found</p>
                <Link href="/dashboard" className="text-green-600 hover:underline">
                    Back to Dashboard
                </Link>
            </div>
        );
    }

    const displayTime = email.sentAt || email.scheduledAt;
    const timeLabel = email.sentAt ? 'Sent' : 'Scheduled';

    return (
            <div className="detail-surface h-full flex flex-col bg-white">
            {/* Header */}
            <div className="detail-toolbar border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-lg font-semibold truncate max-w-2xl">{email.subject}</h1>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Star size={20} className="text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Archive size={20} className="text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <Trash2 size={20} className="text-gray-400" />
                    </button>
                </div>
            </div>

            {/* Email Content */}
            <div className="detail-content flex-1 overflow-y-auto px-12 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Sender Info */}
                    <div className="detail-sender flex items-start gap-4 mb-8">
                        <div className="detail-avatar w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                            {email.sender.name?.charAt(0) || email.sender.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {email.sender.name || 'Unknown Sender'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        &lt;{email.sender.email}&gt;
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500">
                                    {new Date(displayTime!).toLocaleString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit',
                                        hour12: true
                                    })}
                                </p>
                            </div>
                            <p className="text-sm text-gray-500">
                                to <span className="text-gray-700">{email.to}</span>
                            </p>
                        </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mb-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            email.status === 'SENT' 
                                ? 'bg-green-50 text-green-700' 
                                : email.status === 'PENDING'
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-red-50 text-red-700'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${
                                email.status === 'SENT' 
                                    ? 'bg-green-500' 
                                    : email.status === 'PENDING'
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                            }`}></span>
                            {email.status === 'SENT' ? `${timeLabel} at ${new Date(displayTime!).toLocaleString()}` : `${timeLabel} for ${new Date(displayTime!).toLocaleString()}`}
                        </span>
                    </div>

                    {/* Email Body */}
                    <div className="prose max-w-none">
                        <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {email.body}
                        </div>
                    </div>

                    {/* Metadata */}
                    <div className="mt-12 pt-6 border-t border-gray-100 text-sm text-gray-500">
                        <p><span className="font-medium">Email ID:</span> {email.id}</p>
                        <p><span className="font-medium">Status:</span> {email.status}</p>
                        {email.sentAt && (
                            <p><span className="font-medium">Sent At:</span> {new Date(email.sentAt).toLocaleString()}</p>
                        )}
                        {email.scheduledAt && (
                            <p><span className="font-medium">Scheduled At:</span> {new Date(email.scheduledAt).toLocaleString()}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}