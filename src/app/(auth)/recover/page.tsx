import { useState } from 'react';

import { createClient } from '@/utils/supabase/client';

export default function RecoverPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRecover(formData: FormData) {
    setError(null);
    const email = formData.get('email') as string;
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/recover` : undefined,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <form className="flex flex-col gap-2 w-80" action={handleRecover}>
        <label htmlFor="email">Email:</label>
        <input id="email" name="email" type="email" required className="border rounded px-2 py-1" />
        <button className="bg-blue-600 text-white rounded px-4 py-2 mt-2 hover:bg-blue-700 transition-colors">
          Send recovery email
        </button>
      </form>
      {sent && <div className="text-green-600">Check your email for a recovery link.</div>}
      {error && <div className="text-red-600">{error}</div>}
      <a href="/login" className="text-blue-600 hover:underline">
        Back to login
      </a>
    </div>
  );
}
