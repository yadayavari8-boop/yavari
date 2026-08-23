import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AppProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بازاڕ | Bazaar Kurdistan — کڕین و فرۆشتنی ناوخۆیی",
  description: "بازاڕی ئۆنلاینی کوردستان بۆ کڕین و فرۆشتنی ئۆتۆمبێل، کەلوپەلی ماڵ، خانوبەرە و زیاتر.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#007A3D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ckb" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans bg-canvas text-ink min-h-screen flex flex-col antialiased">
        <AuthProvider>
          <AppProvider>
            <div className="flex-1 pb-16 md:pb-0">{children}</div>
            <BottomNav />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
