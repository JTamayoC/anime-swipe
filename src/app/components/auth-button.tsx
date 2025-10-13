'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { GoogleIcon } from './icons';

import type { Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
const callbackUrl = process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL;

if (!supabaseUrl) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_URL is not defined. Please set it in your environment.'
  );
}
if (!supabaseKey) {
  throw new Error(
    'Environment variable NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not defined. Please set it in your environment.'
  );
}

export function AuthButton() {
  const [session, setSession] = useState<Session | null>(null);

  const supabase = createBrowserClient(supabaseUrl as string, supabaseKey as string);
  const router = useRouter();

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
      },
    });
    if (error) {
      console.error('Error during sign-in:', error.message);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    router.refresh();
    if (error) {
      console.error('Error during sign-out:', error.message);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    };

    void getSession();
  }, [supabase.auth]);

  return (
    <header>
      {session === null ? (
        <button
          onClick={() => {
            void handleSignIn();
          }}
          type="button"
          className="text-white bg-[#4285F4] hover:bg-[#4285F4]/90 focus:ring-4 focus:outline-none focus:ring-[#4285F4]/50 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center me-2 mb-2"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      ) : (
        <button
          onClick={() => {
            void handleSignOut();
          }}
          type="button"
        >
          Sign Out
        </button>
      )}
    </header>
  );
}
