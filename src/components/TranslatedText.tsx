'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';

// Simple client-side translation cache to avoid duplicate API calls
const translationCache: Record<string, string> = {};

interface TranslatedTextProps {
  text: string;
  className?: string;
  isParagraph?: boolean;
}

export default function TranslatedText({ text, className = '', isParagraph = false }: TranslatedTextProps) {
  const { language } = useApp();
  const [translatedText, setTranslatedText] = useState(text);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (language !== 'en' || !text || !text.trim()) {
      setTranslatedText(text);
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `${text}`;
    if (translationCache[cacheKey]) {
      setTranslatedText(translationCache[cacheKey]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const translate = async () => {
      setLoading(true);
      try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Translation failed');
        const data = await res.json();
        
        if (data && data[0]) {
          // Join translated segments
          const translated = data[0].map((x: any) => x[0]).join('');
          if (isMounted) {
            translationCache[cacheKey] = translated;
            setTranslatedText(translated);
          }
        }
      } catch (err) {
        console.error('Translation error:', err);
        // Fallback to original text if error occurs
        if (isMounted) {
          setTranslatedText(text);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, language]);

  if (loading) {
    return (
      <span className={`animate-pulse text-stone-400/70 select-none ${className}`}>
        {isParagraph ? (
          <span className="block space-y-2 py-1">
            <span className="block h-3 bg-stone-200/40 dark:bg-stone-800/40 rounded w-full"></span>
            <span className="block h-3 bg-stone-200/40 dark:bg-stone-800/40 rounded w-[95%]"></span>
            <span className="block h-3 bg-stone-200/40 dark:bg-stone-800/40 rounded w-[80%]"></span>
          </span>
        ) : (
          <span>{language === 'en' ? 'Translating...' : 'Traduciendo...'}</span>
        )}
      </span>
    );
  }

  return <span className={className}>{translatedText}</span>;
}
