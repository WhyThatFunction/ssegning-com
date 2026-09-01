/**
 * Inline empty/degraded-state indicator. Per house design philosophy, empty
 * states are a single inline status line in the surrounding type scale, not
 * a centered placard — this keeps a "no content yet" page from reading as
 * broken.
 */
export function StatusLine({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-ink-muted" role="status">
      {children}
    </p>
  );
}
