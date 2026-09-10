import Link from 'next/link';

const sections = [
    ['1. Connect SMTP', 'Open SMTP setup and add the host, port, username, password, and optional from name for the mailbox that should send your campaigns.'],
    ['2. Import your audience', 'Upload a CSV with an email column and any fields you want to personalize, such as name, company, plan, or renewal_date. Each column becomes a data pill.'],
    ['3. Write once, personalize safely', 'Use the Add data pill action or type {{name}}, {{company}}, and other column names. Missing values become blank, so a campaign does not leak placeholder syntax to a recipient.'],
    ['4. Design HTML email', 'Switch the editor to HTML for email-safe markup. Keep styles inline, use a table-based layout for older clients, and always provide a text body for accessibility and deliverability.'],
    ['5. Attach and schedule', 'Attach files directly in the composer, choose a template, set a start time, and tune the hourly limit and delay between messages. BullMQ keeps the schedule durable across restarts.'],
];

export default function DocsPage() {
    return <section className="page-surface max-w-4xl mx-auto">
        <div className="mb-10"><p className="text-xs uppercase tracking-[.2em] text-gray-400 mb-2">Reachbox guide</p><h1 className="text-4xl font-semibold">A calmer way to send useful email</h1><p className="text-gray-500 mt-3 max-w-2xl">Set up a sender once, keep your content reusable, and let the queue handle pacing, personalization, attachments, and delivery status.</p></div>
        <div className="grid gap-4">{sections.map(([title, text]) => <article key={title} className="glass-card p-6"><h2 className="text-lg font-semibold">{title}</h2><p className="text-gray-600 mt-2 leading-7">{text}</p></article>)}</div>
        <div className="glass-card p-6 mt-8 bg-green-950 text-white"><h2 className="text-lg font-semibold">The 500 error checklist</h2><p className="text-green-100 mt-2 leading-7">Start PostgreSQL and Redis, create backend/.env with DATABASE_URL, run <code>npx prisma db push</code> and <code>npx prisma generate</code>, then restart the backend. The dashboard list endpoints depend on PostgreSQL.</p></div>
        <Link href="/dashboard/compose" className="btn-primary inline-block mt-8">Open composer</Link>
    </section>;
}
