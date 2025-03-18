import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '@/context/auth-context'

export const metadata: Metadata = {
  title: "AI Stock Market Analysis Platform",
  description: "Real-Time AI-Driven Stock Market Analysis and Investment Advisory Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`antialiased dark vsc-initialized-cz-shortcut-listen="true"`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
