import "react-phone-number-input/style.css";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wesiya",
  description: "Secure notes and trusted access platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          backgroundColor: "#f7f5ef",
          color: "#1f2933",
          minHeight: "100vh",
        }}
      >
        {children}
      </body>
    </html>
  );
}