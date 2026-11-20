import "./globals.css";
import { Bricolage_Grotesque } from "next/font/google";
const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-body" });
export const metadata = { title: "Copilote de candidature", description: "Analysez votre CV face à une offre, sans compte." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="fr"><body className={font.variable}>{children}</body></html>;
}
