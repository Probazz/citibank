'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Send, Download, CreditCard, RefreshCw, Eye, EyeOff, TrendingUp, DollarSign, ClipboardList, ChevronLeft, ChevronRight, Plus, X, Settings2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BankCard } from '@/components/dashboard/bank-card';
import { TransactionItem } from '@/components/dashboard/transaction-item';
import { PageLoading } from '@/components/ui/index';

const CURRENCY_OPTIONS = [
  { code: 'EUR', symbol: '€', name: 'Euro', region: 'Eurozone', flagCode: 'eu', decimals: 4 },
  { code: 'GBP', symbol: '£', name: 'British Pound', region: 'United Kingdom', flagCode: 'gb', decimals: 4 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', region: 'Japan', flagCode: 'jp', decimals: 2 },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar', region: 'Canada', flagCode: 'ca', decimals: 4 },
  { code: 'AUD', symbol: '$', name: 'Australian Dollar', region: 'Australia', flagCode: 'au', decimals: 4 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', region: 'Switzerland', flagCode: 'ch', decimals: 4 },
  { code: 'SGD', symbol: '$', name: 'Singapore Dollar', region: 'Singapore', flagCode: 'sg', decimals: 4 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', region: 'India', flagCode: 'in', decimals: 2 },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', region: 'Nigeria', flagCode: 'ng', decimals: 2 },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', region: 'Mexico', flagCode: 'mx', decimals: 4 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', region: 'Brazil', flagCode: 'br', decimals: 4 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', region: 'China', flagCode: 'cn', decimals: 4 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', region: 'South Korea', flagCode: 'kr', decimals: 2 },
  { code: 'NZD', symbol: '$', name: 'New Zealand Dollar', region: 'New Zealand', flagCode: 'nz', decimals: 4 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', region: 'South Africa', flagCode: 'za', decimals: 4 },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', region: 'Norway', flagCode: 'no', decimals: 4 },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', region: 'Sweden', flagCode: 'se', decimals: 4 },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', region: 'Denmark', flagCode: 'dk', decimals: 4 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', region: 'Poland', flagCode: 'pl', decimals: 4 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', region: 'Türkiye', flagCode: 'tr', decimals: 4 },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', region: 'United Arab Emirates', flagCode: 'ae', decimals: 4 },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', region: 'Saudi Arabia', flagCode: 'sa', decimals: 4 },
  { code: 'HKD', symbol: '$', name: 'Hong Kong Dollar', region: 'Hong Kong', flagCode: 'hk', decimals: 4 },
];
const DEFAULT_CURRENCIES = ['EUR', 'GBP', 'JPY', 'CAD'];

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [hideBalance, setHideBalance] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [mobileSlide, setMobileSlide] = useState(0);
  const [rateSlide, setRateSlide] = useState(0);
  const [exchangeRates, setExchangeRates] = useState<any[]>([]);
  const [ratesUpdatedAt, setRatesUpdatedAt] = useState('');
  const [ratesLoading, setRatesLoading] = useState(true);
  const [watchedCurrencies, setWatchedCurrencies] = useState<string[]>(DEFAULT_CURRENCIES);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  async function loadExchangeRates(currencies = watchedCurrencies) {
    setRatesLoading(true);
    try {
      const symbols = encodeURIComponent(currencies.join(','));
      const response = await fetch(`/api/exchange-rates?symbols=${symbols}`, { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json?.error || 'Unable to load rates');
      setExchangeRates(json.rates || []);
      setRatesUpdatedAt(json.updatedAt || '');
      setRateSlide(0);
    } catch {
      setExchangeRates([]);
    } finally {
      setRatesLoading(false);
    }
  }

  async function loadData() {
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json().catch(() => null);

      if (!res.ok || !json) {
        setData(null);
        setError(json?.error || 'Failed to load account data.');
      } else {
        setData(json);
        setError('');
      }
    } catch {
      setData(null);
      setError('Failed to load account data.');
    }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const savedCurrencies = window.localStorage.getItem('citi-watched-currencies');
    if (savedCurrencies) {
      try {
        const parsed = JSON.parse(savedCurrencies);
        if (Array.isArray(parsed) && parsed.length) setWatchedCurrencies(parsed);
      } catch {
        window.localStorage.removeItem('citi-watched-currencies');
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('citi-watched-currencies', JSON.stringify(watchedCurrencies));
    loadExchangeRates(watchedCurrencies);
    const refreshTimer = window.setInterval(() => loadExchangeRates(watchedCurrencies), 10 * 60 * 1000);
    return () => window.clearInterval(refreshTimer);
  }, [watchedCurrencies]);

  useEffect(() => {
    if (exchangeRates.length < 2) return;
    const carouselTimer = window.setInterval(() => {
      setRateSlide((current) => (current + 1) % exchangeRates.length);
    }, 5000);
    return () => window.clearInterval(carouselTimer);
  }, [exchangeRates.length]);

  function toggleCurrency(currency: string) {
    setWatchedCurrencies((current) => current.includes(currency)
      ? current.length === 1 ? current : current.filter((item) => item !== currency)
      : [...current, currency]);
    setShowCurrencyPicker(false);
  }

  useEffect(() => {
    const carouselTimer = window.setInterval(() => {
      setMobileSlide((current) => (current + 1) % 3);
    }, 5000);

    return () => window.clearInterval(carouselTimer);
  }, []);

  if (loading) return <PageLoading />;
  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="max-w-md rounded-2xl border border-red-200 bg-red-50 p-6 text-citi-red shadow-sm">
        <p className="text-lg font-bold">Unable to load account data</p>
        <p className="mt-2 text-sm text-red-700">{error || 'Failed to load account data.'}</p>
        <button
          onClick={() => { setLoading(true); loadData(); }}
          className="mt-4 rounded-lg bg-citi-blue px-4 py-2 text-sm font-semibold text-white hover:bg-citi-blue-dark"
        >
          Try again
        </button>
      </div>
    </div>
  );

  const { account, recentTransactions, user } = data;
  const isFrozen = account?.status === 'FROZEN';
  const isSuspended = account?.status === 'SUSPENDED';

  const quickActions = [
    { label: 'Transfer', icon: Send, href: '/dashboard/transfer', color: 'bg-white text-[#00112B] sm:bg-citi-blue sm:text-white', emoji: '💸' },
    { label: 'Withdraw', icon: Download, href: '/dashboard/withdraw', color: 'bg-white text-[#00112B] sm:bg-citi-blue sm:text-white', emoji: '🏧' },
     { label: 'Cards', icon: CreditCard, href: '/dashboard/cards', color: 'bg-white text-[#00112B] sm:bg-citi-blue sm:text-white', emoji: '📋' },
    { label: 'Loan', icon: DollarSign, href: '/dashboard/loan', color: 'bg-white text-[#00112B] sm:bg-citi-blue sm:text-white', emoji: '🏦' },
    { label: 'Pay Bills', icon: ClipboardList, href: '/dashboard/pay-bills', color: 'bg-white text-[#00112B] sm:bg-citi-blue sm:text-white', emoji: '🧾' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Account status warning */}
      {account?.status && account.status !== 'ACTIVE' && (
        <div className="p-4 bg-citi-red-light border border-red-200 rounded-xl">
          <p className="text-citi-red font-semibold text-sm">
            {isFrozen
              ? '🔒Access Denied: Your account is currently under regulatory review. Deposit-only mode is active.'
              : '⚠️ Your account is suspended. Contact support immediately at citibanksupport4@gmail.com.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="contents xl:col-span-2 sm:block sm:space-y-6">

          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 sm:-mt-4">

            {/* Checking */}
            <div className="bg-[#00112B] sm:bg-gradient-to-br sm:from-citi-blue sm:to-citi-blue-light rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-200 text-xs font-medium uppercase tracking-wide">Checking Account</p>
                    {/* FULL account number shown */}
                    {/* <p className="text-white font-serif text-sm font-bold mt-0.5 tracking-widest mb-0.1">
                      {account?.accountNumber || '—'}
                    </p>*/}
                  </div>
                  <button
                    onClick={() => setHideBalance(!hideBalance)}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="balance-amount text-3xl font-semibold tracking-tight tabular-nums">
                  {hideBalance ? '$ ••••••' : formatCurrency(account?.balance ?? 0)}
                </p>
                <p className="text-blue-200 text-xs mt-1">Available Balance</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <TrendingUp className="w-3 h-3 text-green-300" />
                    <span className="text-green-300 text-xs font-medium">{account?.status ?? 'Active'}</span>
                  </div>
                  <div
                    className="w-[35%] overflow-hidden text-right sm:hidden"
                    aria-label={`Account number ${account?.accountNumber || 'unavailable'}, routing number ${account?.routingNumber || 'unavailable'}`}
                  >
                    <div className="checking-details-marquee flex w-max whitespace-nowrap text-[8px] tabular-nums tracking-[0.08em] text-blue-200/70" aria-hidden="true">
                      <span>
                        ACC {account?.accountNumber || '—'} <span className="mx-2 text-blue-200/40">•</span> RTG {account?.routingNumber || '—'} <span className="mx-4 text-blue-200/40">•</span>
                      </span>
                      <span aria-hidden="true">
                        ACC {account?.accountNumber || '—'} <span className="mx-2 text-blue-200/40">•</span> RTG {account?.routingNumber || '—'} <span className="mx-4 text-blue-200/40">•</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Savings */}
            <div className="hidden sm:block bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-white/5" />
              <div className="relative">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wide mb-1">Savings Account</p>
                {/*<p className="text-white/70 font-mono text-xs mb-4 tracking-widest">
                  {account?.accountNumber ? account.accountNumber.slice(0, 8) + 'XX' : '—'}
                </p>*/}
                <p className="balance-amount text-3xl font-semibold tracking-tight tabular-nums mt-2">
                  {hideBalance ? '$ ••••••' : formatCurrency(account?.savingsBalance ?? 0)}
                </p>
                <p className="text-slate-400 text-xs mt-1">Available Balance</p>
                <div className="flex items-center gap-1 mt-3">
                  <span className="text-yellow-400 text-xs font-medium">APY 4.65%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Account details */}
          <div className="order-5 hidden bg-white rounded-2xl border border-citi-gray-200 p-3 sm:block sm:p-5 min-w-0">
            <h3 className="text-sm font-bold text-citi-gray-700 mb-4 uppercase tracking-wide">Account Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Number</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans tracking-wider break-all">
                  {account?.accountNumber || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Savings Account Number</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans tracking-wider break-all">
                  {account?.savingsAccountNumber || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Routing Number</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans">{account?.routingNumber ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">SWIFT Code</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5 font-sans">{account?.swiftCode ?? 'CITIUS33'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Type</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5">{account?.accountType ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Status</p>
                <p className={`text-sm font-bold mt-0.5 ${account?.status === 'ACTIVE' ? 'text-citi-green' :
                  account?.status === 'FROZEN' ? 'text-yellow-600' : 'text-citi-red'
                  }`}>
                  {account?.status ?? '—'}
                </p>
              </div>
              {/* <div>
                <p className="text-xs text-citi-gray-400 font-medium">Account Holder</p>
                <p className="text-sm font-bold text-citi-gray-800 mt-0.5">{user?.firstName} {user?.lastName}</p>
              </div>*/}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="order-2 mt-0 mb-0 bg-white rounded-2xl sm:mt-0 sm:p-5 border border-citi-gray-200">
            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 sm:gap-1 sm:p-3">
              {quickActions.map(({ label, icon: Icon, href, color, emoji }) => (
                <Link
                  key={label}
                  href={isSuspended ? '#' : href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-colors group ${isSuspended ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-105 transition-transform shadow-sm border border-citi-gray-300`}>
                    <Icon className="w-5 h-5" strokeWidth={3} />
                  </div>
                  <span className="text-xs font-medium text-citi-gray-600 text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
            {(isFrozen || isSuspended) && (
              <p className="text-xs text-citi-red text-center mt-3">
                Transactions are disabled while your account is {account?.status?.toLowerCase()}.
              </p>
            )}
          </div>

          <div className="order-3 sm:hidden relative aspect-[3/1] w-full overflow-hidden rounded-2xl border border-citi-gray-200 bg-white shadow-card">
            <div
              className="flex h-full transition-transform duration-[3000ms] ease-out"
              style={{ transform: `translateX(-${mobileSlide * 100}%)` }}
            >
              {['image3.png', 'image6.png', 'image2.png'].map((image, index) => (
                <div key={`${image}-${index}`} className="w-full min-w-full h-full flex-shrink-0">
                  <img
                    src={`/${image}`}
                    alt={`Citibank account view ${index + 1}`}
                    className="w-full h-full object-cover object-center block"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Previous account image"
              onClick={() => setMobileSlide((current) => (current === 0 ? 2 : current - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-transparent p-2 text-citi-blue shadow-sm"
            >
              <ChevronLeft className="h-4 w-4 text-white" />
            </button>
            <button
              type="button"
              aria-label="Next account image"
              onClick={() => setMobileSlide((current) => (current === 2 ? 0 : current + 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-transparent p-2 text-citi-blue shadow-sm"
            >
              <ChevronRight className="h-4 w-4 text-white" />
            </button>
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Show account image ${index + 1}`}
                  onClick={() => setMobileSlide(index)}
                  className={`h-1.5 rounded-full transition-all ${mobileSlide === index ? 'w-5 bg-citi-blue' : 'w-1.5 bg-citi-gray-400'
                    }`}
                />
              ))}
            </div>
          </div>
          
        </div>

        {/* Right column */}
        <div className="contents sm:block sm:space-y-6">

          {/* Bank Card */}
          {account?.cards?.length > 0 && (
            <div className="hidden sm:block">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-citi-gray-700 uppercase tracking-wide">My Card</h3>
                <Link href="/dashboard/cards" className="text-xs text-citi-blue font-medium hover:underline">Manage</Link>
              </div>
              <BankCard {...account.cards[0]} />
            </div>
          )}

          {/* Recent Transactions — CLICKABLE */}
          <div className="order-4 bg-white rounded-2xl border border-citi-gray-200 p-2">
            <div className="flex items-center justify-between mb-0 ml-3 mr-3">
              <h3 className="text-sm font-bold text-citi-gray-600 uppercase tracking-wide">History</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setRefreshing(true); loadData(); }}
                  className="p-1.5 rounded-lg hover:bg-citi-gray-100 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-citi-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <Link href="/dashboard/transactions" className="text-xs text-citi-blue font-medium hover:underline">
                  View all
                </Link>
              </div>
            </div>

            {!recentTransactions?.length ? (
              <div className="text-center py-8">
                <p className="text-citi-gray-400 text-sm">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTransactions.map((t: any) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/dashboard/receipt?id=${t.id}`)}
                    className="cursor-pointer hover:bg-citi-gray-50 rounded-xl transition-colors group relative"
                  >
                    <TransactionItem transaction={t} whiteIconBackground />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-4 h-4 text-citi-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live exchange rates are kept compact on mobile to sit below recent activity. */}
          <div className="order-5 sm:hidden overflow-hidden rounded-2xl border border-[#244b70] bg-gradient-to-br from-[#00112B] via-[#003B70] to-[#AF9964] p-3 text-white shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="text-[8px] font-semibold -mt-1 uppercase tracking-[0.16em] text-[#d7b56d]">Live market rates</p>
                <h3 className="-mt-[2px] -mb-1 text-[13px] text-[#D1D4D7] font-bold tracking-tight">Your currency watchlist</h3>
              </div>
              <button
                type="button"
                aria-expanded={showCurrencyPicker}
                aria-label="Customize currency watchlist"
                onClick={() => setShowCurrencyPicker((current) => !current)}
                className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] font-semibold transition-colors ${showCurrencyPicker ? 'border-[#d7b56d] bg-[#d7b56d] text-[#00112B]' : 'border-white/20 text-blue-100 hover:border-white/40 hover:bg-white/10'}`}
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize
              </button>
            </div>

            {showCurrencyPicker && (
              <div className="mb-4 rounded-xl border border-white/15 bg-black/15 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-100">Choose currencies</p>
                  <button type="button" aria-label="Close currency picker" onClick={() => setShowCurrencyPicker(false)}>
                    <X className="h-3.5 w-3.5 text-blue-200" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {CURRENCY_OPTIONS.map(({ code, name, flagCode }) => {
                    const selected = watchedCurrencies.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleCurrency(code)}
                        className={`flex min-w-0 items-center gap-2 rounded-lg border px-2 py-2 text-left transition-colors ${selected ? 'border-[#d7b56d]/70 bg-[#d7b56d]/15' : 'border-white/10 bg-white/5 hover:border-white/30'}`}
                      >
                        <img
                          src={`https://flagcdn.com/24x18/${flagCode}.png`}
                          alt=""
                          width="24"
                          height="18"
                          className="h-[18px] w-6 rounded-[2px] object-cover"
                        />
                        <span className="min-w-0 flex-1 truncate text-[10px] font-medium">{name}</span>
                        {selected ? <span className="text-[10px] text-[#d7b56d]">Added</span> : <Plus className="h-3 w-3 text-blue-200" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[9px] text-blue-200">Tap a currency to add or remove it from your carousel.</p>
              </div>
            )}

            {ratesLoading && !exchangeRates.length ? (
              <div className="flex h-14 items-center justify-center text-xs text-blue-200">Updating rates...</div>
            ) : exchangeRates.length ? (
              <>
                <div className="flex overflow-hidden">
                  <div
                    className="flex w-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${rateSlide * 100}%)` }}
                  >
                    {exchangeRates.map(({ currency, rate }) => {
                      const currencyInfo = CURRENCY_OPTIONS.find((option) => option.code === currency) || CURRENCY_OPTIONS[0];
                      return (
                      <div key={currency} className="w-full min-w-full flex-shrink-0">
                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://flagcdn.com/40x30/${currencyInfo.flagCode}.png`}
                                alt={`${currencyInfo.name} flag`}
                                width="30"
                                height="22"
                                className="h-[22px] w-[30px] rounded-[3px] object-cover shadow-sm"
                              />
                                <p className="text-lg font-bold tracking-tight">{currency} <span className="font-medium text-blue-200">{currencyInfo.symbol}</span></p>
                              </div>
                              <p className="mt-1 text-xs text-blue-200">{currencyInfo.name} · 1 USD buys</p>
                          </div>
                            <p className="text-2xl font-semibold tabular-nums">{currencyInfo.symbol}{rate.toFixed(currencyInfo.decimals)}</p>
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-blue-200">
                    Updated {ratesUpdatedAt ? new Date(ratesUpdatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'just now'}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="Previous exchange rate"
                      onClick={() => setRateSlide((current) => current === 0 ? exchangeRates.length - 1 : current - 1)}
                      className="mr-1 rounded-full p-1 text-blue-200 hover:bg-white/10"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    {exchangeRates.map(({ currency }: { currency: string }, index: number) => (
                      <button
                        key={currency}
                        type="button"
                        aria-label={`Show USD to ${currency} rate`}
                        onClick={() => setRateSlide(index)}
                        className={`h-1.5 rounded-full transition-all ${rateSlide === index ? 'w-5 bg-white' : 'w-1.5 bg-blue-300/50'}`}
                      />
                    ))}
                    <button
                      type="button"
                      aria-label="Next exchange rate"
                      onClick={() => setRateSlide((current) => (current + 1) % exchangeRates.length)}
                      className="ml-1 rounded-full p-1 text-blue-200 hover:bg-white/10"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-14 items-center justify-center text-xs text-blue-200">Rates unavailable right now.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}