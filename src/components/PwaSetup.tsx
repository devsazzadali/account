"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Download, Share, X } from "lucide-react";
import { lsGet, lsSet } from "@/src/lib/storage";

// PWA setup (ধাপ ৫ঙ): service-worker registration + install affordance
// state, shared through context. The single visible surface is the
// "Install App" item the storefront Header renders inside its menus
// (profile dropdown on desktop, hamburger menu on mobile) — no floating
// buttons, nothing added to the already-busy bottom-right corner stack.
//
// Dismissal is remembered per device (aso_pwa_install_dismissed) via the
// codebase's safe lsGet/lsSet accessors: once a visitor declines the
// native prompt or closes the iOS guide, the item stops nagging.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PwaInstallState {
  /** Show the "Install App" menu item at all. */
  showInstall: boolean;
  /** Run the right install flow for this platform. */
  requestInstall: () => void;
}

const PwaInstallContext = createContext<PwaInstallState>({
  showInstall: false,
  requestInstall: () => {},
});

export function usePwaInstall() {
  return useContext(PwaInstallContext);
}

const DISMISS_KEY = "aso_pwa_install_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari's legacy installed flag.
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua);
  // Real Safari only — in-app browsers and iOS Chrome/Firefox cannot
  // add to the home screen the same way.
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
  return ios && safari;
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(true); // until storage is read
  const [ios, setIos] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Register the service worker (production only — a dev SW would fight
  // hot reload and cache unfinished pages).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* registration failure must never break the store */
    });
  }, []);

  useEffect(() => {
    setInstalled(isStandalone());
    setIos(isIosSafari());
    setDismissed(lsGet(DISMISS_KEY) === "1");

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      const evt = e as BeforeInstallPromptEvent;
      promptRef.current = evt;
      setDeferredPrompt(evt);
    };
    const onInstalled = () => {
      setInstalled(true);
      promptRef.current = null;
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    lsSet(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const requestInstall = useCallback(async () => {
    const prompt = promptRef.current;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "dismissed") dismiss();
      promptRef.current = null;
      setDeferredPrompt(null);
      return;
    }
    if (isIosSafari()) setGuideOpen(true);
  }, [dismiss]);

  const closeGuide = useCallback(() => {
    setGuideOpen(false);
    dismiss();
  }, [dismiss]);

  const showInstall =
    !installed && !dismissed && (deferredPrompt !== null || ios);

  return (
    <PwaInstallContext.Provider value={{ showInstall, requestInstall }}>
      {children}
      {guideOpen && (
        <div
          className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Install Account Store One"
          onClick={closeGuide}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-black text-slate-900">
                Install this app
              </h2>
              <button
                type="button"
                onClick={closeGuide}
                aria-label="Close install instructions"
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-slate-600 leading-relaxed list-none">
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-700 text-white text-[11px] font-black flex items-center justify-center">
                  1
                </span>
                <span>
                  Tap the <Share size={14} className="inline -mt-0.5" />{" "}
                  <strong className="text-slate-900">Share</strong> button in
                  Safari&rsquo;s toolbar.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-700 text-white text-[11px] font-black flex items-center justify-center">
                  2
                </span>
                <span>
                  Choose{" "}
                  <strong className="text-slate-900">
                    Add to Home Screen
                  </strong>
                  .
                </span>
              </li>
              <li className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-primary-700 text-white text-[11px] font-black flex items-center justify-center">
                  3
                </span>
                <span>
                  Tap <strong className="text-slate-900">Add</strong> — the
                  store then opens from your home screen like an app.
                </span>
              </li>
            </ol>
            <button
              type="button"
              onClick={closeGuide}
              className="mt-6 w-full bg-primary-600 hover:bg-primary-700 text-white text-[12px] font-black uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Download size={14} />
              Got it
            </button>
          </div>
        </div>
      )}
    </PwaInstallContext.Provider>
  );
}
