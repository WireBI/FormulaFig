'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('google_token');
    if (!token) {
      router.push('/login');
    } else {
      router.push('/reports/self-service');
    }
  }, [router]);

  return null;
}
