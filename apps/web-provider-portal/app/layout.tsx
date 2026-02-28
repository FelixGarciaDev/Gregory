import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Gregory Provider Portal",
  description: "Provider self-service workspace"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

