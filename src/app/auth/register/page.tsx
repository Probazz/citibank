'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { User, Mail, Lock, Phone, MapPin, Calendar, Eye, EyeOff, CheckCircle, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const steps = ['Personal Info', 'Contact Details', 'Password', 'Transaction PIN'];

export default function RegisterPage() {
  const router  = useRouter();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [showPass, setShowPass] = useState(false);
  const [userId, setUserId] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '',
    email: '', phone: '', address: '', city: '', state: '',
    password: '', confirmPassword: '',
  });
  const [pin, setPin]         = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const update = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  async function handleRegister() {
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Registration failed.'); setLoading(false); return; }
      // Sign in to get session
      await signIn('credentials', { email: form.email, password: form.password, redirect: false });
      setUserId(data.user.id);
      setLoading(false);
      setStep(3); // Go to PIN setup
    } catch { setError('Something went wrong.'); setLoading(false); }
  }

  async function handleSetPin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError('PIN must be exactly 4 digits.'); return; }
    if (pin !== confirmPin) { setError('PINs do not match.'); return; }
    setLoading(true); setError('');
    const res  = await fetch('/api/auth/setup-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'Failed to set PIN.'); return; }
    router.push('/dashboard');
  }

  function skipPin() { router.push('/dashboard'); }

  function nextStep() {
    setError('');
    if (step === 0 && (!form.firstName || !form.lastName)) { setError('Please fill in your name.'); return; }
    if (step === 1 && (!form.email || !form.phone)) { setError('Please fill in email and phone.'); return; }
    if (step === 2) { handleRegister(); return; }
    if (step === 3) { handleSetPin(); return; }
    setStep(s => s + 1);
  }

  return (
    <div className="min-h-screen bg-citi-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-citi-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-black">C</span>
            </div>
            <span className="text-xl font-bold text-citi-blue">Citi</span>
          </div>
          <h1 className="text-3xl font-black text-citi-gray-800">Open your account</h1>
          <p className="text-citi-gray-500 mt-2">It takes less than 3 minutes</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i < step ? 'bg-citi-green text-white' : i === step ? 'bg-citi-blue text-white' : 'bg-citi-gray-200 text-citi-gray-500'}`}>
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium hidden sm:block ${i === step ? 'text-citi-blue' : 'text-citi-gray-400'}`}>{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-citi-green' : 'bg-citi-gray-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-citi-gray-200 p-8">
          {error && <div className="p-3 bg-citi-red-light border border-red-200 rounded-lg mb-5 text-sm text-citi-red font-medium">{error}</div>}

          {/* Step 0 - Personal */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-citi-gray-800 mb-5">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" placeholder="James" value={form.firstName} onChange={e => update('firstName', e.target.value)} leftIcon={<User className="w-4 h-4"/>} />
                <Input label="Last Name" placeholder="Wilson" value={form.lastName} onChange={e => update('lastName', e.target.value)} />
              </div>
              <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={e => update('dateOfBirth', e.target.value)} leftIcon={<Calendar className="w-4 h-4"/>} hint="You must be 18 or older" />
            </div>
          )}

          {/* Step 1 - Contact */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-citi-gray-800 mb-5">Contact Details</h2>
              <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} leftIcon={<Mail className="w-4 h-4"/>} />
              <Input label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={e => update('phone', e.target.value)} leftIcon={<Phone className="w-4 h-4"/>} />
              <Input label="Street Address" placeholder="123 Main Street" value={form.address} onChange={e => update('address', e.target.value)} leftIcon={<MapPin className="w-4 h-4"/>} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="City" placeholder="New York" value={form.city} onChange={e => update('city', e.target.value)} />
                <Input label="State" placeholder="NY" value={form.state} onChange={e => update('state', e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 2 - Password */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-bold text-citi-gray-800 mb-5">Create Password</h2>
              <Input label="Password" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => update('password', e.target.value)}
                leftIcon={<Lock className="w-4 h-4"/>}
                rightIcon={<button type="button" onClick={() => setShowPass(!showPass)}>{showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}
                hint="Use at least 8 characters with numbers and symbols" />
              <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} leftIcon={<Lock className="w-4 h-4"/>} />
              <div className="p-4 bg-citi-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-citi-blue font-medium">✓ 256-bit SSL encryption protects your account</p>
                <p className="text-xs text-citi-blue mt-1">✓ FDIC insured up to $250,000</p>
              </div>
            </div>
          )}

          {/* Step 3 - PIN Setup */}
          {step === 3 && (
            <div className="animate-fade-in text-center">
              <div className="w-16 h-16 bg-citi-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-citi-blue" />
              </div>
              <h2 className="text-xl font-bold text-citi-gray-800 mb-2">Set Transaction PIN</h2>
              <p className="text-citi-gray-500 text-sm mb-6">Your 4-digit PIN will be required for all transfers and payments.</p>

              <div className="space-y-4 text-left mb-6">
                <Input label="Create 4-Digit PIN" type="password" placeholder="••••" maxLength={4}
                  value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="text-center text-2xl font-mono tracking-widest" />
                <Input label="Confirm PIN" type="password" placeholder="••••" maxLength={4}
                  value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="text-center text-2xl font-mono tracking-widest" />
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-6 text-left">
                <p className="text-xs text-yellow-700">⚠️ Never share your PIN. Citi will never ask for it.</p>
              </div>

              <div className="flex gap-3">
                <Button variant="ghost" fullWidth onClick={skipPin}>Skip for now</Button>
                <Button fullWidth loading={loading} onClick={handleSetPin} disabled={pin.length !== 4 || confirmPin.length !== 4}>
                  Set PIN & Continue
                </Button>
              </div>
            </div>
          )}

          {/* Navigation */}
          {step < 3 && (
            <div className="flex gap-3 mt-8">
              {step > 0 && (
                <Button variant="ghost" onClick={() => setStep(s => s - 1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
              )}
              <Button onClick={nextStep} loading={loading} fullWidth={step === 0} className="flex-1">
                {step === 2 ? 'Create Account' : 'Continue'}
                {step < 2 && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-citi-gray-500 mt-6">
          Already have an account? <Link href="/auth/login" className="text-citi-blue font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}