'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImageMsg, setProfileImageMsg] = useState({ text: '', type: '' });
  const [profileImageLoading, setProfileImageLoading] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setProfileImage(data?.profileImage || null))
      .catch(() => setProfileImage(null));
  }, []);

  async function uploadProfileImage(file: File) {
    setProfileImageLoading(true);
    setProfileImageMsg({ text: '', type: '' });
    try {
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Preview failed'));
        reader.readAsDataURL(file);
      });
      setProfileImage(preview);

      const compressedImage = await new Promise<Blob>((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const maxDimension = 512;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.82);
        };
        image.onerror = () => reject(new Error('Image could not be read'));
        image.src = URL.createObjectURL(file);
      });

      const formData = new FormData();
      formData.append('image', compressedImage, 'profile-picture.jpg');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setProfileImage(data.profileImage);
        setProfileImageMsg({ text: 'Profile picture updated.', type: 'success' });
        window.dispatchEvent(new Event('profile-image-updated'));
      } else {
        setProfileImageMsg({ text: data.error || 'Upload failed.', type: 'error' });
      }
    } catch {
      setProfileImageMsg({ text: 'Unable to upload the profile picture. Please try again.', type: 'error' });
    } finally {
      setProfileImageLoading(false);
    }
  }

  async function selectProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
      setProfileImageMsg({ text: 'Choose an image up to 10 MB.', type: 'error' });
      return;
    }

    setProfileImageFile(file);
    await uploadProfileImage(file);
  }

  async function saveProfileImage() {
    if (profileImageFile) await uploadProfileImage(profileImageFile);
  }

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

      <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
        <div className="w-full flex-shrink-0 lg:w-52">
          <nav className="grid grid-cols-2 gap-1 lg:block lg:space-y-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab===id?'bg-citi-blue text-white':'text-citi-gray-600 hover:bg-citi-gray-100'}`}>
                <div className="flex items-center gap-2"><Icon className="w-4 h-4"/>{label}</div>
                <ChevronRight className="w-3 h-3 opacity-60"/>
              </button>
            ))}
          </nav>
        </div>

        <div className="min-w-0 flex-1">
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl border border-citi-gray-200 p-4 sm:p-6 animate-fade-in">
              <h2 className="text-lg font-bold mb-6">Personal Information</h2>
              <div className="flex items-center gap-4 mb-8 p-4 bg-citi-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-citi-blue rounded-full flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-xl">{session?.user?.firstName?.[0]}{session?.user?.lastName?.[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-citi-gray-800">{session?.user?.firstName} {session?.user?.lastName}</p>
                  <p className="break-all text-sm text-citi-gray-500">{session?.user?.email}</p>
                  <p className="text-xs text-citi-green font-medium mt-0.5">✓ Verified Account</p>
                </div>
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <label className="citi-btn-secondary w-full cursor-pointer text-center sm:w-auto">
                  Choose Profile Picture
                  <input type="file" accept="image/*" onChange={selectProfileImage} className="sr-only" />
                </label>
                <Button onClick={saveProfileImage} loading={profileImageLoading} disabled={!profileImageFile} className="w-full sm:w-auto">Save Picture</Button>
                {profileImageLoading && <span className="text-sm text-citi-gray-500">Uploading...</span>}
              </div>
              {profileImageMsg.text && (
                <p className={`text-sm mb-5 ${profileImageMsg.type === 'success' ? 'text-citi-green' : 'text-citi-red'}`}>
                  {profileImageMsg.text}
                </p>
              )}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input label="First Name" defaultValue={session?.user?.firstName} disabled />
                  <Input label="Last Name" defaultValue={session?.user?.lastName} disabled />
                </div>
                <Input label="Email Address" defaultValue={session?.user?.email} disabled />
                <p className="text-xs text-citi-gray-400">To update your information, contact support at citibanksupport4@gmail.com.</p>
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