'use client';

import Link, { useLinkStatus } from 'next/link';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

// Next owns the pending state, so cancellation, back/forward and modifier-clicks
// keep their normal behaviour. No timeout or manually latched "loading" state.
function NavigationFeedback() {
  const { pending } = useLinkStatus();

  return (
    <span
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`pointer-events-none absolute inset-0 flex items-center justify-center gap-1 overflow-hidden rounded-[inherit] bg-indigo-600 px-1 text-xs font-semibold text-white shadow-sm ${pending ? 'opacity-100' : 'opacity-0'}`}
      data-navigation-pending={pending ? 'true' : undefined}
    >
      {pending ? (
        <>
          <span aria-hidden="true" className="shrink-0 motion-safe:animate-spin">
            <LoaderCircle className="h-4 w-4 shrink-0" />
          </span>
          <span className="min-w-0 truncate">Açılıyor…</span>
        </>
      ) : null}
    </span>
  );
}

export function TeacherLink({ children, className = '', ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props} className={`relative ${className}`}>
      {children}
      <NavigationFeedback />
    </Link>
  );
}
