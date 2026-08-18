import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/auth/login');

  const role = session.user.role || 'USER';
  if (role === 'ADMIN') redirect('/admin');

  const unread = await prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });

  return (
    <div className="min-h-screen bg-citi-gray-50">
      <Sidebar unread={unread} />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Topbar unread={unread} />
        <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <footer className="py-4 px-6 border-t border-citi-gray-200 bg-white">
          <p className="text-xs text-citi-gray-400 text-center">
            © {new Date().getFullYear()} Citibank, N.A. Member FDIC. Equal Housing Lender. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}