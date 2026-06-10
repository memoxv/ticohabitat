'use client';

import React, { useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import PropertyCard, { PropertyCardProps } from '@/components/PropertyCard';
import { Search, SlidersHorizontal, Trash2, ArrowUpDown, ChevronDown, Check } from 'lucide-react';
import { groupFeaturesByCategory, MASTER_FEATURES } from '@/lib/attributes';
import { useApp } from '@/context/AppContext';
import { getTranslations, getFeatureLabel, getCategoryLabel } from '@/lib/translations';

interface PropertySearchPageProps {
  type: 'buy' | 'rent';
  provinceName: string;
  initialItems: any[];
}

export default function PropertySearchPage({
  type,
  provinceName,
  initialItems,
}: PropertySearchPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { language } = useApp();
  const t = getTranslations(language);

  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');

  // Read current filters from URL params
  const currentPropertyType = searchParams.get('propertyType') || 'all';
  const currentPriceMax = searchParams.get('priceMax') || '';
  const currentBedrooms = searchParams.get('bedrooms') || '0';
  const currentBathrooms = searchParams.get('bathrooms') || '0';
  const currentParking = searchParams.get('parking') || '0';
  const currentSort = searchParams.get('sort') || 'recent';
  const currentFeatures = searchParams.get('features')?.split(',').filter(Boolean) || [];

  const [showAllFeatures, setShowAllFeatures] = useState(false);

  // Calculate active filter count
  let activeFilterCount = 0;
  if (currentPropertyType !== 'all') activeFilterCount++;
  if (currentPriceMax !== '') activeFilterCount++;
  if (currentBedrooms !== '0') activeFilterCount++;
  if (currentBathrooms !== '0') activeFilterCount++;
  if (currentParking !== '0') activeFilterCount++;
  if (searchText !== '') activeFilterCount++;
  activeFilterCount += currentFeatures.length;

  // Apply filters by pushing to URL
  const updateUrl = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === '0') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search: searchText });
  };

  const handleClearFilters = () => {
    setSearchText('');
    router.push(pathname);
  };

  const resultTitle = type === 'buy' ? t.search.salesTitle : t.search.rentalsTitle;
  const resultsSubtitleText = t.search.resultsSubtitle.split('{count}');

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      
      {/* 1. Header & Quick Info - Editorial layout */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-stone-200/80 dark:border-stone-850">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            {resultTitle}{t.search.inProvince}<span className="text-primary">{provinceName}</span>
          </h1>
          <p className="text-xs font-semibold text-stone-450 dark:text-stone-550 mt-2">
            {resultsSubtitleText[0]}
            <span className="font-bold text-stone-900 dark:text-stone-200">{initialItems.length}</span>
            {resultsSubtitleText[1]}
          </p>
        </div>

        {/* Sorting & Filter toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-lg border px-4.5 py-3 text-xs font-bold transition-all cursor-pointer ${
              showFilters 
                ? 'bg-stone-950 text-white border-stone-950 dark:bg-stone-100 dark:text-stone-950 dark:border-stone-100 shadow' 
                : 'bg-card-bg hover:bg-primary-light text-stone-750 dark:text-stone-200 border-card-border shadow-sm'
            }`}
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            <span>{t.search.filtersBtn}</span>
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white ring-2 ring-white dark:ring-stone-950">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative flex-grow sm:flex-grow-0">
            <select
              value={currentSort}
              onChange={(e) => updateUrl({ sort: e.target.value })}
              className="w-full bg-card-bg text-stone-750 dark:text-stone-200 text-xs font-bold rounded-lg border border-card-border px-4 py-3 pr-9 appearance-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 cursor-pointer shadow-sm"
            >
              <option value="recent">{t.search.sortRecent}</option>
              <option value="price_asc">{t.search.sortPriceAsc}</option>
              <option value="price_desc">{t.search.sortPriceDesc}</option>
              <option value="relevant">{t.search.sortRelevant}</option>
            </select>
            <ArrowUpDown className="absolute right-3.5 top-3.5 h-4 w-4 text-stone-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 2. Filter Panel - Apple Minimalist Style / Mobile Bottom Drawer */}
      {showFilters && (
        <>
          {/* Mobile Overlay Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm sm:hidden animate-fadeIn"
            onClick={() => setShowFilters(false)}
          />
          
          {/* Filters Container Drawer */}
          <div className="fixed bottom-0 inset-x-0 z-50 sm:static rounded-t-2xl sm:rounded-xl border-t sm:border border-card-border bg-card-bg p-6 sm:p-6.5 sm:mb-10 shadow-2xl sm:shadow-sm max-h-[85vh] sm:max-h-none overflow-y-auto sm:overflow-visible animate-slide-up sm:animate-fadeIn">
            
            {/* Mobile Handle & Close Header */}
            <div className="flex items-center justify-between sm:hidden pb-4 border-b border-stone-150 dark:border-stone-800/80 mb-5 shrink-0">
              <div className="w-10" />
              <div className="h-1.5 w-10 bg-stone-300 dark:bg-stone-700 rounded-full" />
              <button 
                type="button" 
                onClick={() => setShowFilters(false)}
                className="text-[10px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-550 cursor-pointer p-1"
              >
                {t.navbar.mobileMenuClose}
              </button>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-wider mb-2">
                {t.search.searchLabel} {searchText && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={t.search.searchPlaceholder}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className={`input-premium py-3 pl-10 pr-20 ${searchText ? 'border-primary/50 bg-primary-light/10 dark:bg-primary-light/5' : ''}`}
                />
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
                <button 
                  type="submit" 
                  className="btn-primary absolute right-1.5 top-1.5 py-1.5 px-3 text-[10px] shadow-sm"
                >
                  {t.search.searchBtn}
                </button>
              </div>
            </form>

            {/* Property Type */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-wider mb-2">
                {t.search.propertyTypeLabel} {currentPropertyType !== 'all' && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <select
                value={currentPropertyType}
                onChange={(e) => updateUrl({ propertyType: e.target.value })}
                className={`input-premium py-3 cursor-pointer ${currentPropertyType !== 'all' ? 'border-primary/50 bg-primary-light/10 dark:bg-primary-light/5' : ''}`}
              >
                <option value="all">{t.search.allTypes}</option>
                <option value="house">{language === 'en' ? 'Houses' : 'Casas'}</option>
                <option value="apartment">{language === 'en' ? 'Apartments' : 'Apartamentos'}</option>
                <option value="lot">{language === 'en' ? 'Lots/Lands' : 'Lotes/Terrenos'}</option>
                <option value="commercial">{language === 'en' ? 'Commercial Spaces' : 'Locales Comerciales'}</option>
                <option value="other">{language === 'en' ? 'Others' : 'Otros'}</option>
              </select>
            </div>

            {/* Price Max */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-550 uppercase tracking-wider mb-2">
                {t.search.priceMaxLabel} ({type === 'rent' ? (language === 'en' ? 'CRC/month' : '₡/mes') : 'USD'}) {currentPriceMax && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <input
                type="number"
                placeholder={t.search.anyPrice}
                value={currentPriceMax}
                onChange={(e) => updateUrl({ priceMax: e.target.value })}
                className={`input-premium py-3 ${currentPriceMax ? 'border-primary/50 bg-primary-light/10' : ''}`}
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-555 uppercase tracking-wider mb-2">
                {t.search.bedroomsLabel} {currentBedrooms !== '0' && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <select
                value={currentBedrooms}
                onChange={(e) => updateUrl({ bedrooms: e.target.value })}
                className={`input-premium py-3 cursor-pointer ${currentBedrooms !== '0' ? 'border-primary/50 bg-primary-light/10' : ''}`}
              >
                <option value="0">{t.search.any}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>

            {/* Bathrooms */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-555 uppercase tracking-wider mb-2">
                {t.search.bathroomsLabel} {currentBathrooms !== '0' && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <select
                value={currentBathrooms}
                onChange={(e) => updateUrl({ bathrooms: e.target.value })}
                className={`input-premium py-3 cursor-pointer ${currentBathrooms !== '0' ? 'border-primary/50 bg-primary-light/10' : ''}`}
              >
                <option value="0">{t.search.any}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>

            {/* Parking */}
            <div>
              <label className="block text-[10px] font-bold text-stone-400 dark:text-stone-555 uppercase tracking-wider mb-2">
                {t.search.parkingLabel} {currentParking !== '0' && <span className="text-primary font-black">{t.search.activeFilter}</span>}
              </label>
              <select
                value={currentParking}
                onChange={(e) => updateUrl({ parking: e.target.value })}
                className={`input-premium py-3 cursor-pointer ${currentParking !== '0' ? 'border-primary/50 bg-primary-light/10' : ''}`}
              >
                <option value="0">{t.search.any}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
              </select>
            </div>
          </div>

          {/* Dynamic Contextual Attributes Section */}
          <div className="col-span-1 sm:col-span-2 md:col-span-4 border-t border-stone-150 dark:border-stone-800/80 pt-5 mt-2 space-y-5">
            <div>
              <h4 className="font-display font-bold text-xs text-stone-800 dark:text-stone-150 tracking-tight">{t.search.advancedFilters}</h4>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">{t.search.advancedFiltersDesc}</p>
            </div>

            <div className="space-y-4">
              {Object.entries(groupFeaturesByCategory(currentPropertyType)).map(([categoryKey, featureList]) => {
                // Filter features based on isPrimary or showAllFeatures state
                const visibleFeatures = featureList.filter(f => f.isPrimary || showAllFeatures);
                
                if (visibleFeatures.length === 0) return null;

                const categoryLabelText = getCategoryLabel(categoryKey, language);

                return (
                  <div key={categoryKey} className="space-y-1.5 animate-fadeIn">
                    <span className="text-[8px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-550 block">
                      {categoryLabelText}
                    </span>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {visibleFeatures.map((feat) => {
                        const isChecked = currentFeatures.includes(feat.key);
                        
                        const handleToggle = () => {
                          const nextFeatures = isChecked
                            ? currentFeatures.filter(k => k !== feat.key)
                            : [...currentFeatures, feat.key];
                          updateUrl({ features: nextFeatures.length > 0 ? nextFeatures.join(',') : null });
                        };

                        const featureLabelText = getFeatureLabel(feat.key, feat.label, language);

                        return (
                          <button
                            key={feat.key}
                            type="button"
                            onClick={handleToggle}
                            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer select-none active:scale-[0.97] ${
                              isChecked
                                ? 'bg-primary-light/45 border-primary text-primary dark:bg-primary-light/10 shadow-sm'
                                : 'bg-stone-50/50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-650 dark:text-stone-400 hover:border-stone-300'
                            }`}
                          >
                            {isChecked && <Check className="h-3 w-3 shrink-0" />}
                            <span>{featureLabelText}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more button if there are secondary features */}
            {((MASTER_FEATURES[currentPropertyType] || MASTER_FEATURES.other).some(f => !f.isPrimary)) && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="btn-secondary py-1.5 px-3 text-[10px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllFeatures ? t.search.showLessFilters : t.search.showMoreFilters}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAllFeatures ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="flex justify-end gap-3 border-t border-stone-100 dark:border-stone-850 pt-4 mt-6">
            <button
              onClick={handleClearFilters}
              className="btn-danger py-2 px-4 text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              <span>{t.search.clearFilters}</span>
            </button>
          </div>
          </div>
        </>
      )}

      {/* 3. Property Grid Results */}
      {initialItems.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-stretch py-12 px-6 sm:px-10 rounded-2xl border border-card-border bg-card-bg shadow-sm animate-fadeIn">
          
          {/* Left Column - Editorial statement and action */}
          <div className="md:col-span-3 flex flex-col justify-center space-y-6 text-left pr-0 md:pr-6">
            <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 dark:text-stone-550">
              {language === 'en' ? 'Property Search' : 'Búsqueda de espacios'}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white leading-tight">
              {t.search.emptyTitle}
            </h2>
            <p className="text-xs text-stone-555 dark:text-stone-400 leading-relaxed font-semibold max-w-lg">
              {t.search.emptyDesc}
            </p>
            
            <div className="pt-2">
              <button
                onClick={handleClearFilters}
                className="btn-primary py-3 px-6 text-xs inline-flex items-center gap-2 cursor-pointer shadow active:scale-[0.985] transition-all duration-200"
              >
                <Trash2 className="h-4 w-4" />
                <span>{t.search.emptyResetBtn}</span>
              </button>
            </div>
          </div>

          {/* Right Column - Asymmetric Curated Inspiration Grid */}
          <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-stone-150 dark:border-stone-800/80 pt-8 md:pt-0 md:pl-10 flex flex-col justify-center space-y-6">
            <div className="space-y-1.5">
              <h3 className="font-display font-bold text-sm text-stone-850 dark:text-stone-150 tracking-tight">
                {t.search.inspirationTitle}
              </h3>
              <p className="text-[10px] text-stone-450 dark:text-stone-500">
                {t.search.inspirationDesc}
              </p>
            </div>

            {/* Quick Location Chips Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'San José', path: `/${language}/${type === 'buy' ? 'comprar' : 'alquilar'}/san-jose` },
                { name: 'Heredia', path: `/${language}/${type === 'buy' ? 'comprar' : 'alquilar'}/heredia` },
                { name: 'Alajuela', path: `/${language}/${type === 'buy' ? 'comprar' : 'alquilar'}/alajuela` },
                { name: 'Cartago', path: `/${language}/${type === 'buy' ? 'comprar' : 'alquilar'}/cartago` },
              ].map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    setSearchText('');
                    router.push(loc.path);
                  }}
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 bg-stone-50/50 dark:bg-stone-950/40 text-[11px] font-bold text-stone-750 dark:text-stone-300 transition-all active:scale-[0.97] cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900"
                >
                  <span>{loc.name}</span>
                  <span className="text-[9px] text-stone-400 uppercase tracking-widest font-black">{language === 'en' ? 'Explore' : 'Explorar'}</span>
                </button>
              ))}
            </div>

            {/* Curated quote block */}
            <div className="p-4 rounded-xl bg-stone-50/60 dark:bg-stone-950/20 border border-stone-150 dark:border-stone-800/60">
              <p className="italic text-[10px] text-stone-500 dark:text-stone-400 leading-normal">
                {t.search.missionQuote}
              </p>
              <span className="block text-[8px] font-black uppercase tracking-wider text-stone-400 dark:text-stone-550 mt-2">
                — TicoHabitat
              </span>
            </div>
          </div>
          
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {initialItems.map((property) => (
            <PropertyCard
              key={property.id}
              property={{
                id: property.id,
                type: property.type,
                propertyType: property.propertyType,
                title: property.title,
                slug: property.slug,
                price: property.price,
                currency: property.currency,
                province: property.province,
                canton: property.canton,
                bedrooms: property.bedrooms,
                bathrooms: property.bathrooms,
                parkingSpaces: property.parkingSpaces,
                petsAllowed: property.petsAllowed,
                featured: property.featured,
                verified: property.verified,
                imageUrl: property.images?.[0]?.url,
                contactPhone: property.contactPhone,
                whatsapp: property.whatsapp,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
