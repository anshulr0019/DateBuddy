'use client';

import { useEffect, useState } from 'react';

/* Height of the on-screen keyboard overlaying the layout viewport.
   iOS Safari does not shrink `dvh` when the keyboard opens, so a fixed-bottom
   composer ends up underneath it — visualViewport is the only reliable signal. */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      const overlap = window.innerHeight - vv.height - vv.offsetTop;
      setInset(overlap > 40 ? Math.round(overlap) : 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
}
