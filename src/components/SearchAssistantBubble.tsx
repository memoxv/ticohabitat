'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Send, 
  X, 
  MessageSquare, 
  MapPin, 
  ChevronRight, 
  Loader2,
  HelpCircle
} from 'lucide-react';
import { searchWithAssistantAction, AssistantSearchResult } from '@/app/actions/assistant';
import { ParsedFilters } from '@/lib/assistantParser';
import { useApp } from '@/context/AppContext';
import { getTranslations } from '@/lib/translations';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  filters?: ParsedFilters;
  properties?: any[];
  isFallback?: boolean;
  fallbackProperties?: any[];
}

export default function SearchAssistantBubble() {
  const router = useRouter();
  const { language } = useApp();
  const t = getTranslations(language);

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeFilters, setActiveFilters] = useState<ParsedFilters | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Welcome message on mount/lang change
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: t.assistant.welcomeMessage,
        timestamp: new Date()
      }
    ]);
  }, [language]);

  const handleSearch = async (textSearch: string, filterOverride?: ParsedFilters) => {
    if (!textSearch.trim() && !filterOverride) return;

    setIsLoading(true);
    
    // Add user message to log
    if (!filterOverride) {
      const userMsgId = Math.random().toString();
      setMessages(prev => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: textSearch,
          timestamp: new Date()
        }
      ]);
      setQuery('');
    }

    try {
      const result: AssistantSearchResult = await searchWithAssistantAction(textSearch, filterOverride);
      
      if (result.success) {
        setActiveFilters(result.filters);
        
        let responseText = '';
        if (result.isFallback) {
          responseText = t.assistant.fallbackMessage;
        } else {
          responseText = t.assistant.successMessage.replace('{count}', String(result.matchedCount));
        }

        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'assistant',
            text: responseText,
            timestamp: new Date(),
            filters: result.filters,
            properties: result.properties,
            isFallback: result.isFallback,
            fallbackProperties: result.fallbackProperties
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'assistant',
            text: t.assistant.noResults,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: t.assistant.connectionError,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch(suggestion);
  };

  const handleRemoveFilter = (key: keyof ParsedFilters) => {
    if (!activeFilters) return;
    
    const updated = { ...activeFilters };
    delete updated[key];
    
    // If no filters left, clear active filters state
    if (Object.keys(updated).length === 0) {
      setActiveFilters(null);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'assistant',
          text: t.assistant.clearedFilters,
          timestamp: new Date()
        }
      ]);
      return;
    }

    setActiveFilters(updated);
    
    // Send user notification in chat
    setMessages(prev => [
      ...prev,
      {
        id: Math.random().toString(),
        sender: 'user',
        text: t.assistant.removedFilter.replace('{label}', getFilterLabel(key, activeFilters[key])),
        timestamp: new Date()
      }
    ]);

    // Re-trigger search using override
    handleSearch('', updated);
  };

  const getFilterLabel = (key: keyof ParsedFilters, value: any): string => {
    switch (key) {
      case 'type': return value === 'rent' ? t.assistant.filters.typeRent : t.assistant.filters.typeBuy;
      case 'province': return `📍 ${value}`;
      case 'canton': return `📍 ${value}`;
      case 'district': return `📍 ${value}`;
      case 'propertyType': {
        const types: Record<string, string> = t.card.propertyTypes;
        return `🏠 ${types[value] || value}`;
      }
      case 'priceMax': return t.assistant.filters.maxPrice.replace('{price}', formatCurrency(value, activeFilters?.currency));
      case 'priceMin': return t.assistant.filters.minPrice.replace('{price}', formatCurrency(value, activeFilters?.currency));
      case 'bedrooms': return t.assistant.filters.bedrooms.replace('{count}', String(value));
      case 'bathrooms': return t.assistant.filters.bathrooms.replace('{count}', String(value));
      case 'petsAllowed': return t.assistant.filters.pets;
      case 'condominium': return t.assistant.filters.condo;
      case 'furnished': return t.assistant.filters.furnished;
      default: return String(value);
    }
  };

  const formatCurrency = (val: number, curr?: string) => {
    if (curr === 'USD') {
      return `$${val.toLocaleString('en-US')}`;
    }
    return `₡${val.toLocaleString('es-CR')}`;
  };

  // Build the catalog search URL based on current active filters
  const getCatalogLink = () => {
    if (!activeFilters) return '/alquilar';
    
    // Determine the type: check filter first
    let type = activeFilters.type;
    
    // If filter type is not explicitly set (e.g. "lote en Cartago"), infer it from the properties shown in the assistant's response
    if (!type) {
      // Find the last assistant message with properties or fallbackProperties
      const lastAssistantMessage = [...messages]
        .reverse()
        .find(m => m.sender === 'assistant' && ((m.properties && m.properties.length > 0) || (m.fallbackProperties && m.fallbackProperties.length > 0)));
      
      const props = lastAssistantMessage?.properties || lastAssistantMessage?.fallbackProperties || [];
      if (props.length > 0) {
        // Count buy vs rent in the properties
        const buyCount = props.filter((p: any) => p.type === 'buy').length;
        const rentCount = props.filter((p: any) => p.type === 'rent').length;
        if (buyCount > rentCount) {
          type = 'buy';
        } else if (rentCount > buyCount) {
          type = 'rent';
        }
      }
    }
    
    // Further fallback based on property type (lots are typically for sale)
    if (!type) {
      if (activeFilters.propertyType === 'lot' || activeFilters.propertyType === 'quinta') {
        type = 'buy';
      }
    }
    
    const typePath = type === 'buy' ? 'comprar' : 'alquilar';
    
    // Smart province slug: if not explicitly selected, try to extract from matched properties or default to 'san-jose'
    let provinceSlug = '';
    if (activeFilters.province) {
      provinceSlug = activeFilters.province.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    } else {
      // Look for any property listed in assistant messages to extract province
      const matchedProp = messages.find(m => m.properties && m.properties.length > 0)?.properties?.[0]
        || messages.find(m => m.fallbackProperties && m.fallbackProperties.length > 0)?.fallbackProperties?.[0];
      
      if (matchedProp?.province) {
        provinceSlug = matchedProp.province.toLowerCase().replace(/ /g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      } else {
        provinceSlug = 'san-jose'; // Safe global default (San José)
      }
    }
    
    const urlParams = new URLSearchParams();
    if (activeFilters.propertyType) urlParams.set('propertyType', activeFilters.propertyType);
    if (activeFilters.priceMax) urlParams.set('priceMax', String(activeFilters.priceMax));
    if (activeFilters.bedrooms) urlParams.set('bedrooms', String(activeFilters.bedrooms));
    if (activeFilters.bathrooms) urlParams.set('bathrooms', String(activeFilters.bathrooms));
    if (activeFilters.petsAllowed) urlParams.set('pets', 'true');
    if (activeFilters.condominium) urlParams.set('condo', 'true');

    const paramsStr = urlParams.toString();
    const queryStr = paramsStr ? `?${paramsStr}` : '';
    
    return `/${typePath}/${provinceSlug}${queryStr}`;
  };

  const assistantSuggestions = t.assistant.suggestions || [];

  return (
    <div className="font-sans">
      {/* 1. Closed State: Glowing Forest Bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-stone-900/90 hover:bg-stone-950 text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group border border-stone-800 backdrop-blur-md"
          title={t.assistant.title}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
          <MessageSquare className="h-5 w-5 text-emerald-450 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
          
          {/* Subtle slow pulse glowing indicator */}
          <span className="absolute bottom-2 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
        </button>
      )}

      {/* 2. Open State: Premium Floating Chat Panel */}
      {isOpen && (
        <div
          ref={chatWindowRef}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-[385px] h-[525px] max-h-[82vh] rounded-2xl bg-card-bg border border-card-border shadow-2xl flex flex-col overflow-hidden animate-slide-up z-50"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-emerald-800 dark:bg-emerald-950 text-white flex items-center justify-between shadow-sm relative overflow-hidden shrink-0">
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
            
            <div className="flex items-center gap-2.5 relative z-10">
              <div className="h-8.5 w-8.5 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-amber-350 fill-amber-350/20" />
              </div>
              <div>
                <h3 className="font-display font-black text-sm tracking-wide">{t.assistant.title}</h3>
                <p className="text-[10px] font-bold text-emerald-250/90 uppercase tracking-widest mt-0.5">{t.assistant.betaBadge}</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/80 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-stone-50/50 dark:bg-stone-950/20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                {/* Text Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user'
                      ? 'bg-emerald-800 dark:bg-emerald-950 text-white font-medium rounded-tr-sm shadow-sm'
                      : 'bg-card-bg text-stone-800 dark:text-stone-100 rounded-tl-sm border border-card-border/60 shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Extracted Interactive Filter Chips */}
                {msg.sender === 'assistant' && msg.filters && Object.keys(msg.filters).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                    {Object.entries(msg.filters).map(([k, v]) => {
                      if (k === 'currency') return null; // currency is shown inside prices
                      return (
                        <div
                          key={k}
                          className="inline-flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 border border-stone-200/50 dark:border-stone-750 px-2 py-0.5 rounded-full text-[10px] font-bold text-stone-600 dark:text-stone-300 transition-colors"
                        >
                          <span>{getFilterLabel(k as any, v)}</span>
                          <button
                            onClick={() => handleRemoveFilter(k as any)}
                            className="text-stone-400 hover:text-inherit ml-0.5 cursor-pointer font-black"
                            title="Eliminar este filtro"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Property Result Listings */}
                {msg.sender === 'assistant' && (msg.properties?.length || msg.fallbackProperties?.length) && (
                  <div className="w-full space-y-2 mt-3 animate-slide-up">
                    {/* Choose the matching list */}
                    {(msg.properties || msg.fallbackProperties || []).map((prop: any) => (
                      <Link
                        key={prop.id}
                        href={`/propiedad/${prop.slug}`}
                        target="_blank"
                        className="group flex gap-3 p-2.5 rounded-xl border border-card-border bg-card-bg hover-border-emerald-700/40 dark:hover:border-emerald-700/30 transition-all shadow-xs"
                      >
                        {/* Thumb */}
                        <div className="h-16 w-20 rounded-lg overflow-hidden bg-stone-100 relative shrink-0">
                          {prop.images && prop.images[0] ? (
                            <img
                              src={prop.images[0].url}
                              alt={prop.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-stone-400">
                              {t.assistant.noPhoto}
                            </div>
                          )}
                          {prop.featured && (
                            <span className="absolute top-1 left-1 bg-amber-500 text-[8px] font-black text-stone-950 uppercase px-1 rounded-sm shadow-sm">
                              {t.card.featuredBadge}
                            </span>
                          )}
                        </div>

                        {/* Info details */}
                        <div className="flex-grow min-w-0 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-[11px] text-stone-850 dark:text-stone-100 truncate group-hover:text-emerald-800 dark:group-hover:text-emerald-400 transition-colors">
                              {prop.title}
                            </h4>
                            <p className="text-[9px] font-bold text-stone-400 dark:text-stone-500 flex items-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" />
                              <span>{prop.province}, {prop.canton}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-450 tabular-nums">
                              {prop.currency === 'USD' ? '$' : '₡'}
                              {prop.price.toLocaleString(prop.currency === 'USD' ? 'en-US' : 'es-CR')}
                              {prop.type === 'rent' ? '/mes' : ''}
                            </span>
                            <span className="text-[8px] font-bold text-stone-450 uppercase flex items-center gap-0.5">
                              <span>{t.assistant.viewDetails}</span>
                              <ChevronRight className="h-3 w-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}

                    {/* Direct redirection / Catalog view trigger */}
                    <div className="pt-1">
                      <Link
                        href={getCatalogLink()}
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-emerald-850 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider py-2.5 transition-colors border border-emerald-150 dark:border-emerald-900/30 shadow-xs"
                      >
                        <span>{t.assistant.openGeneralSearch}</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                <span className="text-[9px] text-stone-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {/* Skeletons when parsing/waiting */}
            {isLoading && (
              <div className="flex flex-col items-start animate-fadeIn">
                <div className="bg-card-bg rounded-2xl rounded-tl-sm px-4 py-3 border border-card-border/60 shadow-xs flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-800 dark:text-emerald-450" />
                  <span className="text-xs font-medium text-stone-500">{t.assistant.assistantSearchStatus}</span>
                </div>
              </div>
            )}

            {/* Suggestions layout (only if history is just the welcome message) */}
            {messages.length === 1 && !isLoading && (
              <div className="pt-2 animate-fadeIn space-y-2">
                <p className="text-[10px] font-black text-stone-400 dark:text-stone-500 uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{t.assistant.suggestionsTitle}</span>
                </p>
                <div className="flex flex-col gap-2">
                  {assistantSuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSuggestionClick(sug)}
                      className="text-left text-xs bg-card-bg hover:bg-primary-light text-stone-750 dark:text-stone-300 px-3.5 py-2.5 rounded-xl border border-card-border hover:border-emerald-600/30 cursor-pointer shadow-xs transition-all text-ellipsis overflow-hidden"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input field */}
          <div className="p-3.5 bg-card-bg border-t border-card-border shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(query);
              }}
              className="flex items-center gap-2 relative"
            >
              <input
                type="text"
                placeholder={t.assistant.placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-xl border border-card-border bg-background pl-4 pr-12 py-3.5 text-xs text-stone-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 placeholder-stone-400"
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="absolute right-1.5 top-1.5 h-9 w-9 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
