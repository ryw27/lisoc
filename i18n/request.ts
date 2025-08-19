import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';


const SUPPORTED_LOCALES = ['en', 'zh'];

function normalizeLocale(input: string | null | undefined) {
	const base = (input ?? '').split(',')[0]?.trim().split('-')[0]?.toLowerCase();
	return SUPPORTED_LOCALES.includes(base) ? (base) : "en";
}

export default getRequestConfig(async () => {
	const cookieLocale = (await cookies()).get('NEXT_LOCALE')?.value ?? null;
	const headerLocale = (await headers()).get('accept-language');
	const locale = normalizeLocale(cookieLocale ?? headerLocale);

	try {
		return {
			locale,
			messages: (await import(`../messages/${locale}.json`)).default
		};
	} catch {
		return {
			locale: 'en',
			messages: (await import(`../messages/en.json`)).default
		};
  	}
});