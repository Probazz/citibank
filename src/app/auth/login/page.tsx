'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await signIn('credentials', { ...form, redirect: false });
    if (res?.error === 'ACCOUNT_SUSPENDED') {
      setError('Your account has been suspended. Contact support.');
      setLoading(false);
      return;
    }

    if (res?.error) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-citi-blue via-citi-blue-light to-citi-blue-dark flex">
      {/* Left branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
        <div>
          <div className="flex items-center mb-12">
            <img
              src="/citibank-logo1.png"
              alt="Citibank"
              className="w-40 h-auto object-contain"
            />
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">Banking built<br />for <span className="text-[#FDE047]">you.</span></h1>
          <p className="text-blue-200 text-lg leading-relaxed max-w-md">Secure, fast, and reliable banking at your fingertips.</p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[{ label: '200M+', sub: 'Customers' }, { label: '$1.9T', sub: 'Assets' }, { label: '160+', sub: 'Countries' }].map(s => (
            <div key={s.label}><p className="text-2xl font-black text-yellow-300">{s.label}</p><p className="text-blue-200 text-sm mt-1">{s.sub}</p></div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white lg:rounded-l-3xl">
        <div className="w-full max-w-md p-10">
          <div className="flex items-center mb-12 mt-3">
            <img
              src="/citibank-logo3.png"
              alt="Citibank"
              className="w-20 h-30 object-contain"
            />
          </div>

          <>
            <h2 className="text-3xl font-black text-citi-gray-800 mb-2">Welcome back</h2>
            <p className="text-citi-gray-500 mb-8">Sign in to your Citi account</p>
            {error && (
              <div className="flex items-center gap-3 p-4 bg-citi-red-light border border-red-200 rounded-xl mb-6">
                <AlertCircle className="w-5 h-5 text-citi-red flex-shrink-0" />
                <p className="text-sm text-citi-red font-medium">{error}</p>
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} leftIcon={<Mail className="w-4 h-4" />} required />
              <div>
                <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Enter your password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={<button type="button" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>} required />
                <div className="flex justify-end mt-2">
                  <Link href="/auth/forgot-password" className="text-xs text-citi-blue font-medium hover:underline">Forgot password?</Link>
                </div>
              </div>
              <Button type="submit" loading={loading} fullWidth size="lg">Sign In to Online Banking</Button>
            </form>
            <div className="mt-8 pt-6 border-t border-citi-gray-200">
              <p className="text-center text-sm text-citi-gray-500">New to Citi? <Link href="/auth/register" className="text-citi-blue font-semibold hover:underline">Open an account</Link></p>
            </div>
            <p className="mt-6 text-center text-xs text-citi-gray-400">🔒 Protected by 256-bit SSL encryption</p>
          </>
        </div>
      </div>
    </div>
  );
}