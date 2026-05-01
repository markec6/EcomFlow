import type { Metadata } from 'next'
import { Inter, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SidebarStateProvider } from "@/components/dashboard/sidebar-state"
import { ProfileBootstrap } from "@/components/auth/profile-bootstrap"
import './globals.css'

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!clerkPublishableKey) {
  console.error("Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")
}

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: 'EcomFlow AI | Product Discovery & Supplier Outreach',
  description: 'Premium AI-powered dashboard for elite dropshippers and B2B arbitrageurs. Discover winning products and automate supplier outreach.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning={true}>
      <body className={`${inter.variable} ${geistMono.variable} font-sans antialiased`} suppressHydrationWarning={true}>
        <ClerkProvider publishableKey={clerkPublishableKey}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            <SidebarStateProvider>
              <ProfileBootstrap />
              {children}
            </SidebarStateProvider>
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
