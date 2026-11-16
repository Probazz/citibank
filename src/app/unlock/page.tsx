import { ShieldCheck } from 'lucide-react';

type UnlockPageProps = {
  searchParams?: {
    error?: string;
  };
};

const errorMessages: Record<string, string> = {
  invalid: 'That invite code was not recognized. Please try again.',
  invalid_request: 'Please enter a valid invite code and try again.',
  unconfigured:
    'Access is temporarily unavailable. Please contact the site administrator.',
};

export default function UnlockPage({ searchParams }: UnlockPageProps) {
  const errorMessage = searchParams?.error
    ? errorMessages[searchParams.error]
    : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-citi-gray-50 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-citi-gray-200 bg-white p-8 shadow-card sm:p-10">
        <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-citi-blue-50 text-citi-blue">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-citi-blue">
          Citi Private Preview
        </p>
        <h1 className="text-2xl font-black leading-tight text-citi-gray-800">
          Private Staging Preview — Enter The Code Sent Your Email
        </h1>
        <p className="mt-3 text-sm leading-6 text-citi-gray-500">
          This preview is available to invited team members, investors, and
          testers. Enter your invite access code to continue.
        </p>

        <form action="/api/unlock" method="post" className="mt-8 space-y-4">
          <div>
            <label htmlFor="accessCode" className="citi-label">
              Invite Access Code
            </label>
            <input
              autoCapitalize="none"
              autoComplete="off"
              className="citi-input"
              id="accessCode"
              maxLength={256}
              name="accessCode"
              required
              spellCheck={false}
              type="password"
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-citi-red" role="alert">
              {errorMessage}
            </p>
          )}

          <button className="citi-btn-primary w-full" type="submit">
            Enter private preview
          </button>
        </form>

        <p className="mt-6 border-t border-citi-gray-200 pt-5 text-xs leading-5 text-citi-gray-400">
          Authorized access only. Please do not share your invite code.
        </p>
      </section>
    </main>
  );
}
