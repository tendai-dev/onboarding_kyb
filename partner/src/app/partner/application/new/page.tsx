"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPartnerApplicationPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to enhanced application page that uses Entity Configuration Service
    router.replace('/partner/application/enhanced');
  }, [router]);

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      Redirecting to enhanced application form...
    </div>
  );
}
