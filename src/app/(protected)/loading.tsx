export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand"
          aria-label="Carregant"
          role="status"
        />
        <p className="text-sm text-ink/50">Carregant...</p>
      </div>
    </div>
  );
}
