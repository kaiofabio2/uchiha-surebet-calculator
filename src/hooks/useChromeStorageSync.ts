import { useEffect, useRef } from "react";

const STORAGE_KEY = "madara_surebet_state_v1";

type Snapshot = Record<string, any>;

interface Options {
  /** Getter que retorna o snapshot atual do estado a persistir */
  getSnapshot: () => Snapshot;
  /** Aplica um snapshot vindo de outra aba/extensão (sem persistir de volta) */
  applySnapshot: (snap: Snapshot) => void;
  /** Chamado quando uma odd é capturada externamente (pending_capture key) */
  onOddCaptured?: (value: number) => void;
}

function getChromeStorage(): any | null {
  try {
    const chr: any = (globalThis as any).chrome;
    if (chr?.storage?.local && chr?.storage?.onChanged) return chr.storage;
  } catch {}
  return null;
}

/**
 * Sincroniza o estado da calculadora com chrome.storage.local.
 * Funciona apenas dentro da extensão. No site normal é no-op.
 */
export function useChromeStorageSync({
  getSnapshot,
  applySnapshot,
  onOddCaptured,
}: Options) {
  const skipNextWriteRef = useRef(false);
  const hydratedRef = useRef(false);
  const snapshotRef = useRef(getSnapshot);
  snapshotRef.current = getSnapshot;

  // Hydrate + listen
  useEffect(() => {
    const storage = getChromeStorage();
    if (!storage) return;

    // Carrega estado inicial
    storage.local.get([STORAGE_KEY, "madara_pending_capture"], (res: any) => {
      if (res?.[STORAGE_KEY]) {
        skipNextWriteRef.current = true;
        applySnapshot(res[STORAGE_KEY]);
      }
      hydratedRef.current = true;

      // Se havia captura pendente ao abrir, aplica
      const pending = res?.madara_pending_capture;
      if (pending && typeof pending.value === "number" && onOddCaptured) {
        onOddCaptured(pending.value);
        storage.local.remove("madara_pending_capture");
      }
    });

    const listener = (changes: any, area: string) => {
      if (area !== "local") return;

      if (changes[STORAGE_KEY]?.newValue) {
        const nv = changes[STORAGE_KEY].newValue;
        // Ignora se o novo valor é idêntico ao snapshot atual (evita loop)
        try {
          const current = JSON.stringify(snapshotRef.current());
          if (JSON.stringify(nv) === current) return;
        } catch {}
        skipNextWriteRef.current = true;
        applySnapshot(nv);
      }

      if (changes.madara_pending_capture?.newValue) {
        const pending = changes.madara_pending_capture.newValue;
        if (pending && typeof pending.value === "number" && onOddCaptured) {
          onOddCaptured(pending.value);
          storage.local.remove("madara_pending_capture");
        }
      }
    };
    storage.onChanged.addListener(listener);
    return () => storage.onChanged.removeListener(listener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste em cada mudança
  const persist = () => {
    const storage = getChromeStorage();
    if (!storage || !hydratedRef.current) return;
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }
    storage.local.set({ [STORAGE_KEY]: getSnapshot() });
  };

  return { persist };
}
