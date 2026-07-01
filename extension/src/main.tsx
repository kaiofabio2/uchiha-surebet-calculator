import React from "react";
import { createRoot, Root } from "react-dom/client";
import { Toaster } from "sonner";
import SurebetCalculator from "@/components/SurebetCalculator";
import "@/index.css";

let root: Root | null = null;

function mount(container: Element | DocumentFragment) {
  if (root) return root;
  root = createRoot(container as any);
  root.render(
    <div className="bg-[#0C0C0D] text-foreground p-4 min-h-full">
      <SurebetCalculator />
      <Toaster position="bottom-right" theme="dark" richColors closeButton />
    </div>
  );
  return root;
}

function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
}

(window as any).MadaraSurebet = { mount, unmount };
