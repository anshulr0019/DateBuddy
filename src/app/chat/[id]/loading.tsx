export default function ChatLoading() {
  return (
    <div className="flex h-dvh flex-col bg-infyn-paper" role="status" aria-label="Opening conversation">
      <div className="flex items-center gap-3 border-b border-infyn-border/70 px-5 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <div className="h-10 w-10 rounded-full bg-infyn-surface-soft animate-pulse" />
        <div className="h-11 w-11 rounded-full bg-infyn-surface-soft animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-28 rounded-full bg-infyn-surface-soft animate-pulse" />
          <div className="h-3 w-20 rounded-full bg-infyn-surface-soft animate-pulse" />
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-end gap-4 px-5 py-6">
        <div className="h-12 w-44 rounded-2xl bg-infyn-surface-soft animate-pulse" />
        <div className="ml-auto h-14 w-52 rounded-2xl bg-infyn-blush animate-pulse" />
        <div className="h-12 w-36 rounded-2xl bg-infyn-surface-soft animate-pulse" />
      </div>
      <div className="mx-4 mb-[calc(1rem+env(safe-area-inset-bottom,0px))] h-12 rounded-2xl bg-infyn-surface-soft animate-pulse" />
      <span className="sr-only">Opening conversation…</span>
    </div>
  );
}
