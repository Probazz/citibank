import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SUPPORTED_CURRENCIES = [
  'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SGD', 'INR', 'NGN', 'MXN',
  'BRL', 'CNY', 'KRW', 'NZD', 'ZAR', 'NOK', 'SEK', 'DKK', 'PLN', 'TRY', 'AED', 'SAR', 'HKD',
] as const;

export async function GET(request: NextRequest) {
  try {
    const requestedCurrencies = request.nextUrl.searchParams.get('symbols')?.split(',') || [];
    const currencies = requestedCurrencies.filter((currency): currency is (typeof SUPPORTED_CURRENCIES)[number] =>
      SUPPORTED_CURRENCIES.includes(currency as (typeof SUPPORTED_CURRENCIES)[number]),
    );
    const selectedCurrencies = currencies.length ? [...new Set(currencies)] : ['EUR', 'GBP', 'JPY', 'CAD'];
    const response = await fetch(
      `https://open.er-api.com/v6/latest/USD?symbols=${selectedCurrencies.join(',')}`,
      { cache: 'no-store' },
    );

    if (!response.ok) {
      throw new Error(`Exchange rate provider returned ${response.status}`);
    }

    const data = await response.json();
    const rates = selectedCurrencies.map((currency) => ({
      currency,
      rate: data.rates?.[currency],
    })).filter((item) => typeof item.rate === 'number');

    if (!rates.length) {
      throw new Error('Exchange rate provider returned no rates');
    }

    return NextResponse.json({
      base: 'USD',
      rates,
      updatedAt: data.time_last_update_utc || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    return NextResponse.json({ error: 'Live exchange rates are unavailable.' }, { status: 502 });
  }
}