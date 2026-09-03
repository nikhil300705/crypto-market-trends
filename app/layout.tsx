import "./globals.css";

export const metadata = {
  title: "Crypto Market Trends",
  description: "Interactive cryptocurrency market analytics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}