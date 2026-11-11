import type { Metadata } from "next";
import "./shell.css";
import "./reports.css";
export const metadata: Metadata = {
  title: "TIDE | Digital Engagement Analytics",
  description: "Explore website engagement through transparent SQL analytics.",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
