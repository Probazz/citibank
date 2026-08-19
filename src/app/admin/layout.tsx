import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { AdminSidebar } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/auth/login');
  if (session.user.role !== 'ADMIN') redirect('/dashboard');

  const pendingWithdrawals = await prisma.withdrawalRequest.count({ where: { status: 'PENDING' } });

  return (
    <div className="min-h-screen bg-citi-gray-50">
      <AdminSidebar pendingWithdrawals={pendingWithdrawals} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-citi-gray-200 px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-citi-blue rounded-lg flex items-center justify-center lg:hidden">
                <span className="text-white font-black text-sm">C</span>
              </div>
              <div>
                <p className="text-sm font-bold text-citi-gray-800">Admin Control Panel</p>
                <p className="text-xs text-citi-gray-400">Citibank Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {pendingWithdrawals > 0 && (
                <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-full">
                  ⚠️ {pendingWithdrawals} pending withdrawal{pendingWithdrawals > 1 ? 's' : ''}
                </span>
              )}
              <div className="w-9 h-9 bg-citi-blue rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {session.user.firstName?.[0] || 'A'}{session.user.lastName?.[0] || ''}
                </span>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold text-citi-gray-800">
                  {session.user.firstName} {session.user.lastName}
                </p>
                <p className="text-xs text-citi-gray-400">{session.user.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-7xl mx-auto w-full">{children}</main>
        <footer className="py-4 px-6 border-t border-citi-gray-200 bg-white">
          <p className="text-xs text-citi-gray-400 text-center">
            Citibank Admin Portal — For authorized personnel only. All actions are logged and audited.
          </p>
        </footer>
      </div>
    </div>
  );
}