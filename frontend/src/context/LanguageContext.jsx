import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STRINGS = {
  en: {
    'nav.home':'Home','nav.bestxi':'Best XI','nav.players':'Players','nav.fixtures':'Fixtures',
    'nav.stats':'Stats','nav.compare':'Compare','nav.methodology':'Methodology',
    'bestxi.title':'Build the Best XI','bestxi.formation':'Formation','bestxi.window':'Time Window',
    'bestxi.league_filter':'League Filter','bestxi.rating_method':'Rating Method',
    'bestxi.min_minutes':'Minimum Minutes','bestxi.generate':'Generate Best XI',
    'bestxi.commercial':'Commercial','bestxi.custom':'Custom xT/VAEP',
    'bestxi.caveat':'Rankings reflect recent form only.',
    'bestxi.heuristic_warning':'Custom ratings unavailable for Botola/MENA — heuristic scores shown.',
    'player.rating':'Rating','player.position':'Position','player.club':'Club',
    'player.market_value':'Market Value','player.age':'Age','player.minutes':'Minutes',
    'player.archetype':'Archetype','player.eligibility':'Eligibility','player.data_quality':'Data Quality',
    'common.loading':'Loading…','common.search':'Search players, clubs…','common.filter':'Filter',
    'common.reset':'Reset','common.share':'Share','common.view_all':'View all',
  },
  fr: {
    'nav.home':'Accueil','nav.bestxi':'Onze idéal','nav.players':'Joueurs','nav.fixtures':'Matchs',
    'nav.stats':'Stats','nav.compare':'Comparer','nav.methodology':'Méthodologie',
    'bestxi.title':'Composer le Onze idéal','bestxi.formation':'Schéma','bestxi.window':'Période',
    'bestxi.league_filter':'Filtre des ligues','bestxi.rating_method':'Méthode',
    'bestxi.min_minutes':'Minutes minimum','bestxi.generate':'Générer le Onze',
    'bestxi.commercial':'Commerciale','bestxi.custom':'xT/VAEP',
    'bestxi.caveat':'Forme récente uniquement.',
    'bestxi.heuristic_warning':'Notes personnalisées indisponibles pour la Botola/MENA.',
    'common.loading':'Chargement…','common.search':'Rechercher…','common.filter':'Filtrer',
    'common.reset':'Réinitialiser','common.share':'Partager','common.view_all':'Tout voir',
  },
  ar: {
    'nav.home':'الرئيسية','nav.bestxi':'أفضل تشكيلة','nav.players':'اللاعبون','nav.fixtures':'المباريات',
    'nav.stats':'الإحصاءات','nav.compare':'مقارنة','nav.methodology':'المنهجية',
    'bestxi.title':'بناء أفضل تشكيلة','bestxi.formation':'الخطة','bestxi.window':'الفترة',
    'bestxi.league_filter':'تصفية البطولات','bestxi.rating_method':'طريقة التقييم',
    'bestxi.min_minutes':'الحد الأدنى للدقائق','bestxi.generate':'إنشاء التشكيلة',
    'bestxi.commercial':'تجاري','bestxi.custom':'xT/VAEP',
    'bestxi.caveat':'تعكس الترتيبات الأداء الأخير فقط.',
    'bestxi.heuristic_warning':'التقييم المخصص غير متاح لدوري البطولة/الشرق الأوسط.',
    'common.loading':'جار التحميل…','common.search':'بحث…','common.filter':'تصفية',
    'common.reset':'إعادة','common.share':'مشاركة','common.view_all':'عرض الكل',
  },
};

const LanguageContext = createContext({ locale: 'en', t: k => k, isRTL: false, setLocale: () => {} });

export function LanguageProvider({ children }) {
  const [locale, setLocale] = useState(() => localStorage.getItem('atlas-locale') || 'en');
  useEffect(() => {
    localStorage.setItem('atlas-locale', locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);
  const t = useCallback(k => (STRINGS[locale]?.[k]) || STRINGS.en[k] || k, [locale]);
  return (
    <LanguageContext.Provider value={{ locale, t, isRTL: locale === 'ar', setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useT = () => useContext(LanguageContext);
export default LanguageContext;
