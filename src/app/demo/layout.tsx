import { ArchiveShell } from "@/components/archive-shell";
export const metadata = { title: "Explore the sample archive" };
export default function DemoLayout({children}: {children: React.ReactNode}) {
  return <ArchiveShell demo>{children}</ArchiveShell>;
}
