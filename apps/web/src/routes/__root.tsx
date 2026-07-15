import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"
import type { QueryClient } from "@tanstack/react-query"

import { MobileBottomNav } from "@/components/MobileBottomNav"
import { PwaExperience } from "@/components/PwaExperience"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
  convexEnabled: boolean
}>()({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "CivicNote — Know before they vote",
      },
      {
        name: "description",
        content:
          "Personal civic alerts for the issues and places you care about, backed by evidence and timed for action before hearings, votes, and deadlines.",
      },
      {
        name: "theme-color",
        content: "#f8f5ef",
      },
      {
        name: "mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "default",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "CivicNote",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "icon",
        href: "/favicon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
    scripts: [
      {
        src: "/registerSW.js",
        defer: true,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
        <MobileBottomNav />
        <PwaExperience />
        <Scripts />
      </body>
    </html>
  )
}
