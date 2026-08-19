'use client';
import { useEffect, useState, useCallback } from 'react';
import { Search, DollarSign, Snowflake, ShieldCheck, Edit, Eye, Trash2 } from 'lucide-react';
import { FundModal } from '@/components/admin/fund-modal';
import { Badge, Toast, useToast } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [total, setTotal]       = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [fundOpen, setFundOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<any>(null);
  const [editBalanceUser, setEditBalanceUser] = useState<any>(null);
  const [newBalance, setNewBalance] = useState('');
  const [newSavings, setNewSavings] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '15', search });
    const res    = await fetch(`/api/admin/users?${params}`);
    const data   = await res.json();
    setUsers(data.users || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 400); return () => clearTimeout(t); }, [search]);

  async function toggleStatus(user: any) {
    const newStatus = user.account?.status === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
    setActionLoading(user.id);
    const res  = await fetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, status: newStatus, action: newStatus === 'FROZEN' ? 'FREEZE' : 'UNFREEZE' }) });
    const data = await res.json();
    setActionLoading('');
    if (res.ok) { showToast(data.message, 'success'); load(); }
    else showToast(data.error || 'Action failed.', 'error');
  }

  async function saveBalance() {
    if (!editBalanceUser) return;
    setActionLoading('balance');
    const res  = await fetch('/api/admin/edit-balance', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: editBalanceUser.id, balance: newBalance, savingsBalance: newSavings }) });
    const data = await res.json();
    setActionLoading('');
    if (res.ok) { showToast('Balance updated!', 'success'); setEditBalanceUser(null); load(); }
    else showToast(data.error || 'Failed.', 'error');
  }

  async function deleteUser(user: any) {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName} and all related records? This cannot be undone.`)) return;
    setActionLoading(`delete-${user.id}`);
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    const data = await res.json();
    setActionLoading('');
    if (res.ok) showToast(data.message, 'success');
    else showToast(data.error || 'Delete failed.', 'error');
    if (res.ok) load();
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-citi-gray-800">Users Management</h1>
          <p className="text-citi-gray-500 text-sm mt-1">{total} registered users</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-citi-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..." className="citi-input pl-10" />
      </div>

      <div className="bg-white rounded-2xl border border-citi-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-citi-gray-200 bg-citi-gray-50">
                {['User','Account Number','Balance','Status','Joined','Actions'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-citi-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center"><div className="animate-spin w-8 h-8 border-2 border-citi-blue border-t-transparent rounded-full mx-auto"/></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-citi-gray-400 text-sm">No users found</td></tr>
              ) : users.map(user => (
                <tr key={user.id} className="border-b border-citi-gray-100 hover:bg-citi-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-citi-blue rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{user.firstName[0]}{user.lastName[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-citi-gray-800">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-citi-gray-400">{user.email}</p>
                        {user.phone && <p className="text-xs text-citi-gray-400">{user.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-mono font-bold text-citi-blue">{user.account?.accountNumber || '—'}</span>
                    <p className="text-xs text-citi-gray-400">RTG: {user.account?.routingNumber || '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm font-bold text-citi-gray-800">{formatCurrency(user.account?.balance || 0)}</span>
                    <p className="text-xs text-citi-gray-400">Savings: {formatCurrency(user.account?.savingsBalance || 0)}</p>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={user.account?.status === 'ACTIVE' ? 'success' : user.account?.status === 'FROZEN' ? 'warning' : 'error'}>
                      {user.account?.status || 'NO ACCOUNT'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-citi-gray-500">{formatDateTime(user.createdAt)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button size="sm" variant="secondary" onClick={() => { setSelected({ ...user, balance: user.account?.balance || 0 }); setFundOpen(true); }}>
                        <DollarSign className="w-3.5 h-3.5"/> Fund
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditBalanceUser(user); setNewBalance(String(user.account?.balance||0)); setNewSavings(String(user.account?.savingsBalance||0)); }}>
                        <Edit className="w-3.5 h-3.5"/> Balance
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setDetailUser(user)}>
                        <Eye className="w-3.5 h-3.5"/> View
                      </Button>
                      <Button size="sm" variant={user.account?.status==='ACTIVE'?'danger':'ghost'} loading={actionLoading===user.id} onClick={() => toggleStatus(user)}>
                        {user.account?.status==='ACTIVE'?<><Snowflake className="w-3.5 h-3.5"/>Freeze</>:<><ShieldCheck className="w-3.5 h-3.5"/>Unfreeze</>}
                      </Button>
                      <Button size="sm" variant="danger" loading={actionLoading===`delete-${user.id}`} onClick={() => deleteUser(user)}>
                        <Trash2 className="w-3.5 h-3.5"/>Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 15 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-citi-gray-200">
            <p className="text-sm text-citi-gray-500">Showing {Math.min(page*15,total)} of {total} users</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>Previous</Button>
              <Button size="sm" variant="ghost" onClick={() => setPage(p=>p+1)} disabled={page*15>=total}>Next</Button>
            </div>
          </div>
        )}
      </div>

      <FundModal isOpen={fundOpen} onClose={() => { setFundOpen(false); setSelected(null); }} user={selected} onSuccess={load} />

      {/* Edit Balance Modal */}
      <Modal isOpen={!!editBalanceUser} onClose={() => setEditBalanceUser(null)} title="Edit Account Balance">
        {editBalanceUser && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm font-semibold text-yellow-800">{editBalanceUser.firstName} {editBalanceUser.lastName}</p>
              <p className="text-xs text-yellow-600">{editBalanceUser.email}</p>
            </div>
            <Input label="Checking Balance ($)" type="number" step="0.01" value={newBalance} onChange={e => setNewBalance(e.target.value)} />
            <Input label="Savings Balance ($)" type="number" step="0.01" value={newSavings} onChange={e => setNewSavings(e.target.value)} />
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">⚠️ This directly sets the balance. All changes are logged in the audit trail.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setEditBalanceUser(null)}>Cancel</Button>
              <Button fullWidth loading={actionLoading==='balance'} onClick={saveBalance}>Update Balance</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* User Detail Modal */}
      <Modal isOpen={!!detailUser} onClose={() => setDetailUser(null)} title="User Details" size="lg">
        {detailUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Full Name', `${detailUser.firstName} ${detailUser.lastName}`],
                ['Email', detailUser.email],
                ['Phone', detailUser.phone || '—'],
                ['Date of Birth', detailUser.dateOfBirth || '—'],
                ['Country', detailUser.country],
                ['Address', detailUser.address || '—'],
                ['City', detailUser.city || '—'],
                ['State', detailUser.state || '—'],
                ['Account Number', detailUser.account?.accountNumber || '—'],
                ['Routing Number', detailUser.account?.routingNumber || '—'],
                ['SWIFT Code', detailUser.account?.swiftCode || 'CITIUS33'],
                ['Account Type', detailUser.account?.accountType || '—'],
                ['Checking Balance', formatCurrency(detailUser.account?.balance || 0)],
                ['Savings Balance', formatCurrency(detailUser.account?.savingsBalance || 0)],
                ['Account Status', detailUser.account?.status || '—'],
                ['Member Since', formatDateTime(detailUser.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="bg-citi-gray-50 rounded-lg p-3">
                  <p className="text-xs text-citi-gray-400 font-medium mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-citi-gray-800 break-all">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}