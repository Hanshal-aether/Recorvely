import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Recoverly — payment recovery engine",
  description: "Classify failed payments, decide the right recovery action, and prove it with numbers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
