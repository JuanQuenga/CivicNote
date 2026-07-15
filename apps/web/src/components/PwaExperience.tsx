import { useEffect, useRef, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

const INSTALL_DISMISSED_KEY = "civicnote-install-dismissed"

export function PwaExperience() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [instructions, setInstructions] = useState("")
  const [waitingRegistration, setWaitingRegistration] =
    useState<ServiceWorkerRegistration | null>(null)
  const reloadRequested = useRef(false)

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as NavigatorWithStandalone).standalone === true
    if (standalone || localStorage.getItem(INSTALL_DISMISSED_KEY)) return

    setInstructions(getInstallInstructions())
    setShowInstall(true)

    const capturePrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
      setShowInstall(true)
    }
    const markInstalled = () => {
      setInstallPrompt(null)
      setShowInstall(false)
    }
    window.addEventListener("beforeinstallprompt", capturePrompt)
    window.addEventListener("appinstalled", markInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt)
      window.removeEventListener("appinstalled", markInstalled)
    }
  }, [])

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const cleanups: Array<() => void> = []
    const inspected = new WeakSet<ServiceWorkerRegistration>()

    const inspectRegistration = (registration: ServiceWorkerRegistration) => {
      if (inspected.has(registration)) return
      inspected.add(registration)
      if (registration.waiting && navigator.serviceWorker.controller) {
        setWaitingRegistration(registration)
      }

      const handleUpdateFound = () => {
        const worker = registration.installing
        if (!worker) return
        const handleStateChange = () => {
          if (
            worker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            setWaitingRegistration(registration)
          }
        }
        worker.addEventListener("statechange", handleStateChange)
        cleanups.push(() =>
          worker.removeEventListener("statechange", handleStateChange)
        )
      }
      registration.addEventListener("updatefound", handleUpdateFound)
      cleanups.push(() =>
        registration.removeEventListener("updatefound", handleUpdateFound)
      )
    }

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) inspectRegistration(registration)
    })
    void navigator.serviceWorker.ready.then(inspectRegistration)

    const handleControllerChange = () => {
      if (reloadRequested.current) window.location.reload()
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    )
    cleanups.push(() =>
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      )
    )

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])

  const install = async () => {
    if (!installPrompt) {
      setShowInstructions(true)
      return
    }
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    setInstallPrompt(null)
    if (choice.outcome === "accepted") setShowInstall(false)
  }

  const dismissInstall = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "true")
    setShowInstall(false)
  }

  const applyUpdate = () => {
    if (!waitingRegistration?.waiting) return
    reloadRequested.current = true
    waitingRegistration.waiting.postMessage({ type: "SKIP_WAITING" })
  }

  if (!showInstall && !waitingRegistration) return null

  return (
    <div className="fixed right-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] left-3 z-50 ml-auto grid max-w-sm gap-2 md:right-5 md:bottom-5 md:left-auto">
      {waitingRegistration ? (
        <section
          aria-live="polite"
          className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl"
        >
          <div>
            <p className="text-sm font-black">Update available</p>
            <p className="mt-1 text-xs text-zinc-400">
              Reload when you are ready to use the latest CivicNote.
            </p>
          </div>
          <button
            type="button"
            onClick={applyUpdate}
            className="shrink-0 rounded-xl bg-white px-3 py-2 text-xs font-black text-zinc-950"
          >
            Reload
          </button>
        </section>
      ) : null}

      {showInstall ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-2xl shadow-zinc-950/10">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-red-700 text-sm font-black text-white">
              C
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-zinc-950">
                Install CivicNote
              </p>
              <p className="mt-1 text-xs leading-5 text-zinc-600">
                {showInstructions
                  ? instructions
                  : "Keep your civic feed one tap away, even when your connection drops."}
              </p>
              <button
                type="button"
                onClick={() => void install()}
                className="mt-3 rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white"
              >
                {installPrompt ? "Install" : "How to install"}
              </button>
            </div>
            <button
              type="button"
              onClick={dismissInstall}
              aria-label="Dismiss install suggestion"
              className="grid size-8 shrink-0 place-items-center rounded-full text-lg font-bold text-zinc-400 hover:bg-zinc-100 hover:text-zinc-950"
            >
              ×
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function getInstallInstructions() {
  const userAgent = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(userAgent)
  const isFirefox = /Firefox|FxiOS/.test(userAgent)
  if (isIos) {
    return "In Safari, tap Share, then choose Add to Home Screen. Other iPhone browsers may ask you to open this page in Safari first."
  }
  if (isFirefox) {
    return "Open the browser menu and choose Install or Add to Home screen. If that option is unavailable, open CivicNote in Chrome, Edge, or Safari."
  }
  return "Open your browser menu and choose Install app or Add to Home screen."
}
