import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router"

import appCss from "@workspace/ui/globals.css?url"
import type { QueryClient } from "@tanstack/react-query"

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
        title: "CivicNote",
      },
      {
        name: "description",
        content:
          "A combined civic research site for congressional ethics, surveillance oversight, infrastructure accountability, public-health exposure, human-rights law, and election integrity.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
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
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
