'use client';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { User, Shield, Bell, ChevronRight, Lock, CheckCircle, AlertCircle, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [pin, setPin]         = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinMsg, setPinMsg]   = useState({ text: '', type: '' });
  const [darkMode, setDarkMode] = useState(false);

  const tabs = [
    { id: 'profile',  label: 'Profile',  icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'pin',      label: 'Transaction PIN', icon: Lock },
    { id: 'alerts',   label: 'Alerts',   icon: Bell },
  ];

  async function savePin() {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setPinMsg({ text: 'PIN must be exactly 4 digits.', type: 'error' }); return; }
    if (pin !== confirmPin) { setPinMsg({ text: 'PINs do not match.', type: 'error' }); return; }
    setPinLoading(true); setPinMsg({ text: '', type: '' });
    const res  = await fetch('/api/auth/setup-pin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin, currentPin }) });
    const data = await res.json();
    setPinLoading(false);
    if (res.ok) { setPinMsg({ text: '✓ Transaction PIN set successfully!', type: 'success' }); setPin(''); setCurrentPin(''); setConfirmPin(''); }
    else setPinMsg({ text: data.error, type: 'error' });
  }

  function toggleDarkMode() {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark', !darkMode);
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-citi-gray-800">Account Settings</h1>
        <p className="text-citi-gray-500 text-sm mt-1">Manage your account preferences and security</p>
      </div>

      <div className="flex gap-6">
        <div className="w-52 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab===id?'bg-citi-blue text-white':'text-citi-gray-600 hover:bg-citi-gray-100'}`}>
                <div className="flex items-center gap-2"><Icon className="w-4 h-4"/>{label}</div>
                <ChevronRight className="w-3 h-3 opacity-60"/>
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-6">Personal Information</h2>
              <div className="flex items-center gap-4 mb-8 p-4 bg-citi-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-citi-blue rounded-full flex items-center justify-center">
                  <span className="text-white font-black text-xl">{session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}</span>
                </div>
                <div>
                  <p className="font-bold text-citi-gray-800">{session?.user?.firstName} {session?.user?.lastName}</p>
                  <p className="text-sm text-citi-gray-500">{session?.user?.email}</p>
                  <p className="text-xs text-citi-green font-medium mt-0.5">✓ Verified Account</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" defaultValue={session?.user?.firstName} disabled />
                  <Input label="Last Name" defaultValue={session?.user?.lastName} disabled />
                </div>
                <Input label="Email Address" defaultValue={session?.user?.email} disabled />
                <p className="text-xs text-citi-gray-400">To update your information, contact support at 1-800-374-9700.</p>
              </div>
            </div>
          )}

          {activeTab === 'pin' && (
            <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-2">Transaction PIN</h2>
              <p className="text-sm text-citi-gray-500 mb-6">Your PIN is required to authorize all transfers and payments.</p>
              {pinMsg.text && (
                <div className={`flex items-center gap-2 p-3 rounded-lg mb-5 ${pinMsg.type==='success'?'bg-citi-green-light text-citi-green':'bg-citi-red-light text-citi-red'}`}>
                  {pinMsg.type==='success'?<CheckCircle className="w-4 h-4"/>:<AlertCircle className="w-4 h-4"/>}
                  <p className="text-sm font-medium">{pinMsg.text}</p>
                </div>
              )}
              <div className="space-y-4">
                <Input label="Current PIN (if changing)" type="password" placeholder="Current 4-digit PIN" maxLength={4} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g,'').slice(0,4))} hint="Leave blank if setting PIN for the first time" />
                <Input label="New PIN *" type="password" placeholder="4-digit PIN" maxLength={4} value={pin} onChange={e => setPin(e.target.value.replace(/\D/g,'').slice(0,4))} />
                <Input label="Confirm New PIN *" type="password" placeholder="Repeat PIN" maxLength={4} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g,'').slice(0,4))} />
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-xs text-yellow-700 font-medium">⚠️ Never share your PIN with anyone. Citi will never ask for your PIN.</p>
                </div>
                <Button onClick={savePin} loading={pinLoading} fullWidth>Save Transaction PIN</Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-6">Security Settings</h2>
              <div className="space-y-3">
                {[
                  { label:'Two-Factor Authentication', desc:'OTP sent to your email on every login', badge:'Active', color:'text-citi-green' },
                  { label:'Login Alerts', desc:'Email notification on new sign-ins', badge:'Active', color:'text-citi-green' },
                  { label:'Transaction PIN', desc:'Required for all transfers', badge:'Required', color:'text-citi-blue' },
                ].map(({ label, desc, badge, color }) => (
                  <div key={label} className="flex items-center justify-between p-4 border border-citi-gray-200 rounded-xl">
                    <div><p className="text-sm font-semibold">{label}</p><p className="text-xs text-citi-gray-400 mt-0.5">{desc}</p></div>
                    <span className={`text-xs font-bold ${color}`}>{badge}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="bg-white rounded-2xl border border-citi-gray-200 p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-2">Preferences</h2>
              <div className="space-y-0 divide-y divide-citi-gray-100">
                {/* Dark mode */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <Moon className="w-4 h-4 text-citi-gray-500" />
                    <div><p className="text-sm font-semibold">Dark Mode</p><p className="text-xs text-citi-gray-400">Switch to dark theme</p></div>
                  </div>
                  <label className="relative inline-flex cursor-pointer">
                    <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer"/>
                    <div className="w-11 h-6 bg-citi-gray-200 rounded-full peer peer-checked:bg-citi-blue transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
                  </label>
                </div>
                {['Transaction Alerts','Low Balance Warning','Login Notifications','Withdrawal Updates'].map(label => (
                  <div key={label} className="flex items-center justify-between py-4">
                    <p className="text-sm font-medium">{label}</p>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer"/>
                      <div className="w-11 h-6 bg-citi-gray-200 rounded-full peer peer-checked:bg-citi-blue transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-transform peer-checked:after:translate-x-5"/>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}