import type { Metadata } from "next";
// import { Crimson_Pro, Noto_Serif_SC } from "next/font/google";
import localFont from 'next/font/local'
import "./globals.css";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from 'next-intl';

const crimson = localFont({
	src: '../public/fonts/CrimsonPro-VariableFont_wght.ttf',
	variable: "--font-crimson", 
	display: "swap",
	adjustFontFallback: false,
});

const notoSerif = localFont({
  src: '../public/fonts/NotoSerifSC-VariableFont_wght.ttf', 
  variable: '--font-noto-serif',
  display: 'swap',
});

export const metadata: Metadata = {
	title: "LISOC 华夏中文学校",
	description: "LISOC Website",
	icons: {
		icon: '/lisoc.png',
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const locale = await getLocale();
	return (
		<html lang={locale} className={`${crimson.variable} ${notoSerif.variable} antialiased`}>
			<body>
				<NextIntlClientProvider>
					{children}
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
