import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "MemoChro — Your life, through time.",
    template: "%s · MemoChro",
  },
  description:
    "A private home for the moments, people, places and stories that make a life.",
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
