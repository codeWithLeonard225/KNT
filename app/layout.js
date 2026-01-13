import "./globals.css";
// app/layout.js

export const metadata = {
  title: "KNT Bureau Management System – Smart Office & Records Management",
  description:
    "KNT Bureau Management System is a modern digital platform for managing bureau operations, staff records, finance, reports, and daily office workflows efficiently.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      { url: "/icons/knt-logo-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/knt-logo-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/knt-logo-192x192.png",
    apple: "/icons/knt-logo-192x192.png",
  },

  keywords: [
    "KNT Bureau Management System",
    "Bureau Management Software",
    "Office Management System",
    "Staff Management System",
    "Cashier Management System",
    "Digital Bureau System",
    "Record Management System",
    "Business Management Software Sierra Leone",
    "KNT BMS",
  ],

  authors: [{ name: "KNT Bureau Management System" }],
  creator: "KNT Bureau Management System",
  publisher: "KNT Bureau Management System",

  metadataBase: new URL("https://www.kntbms.com"),
  applicationName: "KNT Bureau Management System",
  classification: "Business Management Software",

  robots: { index: true, follow: true },
  referrer: "strict-origin-when-cross-origin",

  alternates: {
    canonical: "https://www.kntbms.com",
  },

  openGraph: {
    title: "KNT Bureau Management System",
    description:
      "A secure and efficient bureau management system for handling staff, finance, reports, and daily operations.",
    url: "https://www.kntbms.com",
    siteName: "KNT Bureau Management System",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/icons/knt-logo-512x512.png",
        width: 512,
        height: 512,
        alt: "KNT Bureau Management System Logo",
      },
    ],
  },

  twitter: {
    card: "summary",
    title: "KNT Bureau Management System",
    description:
      "Smart bureau and office management system for modern businesses.",
    images: ["/icons/knt-logo-512x512.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a3d62", // matches KNT blue theme
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0a3d62" />
        <meta name="color-scheme" content="light" />
      </head>
      <body>{children}</body>
    </html>
  );
}
