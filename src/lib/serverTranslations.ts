import { cookies } from 'next/headers';
import { Language } from './translations';

export async function getServerLanguage(): Promise<Language> {
  try {
    const cookieStore = await cookies();
    const lang = cookieStore.get('language')?.value;
    if (lang === 'en' || lang === 'es') {
      return lang;
    }
  } catch (e) {
    // cookies() can fail during static build time (SSG page compile)
  }
  return 'es';
}
