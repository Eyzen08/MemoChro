import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000"),
  ),
  title: {
    default: "MemoChro — Your life, through time.",
    template: "%s · MemoChro",
  },
  description:
    "A private home for the moments, people, places and stories that make a life.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MemoChro",
    title: "MemoChro — Your life, through time.",
    description: "A private home for the moments, people, places and stories that make a life.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MemoChro — Your life, through time.",
    description: "A private home for the moments, people, places and stories that make a life.",
    images: [{
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "MemoChro — Your life, through time. Photographic prints of friends sharing dinner and walking by the sea.",
    }],
  },
};
const themeScript =
  "try{document.documentElement.dataset.theme=localStorage.getItem('memochro-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
