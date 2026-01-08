import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

// Inline script to prevent theme flash - runs before React hydrates
const ThemeScript = () => {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme');
        const isDark = theme ? JSON.parse(theme) : false;
        const root = document.documentElement;

        if (isDark) {
          root.classList.add('dark');
          // Apply background color immediately via inline style (before CSS loads)
          root.style.backgroundColor = '#0a0a0a';
          root.style.color = '#f3f4f6';
        } else {
          // Light mode
          root.style.backgroundColor = '#f5f5f7';
          root.style.color = '#111827';
        }
      } catch (e) {}
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />;
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#f5f5f7', color: '#111827' }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <ScrollRestoration />
            <Scripts />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
