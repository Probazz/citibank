'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginCredentials = {
    email: string;
    password: string;
};

export default function LoginOtpPage() {
    const router = useRouter();
    const [credentials, setCredentials] = useState<LoginCredentials | null>(null);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const stored = sessionStorage.getItem('citi-login-credentials');
        if (!stored) {
            router.replace('/auth/login');
            return;
        }

        try {
            setCredentials(JSON.parse(stored) as LoginCredentials);
        } catch {
            sessionStorage.removeItem('citi-login-credentials');
            router.replace('/auth/login');
        }
    }, [router]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!credentials || otp.length !== 6) {
            setError('Enter the 6-digit verification code.');
            return;
        }

        setLoading(true);
        setError('');
        const res = await signIn('credentials', { ...credentials, otp, redirect: false });

        if (res?.error === 'ACCOUNT_SUSPENDED') {
            sessionStorage.removeItem('citi-login-credentials');
            setError('Your account has been suspended. Contact support.');
            setLoading(false);
            return;
        }

        if (res?.error) {
            setError(res.error === 'INVALID_OTP' ? 'Invalid or expired verification code.' : 'Invalid email or password.');
            setLoading(false);
            return;
        }

        sessionStorage.removeItem('citi-login-credentials');
        router.push('/dashboard');
        router.refresh();
    }

    async function resendCode() {
        if (!credentials) return;
        setResending(true);
        setError('');
        const res = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, type: 'login' }),
        });
        const data = await res.json();
        setResending(false);
        if (!res.ok) {
            setError(data.error || 'Unable to resend verification code.');
            return;
        }
        setOtp('');
    }

    return (
        <div className="min-h-screen bg-citi-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="flex items-center mb-1 -mt-3 justify-center">
                    <img
                        src="/citibank-logo3.png"
                        alt="Citibank"
                        className="w-20 h-30 object-contain"
                    />
                </div>

                <div className="bg-white rounded-2xl border border-citi-gray-200 p-8">
                    <ShieldCheck className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-black text-citi-gray-800 text-center mb-2">Verify your sign in</h1>
                    <p className="text-citi-gray-500 text-sm text-center mb-6">
                        Enter the 6-digit code sent to <strong>{credentials?.email || 'your email'}</strong>.
                    </p>

                    {error && (
                        <div className="flex items-center gap-3 p-3 bg-citi-red-light rounded-lg mb-5">
                            <AlertCircle className="w-4 h-4 text-citi-red flex-shrink-0" />
                            <p className="text-sm text-citi-red">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Verification Code"
                            type="text"
                            inputMode="numeric"
                            placeholder="000000"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl font-mono tracking-widest"
                            required
                        />
                        <Button type="submit" loading={loading} fullWidth>Verify & Sign In</Button>
                    </form>

                    <div className="flex items-center justify-between mt-5 text-sm">
                        <button type="button" onClick={resendCode} disabled={resending} className="text-citi-blue hover:underline disabled:opacity-50">
                            {resending ? 'Sending...' : 'Resend code'}
                        </button>
                        <Link href="/auth/login" className="inline-flex items-center gap-1 text-citi-gray-500 hover:underline">
                            <ArrowLeft className="w-4 h-4" /> Back
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
