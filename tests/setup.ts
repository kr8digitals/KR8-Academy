import "@testing-library/jest-dom/vitest";
import { webcrypto } from "node:crypto";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
  root = null;
  rootMargin = "";
  thresholds = [];
}
// @ts-expect-error test shim
window.IntersectionObserver = IO;
// @ts-expect-error test shim
window.ResizeObserver = IO;

window.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();

// jsdom has no canvas implementation; certificate previews degrade gracefully.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});
