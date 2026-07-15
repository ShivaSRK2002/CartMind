import type { EcommerceStore } from "cartmind-shared-types";

interface StoreSelectorProps {
  stores: EcommerceStore[];
  selectedId: string;
  onSelect: (storeId: string) => void;
}

export function StoreSelector({ stores, selectedId, onSelect }: StoreSelectorProps) {
  return (
    <div className="flex flex-wrap gap-3">
      {stores.map((store) => {
        const active = store.id === selectedId;
        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelect(store.id)}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              active
                ? "border-accent bg-surface-elevated shadow-[0_0_20px_rgba(110,231,255,0.15)]"
                : "border-border bg-surface hover:border-muted"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: store.accentColor }}
              />
              <span className="font-medium">{store.name}</span>
              {store.status === "live" ? (
                <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-success">
                  Live
                </span>
              ) : (
                <span className="rounded-full bg-muted/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">
                  Demo
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">{store.tagline}</p>
          </button>
        );
      })}
    </div>
  );
}
