import type { Metadata } from "next";
import { Provider } from "@/components/ui/provider"
import { Ubuntu_Sans, Ubuntu_Sans_Mono } from "next/font/google";
import InactivityProvider from '@/components/InactivityProvider'
import "./globals.css";
import {ColorModeButton} from "@/components/ui/color-mode";

const ubuntu = Ubuntu_Sans({
  variable: "--font-ubuntu",
  subsets: ["latin"],
})

const ubuntuMono = Ubuntu_Sans_Mono({
  variable: "--font-ubuntu-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Swayam",
  description: "This app is for the self-payment for mysanstha.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${ubuntu.variable} ${ubuntuMono.variable}`} suppressHydrationWarning>
      <body
        className={`antialiased`}
      >
        <Provider>
          <InactivityProvider>
            {children}
          </InactivityProvider>
        </Provider>
      </body>
    </html>
  );
}
