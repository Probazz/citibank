'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ShieldCheck, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Step = 'email' | 'otp' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]   = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp]     = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function sendOTP() {
    if (!email) { setError('Enter your email address.'); return; }
    setLoading(true); setError('');
    const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, type: 'reset' }) });
    setLoading(false);
    setStep('otp');
  }

  async function verifyOTP() {
    if (otp.length !== 6) { setError('Enter the 6-digit code.'); return; }
    setLoading(true); setError('');
    const res  = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, type: 'check' }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep('password');
  }

  async function resetPassword() {
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    const res  = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, type: 'reset', newPassword: password }) });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setStep('done');
  }

  return (
    <div className="min-h-screen bg-citi-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <div className="w-9 h-9 bg-citi-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-black">C</span>
            </div>
            <span className="text-xl font-bold text-citi-blue">Citi</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-citi-gray-200 p-8">
          {error && (
            <div className="flex items-center gap-3 p-3 bg-citi-red-light rounded-lg mb-5">
              <AlertCircle className="w-4 h-4 text-citi-red flex-shrink-0" />
              <p className="text-sm text-citi-red">{error}</p>
            </div>
          )}

          {step === 'email' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-black text-citi-gray-800 mb-2">Forgot password?</h2>
              <p className="text-citi-gray-500 text-sm mb-6">Enter your email and we'll send a verification code.</p>
              <Input label="Email Address" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} leftIcon={<Mail className="w-4 h-4"/>} />
              <Button onClick={sendOTP} loading={loading} fullWidth className="mt-5">Send Verification Code</Button>
            </div>
          )}

          {step === 'otp' && (
            <div className="animate-fade-in text-center">
              <ShieldCheck className="w-12 h-12 text-citi-blue mx-auto mb-4" />
              <h2 className="text-2xl font-black text-citi-gray-800 mb-2">Check your email</h2>
              <p className="text-citi-gray-500 text-sm mb-6">Enter the code sent to <strong>{email}</strong></p>
              <Input label="6-Digit Code" type="text" placeholder="000000" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} className="text-center text-2xl font-mono tracking-widest" />
              <Button onClick={verifyOTP} loading={loading} fullWidth className="mt-5">Verify Code</Button>
              <button onClick={() => { setStep('email'); setOtp(''); }} className="text-sm text-citi-gray-500 hover:underline mt-3 block mx-auto">← Back</button>
            </div>
          )}

          {step === 'password' && (
            <div className="animate-fade-in">
              <Lock className="w-12 h-12 text-citi-blue mx-auto mb-4" />
              <h2 className="text-2xl font-black text-citi-gray-800 mb-2 text-center">New password</h2>
              <p className="text-citi-gray-500 text-sm mb-6 text-center">Choose a strong new password.</p>
              <div className="space-y-4">
                <Input label="New Password" type={showPass?'text':'password'} placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)}
                  rightIcon={<button type="button" onClick={()=>setShowPass(!showPass)}>{showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>} />
                <Input label="Confirm Password" type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              <Button onClick={resetPassword} loading={loading} fullWidth className="mt-5">Reset Password</Button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center animate-fade-in">
              <CheckCircle className="w-16 h-16 text-citi-green mx-auto mb-4" />
              <h2 className="text-2xl font-black text-citi-gray-800 mb-2">Password Reset!</h2>
              <p className="text-citi-gray-500 mb-6">Your password has been updated successfully.</p>
              <Button onClick={() => router.push('/auth/login')} fullWidth>Sign In Now</Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-citi-gray-500 mt-6">
          Remember it? <Link href="/auth/login" className="text-citi-blue font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}