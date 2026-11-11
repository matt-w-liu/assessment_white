'use client';

import { useEffect, useState } from 'react';

/** Time-of-day greeting in the viewer's own time zone (the server's clock would be UTC). */
export default function Greeting({ firstName }: { firstName: string }) {
  const [part, setPart] = useState<string | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    setPart(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  return <>{part ? `${part}, ${firstName}` : `Hi, ${firstName}`}</>;
}
