import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type LanguageCode = "en" | "ar" | "fr" | "es" | "de"
export type LanguageSetting = LanguageCode | "auto"

export const SUPPORTED_LANGUAGES: { code: LanguageCode; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
]

const RTL_LANGUAGES: LanguageCode[] = ["ar"]

type TranslationKey =
  | "nav.brand"
  | "nav.jumpstart"
  | "nav.livelab"
  | "nav.assetReviver"
  | "nav.language"
  | "nav.autoDetect"
  | "nav.career"
  | "jumpstart.title"
  | "jumpstart.subtitle"
  | "jumpstart.promptPlaceholder"
  | "jumpstart.generate"
  | "jumpstart.generatedBoards"
  | "jumpstart.noBoards"
  | "jumpstart.selectBoard"
  | "jumpstart.generatedFrom"
  | "jumpstart.delegate"
  | "jumpstart.delegating"
  | "jumpstart.delegated"
  | "livelab.title"
  | "livelab.subtitle"
  | "livelab.explain"
  | "livelab.codePlaceholder"
  | "livelab.questionPlaceholder"
  | "livelab.waitingTitle"
  | "livelab.waitingSubtitle"
  | "livelab.explainError"
  | "livelab.focusTitle"
  | "livelab.focusDeepWork"
  | "livelab.focusReview"
  | "livelab.focusStart"
  | "livelab.focusPause"
  | "livelab.focusReset"
  | "livelab.stuckTip"
  | "livelab.stuckDismiss"
  | "assetReviver.title"
  | "assetReviver.subtitle"
  | "assetReviver.uploadFile"
  | "assetReviver.uploadHint"
  | "assetReviver.or"
  | "assetReviver.pasteLabel"
  | "assetReviver.pastePlaceholder"
  | "assetReviver.generateFromText"
  | "assetReviver.recentJobs"
  | "assetReviver.emptyTitle"
  | "assetReviver.emptySubtitle"
  | "assetReviver.marketingTab"
  | "assetReviver.ebookTab"
  | "assetReviver.coverTab"
  | "assetReviver.cover"

type Translations = Record<TranslationKey, string>

const en: Translations = {
  "nav.brand": "IgniteAI",
  "nav.jumpstart": "JumpStart",
  "nav.livelab": "LiveLab",
  "nav.assetReviver": "Asset Reviver",
  "nav.language": "Language",
  "nav.autoDetect": "Auto-Detect",
  "nav.career": "Career Catalyst",
  "jumpstart.title": "JumpStart",
  "jumpstart.subtitle": "Describe a goal, let Gemini break it down into a Kanban board instantly.",
  "jumpstart.promptPlaceholder": "e.g. Launch a new landing page for a coffee shop...",
  "jumpstart.generate": "Generate",
  "jumpstart.generatedBoards": "Generated Boards",
  "jumpstart.noBoards": "No boards yet.",
  "jumpstart.selectBoard": "Select a board from the list to view",
  "jumpstart.generatedFrom": "Generated from",
  "jumpstart.delegate": "Delegate to Agent",
  "jumpstart.delegating": "Delegating...",
  "jumpstart.delegated": "Agent notes added",
  "livelab.title": "LiveLab",
  "livelab.subtitle": "Paste code and have Gemini explain it.",
  "livelab.explain": "Explain Code",
  "livelab.codePlaceholder": "Paste your code here...",
  "livelab.questionPlaceholder": "Ask a specific question about this code...",
  "livelab.waitingTitle": "Waiting for code",
  "livelab.waitingSubtitle": "Paste some code and click Explain. You can also add a specific question below.",
  "livelab.explainError": "Error generating explanation. Please try again.",
  "livelab.focusTitle": "Focus Guard",
  "livelab.focusDeepWork": "Deep Focus",
  "livelab.focusReview": "AI Review Break",
  "livelab.focusStart": "Start",
  "livelab.focusPause": "Pause",
  "livelab.focusReset": "Reset",
  "livelab.stuckTip": "Still on the same code? Here's a quick tip to keep you moving:",
  "livelab.stuckDismiss": "Dismiss",
  "assetReviver.title": "Asset Reviver",
  "assetReviver.subtitle": "Upload dull exports, get polished marketing copy and e-books.",
  "assetReviver.uploadFile": "Upload file",
  "assetReviver.uploadHint": "Excel (.xlsx/.xls), CSV, or a Notion export (.txt/.md)",
  "assetReviver.or": "or",
  "assetReviver.pasteLabel": "Or write the content/data draft directly here",
  "assetReviver.pastePlaceholder": "Type or paste your raw content here...",
  "assetReviver.generateFromText": "Generate from text",
  "assetReviver.recentJobs": "Recent Jobs",
  "assetReviver.emptyTitle": "Asset Reviver",
  "assetReviver.emptySubtitle": "Select a job from the sidebar or upload a new export to generate marketing copy and e-books automatically.",
  "assetReviver.marketingTab": "Marketing Copy",
  "assetReviver.ebookTab": "E-Book",
  "assetReviver.coverTab": "Cover Art",
  "assetReviver.cover": "Promotional cover sketch",
}

const ar: Translations = {
  "nav.brand": "إيجنايت إيه آي",
  "nav.jumpstart": "الانطلاقة",
  "nav.livelab": "المختبر الحي",
  "nav.assetReviver": "إحياء الأصول",
  "nav.language": "اللغة",
  "nav.autoDetect": "كشف تلقائي",
  "nav.career": "محفز المسيرة",
  "jumpstart.title": "الانطلاقة",
  "jumpstart.subtitle": "صف هدفك، ودع Gemini يحوّله فورًا إلى لوحة كانبان.",
  "jumpstart.promptPlaceholder": "مثال: إطلاق صفحة هبوط جديدة لمقهى...",
  "jumpstart.generate": "إنشاء",
  "jumpstart.generatedBoards": "اللوحات المُنشأة",
  "jumpstart.noBoards": "لا توجد لوحات بعد.",
  "jumpstart.selectBoard": "اختر لوحة من القائمة لعرضها",
  "jumpstart.generatedFrom": "تم إنشاؤها من",
  "jumpstart.delegate": "تفويض إلى الوكيل",
  "jumpstart.delegating": "جارٍ التفويض...",
  "jumpstart.delegated": "تمت إضافة ملاحظات الوكيل",
  "livelab.title": "المختبر الحي",
  "livelab.subtitle": "الصق الكود ودع Gemini يشرحه لك.",
  "livelab.explain": "اشرح الكود",
  "livelab.codePlaceholder": "الصق الكود هنا...",
  "livelab.questionPlaceholder": "اطرح سؤالاً محددًا حول هذا الكود...",
  "livelab.waitingTitle": "بانتظار الكود",
  "livelab.waitingSubtitle": "الصق بعض الكود وانقر على شرح. يمكنك أيضًا إضافة سؤال محدد أدناه.",
  "livelab.explainError": "حدث خطأ أثناء إنشاء الشرح. حاول مرة أخرى.",
  "livelab.focusTitle": "حارس التركيز",
  "livelab.focusDeepWork": "تركيز عميق",
  "livelab.focusReview": "استراحة مراجعة الذكاء الاصطناعي",
  "livelab.focusStart": "بدء",
  "livelab.focusPause": "إيقاف مؤقت",
  "livelab.focusReset": "إعادة تعيين",
  "livelab.stuckTip": "ما زلت على نفس الكود؟ إليك نصيحة سريعة لمساعدتك على التقدم:",
  "livelab.stuckDismiss": "إغلاق",
  "assetReviver.title": "إحياء الأصول",
  "assetReviver.subtitle": "ارفع ملفات باهتة، واحصل على نصوص تسويقية وكتب إلكترونية احترافية.",
  "assetReviver.uploadFile": "رفع ملف",
  "assetReviver.uploadHint": "إكسل (.xlsx/.xls)، CSV، أو تصدير من Notion (.txt/.md)",
  "assetReviver.or": "أو",
  "assetReviver.pasteLabel": "أو اكتب مسودة المحتوى/البيانات هنا مباشرة",
  "assetReviver.pastePlaceholder": "اكتب أو الصق المحتوى الخام هنا...",
  "assetReviver.generateFromText": "إنشاء من النص",
  "assetReviver.recentJobs": "المهام الأخيرة",
  "assetReviver.emptyTitle": "إحياء الأصول",
  "assetReviver.emptySubtitle": "اختر مهمة من القائمة الجانبية أو ارفع ملفًا جديدًا لإنشاء نصوص تسويقية وكتب إلكترونية تلقائيًا.",
  "assetReviver.marketingTab": "النص التسويقي",
  "assetReviver.ebookTab": "الكتاب الإلكتروني",
  "assetReviver.coverTab": "تصميم الغلاف",
  "assetReviver.cover": "مخطط الغلاف الترويجي",
}

const fr: Translations = {
  "nav.brand": "IgniteAI",
  "nav.jumpstart": "JumpStart",
  "nav.livelab": "LiveLab",
  "nav.assetReviver": "Asset Reviver",
  "nav.language": "Langue",
  "nav.autoDetect": "Détection auto",
  "nav.career": "Career Catalyst",
  "jumpstart.title": "JumpStart",
  "jumpstart.subtitle": "Décrivez un objectif, laissez Gemini le transformer instantanément en tableau Kanban.",
  "jumpstart.promptPlaceholder": "ex. Lancer une nouvelle page d'accueil pour un café...",
  "jumpstart.generate": "Générer",
  "jumpstart.generatedBoards": "Tableaux générés",
  "jumpstart.noBoards": "Aucun tableau pour le moment.",
  "jumpstart.selectBoard": "Sélectionnez un tableau dans la liste",
  "jumpstart.generatedFrom": "Généré à partir de",
  "jumpstart.delegate": "Déléguer à l'agent",
  "jumpstart.delegating": "Délégation...",
  "jumpstart.delegated": "Notes de l'agent ajoutées",
  "livelab.title": "LiveLab",
  "livelab.subtitle": "Collez du code et laissez Gemini l'expliquer.",
  "livelab.explain": "Expliquer le code",
  "livelab.codePlaceholder": "Collez votre code ici...",
  "livelab.questionPlaceholder": "Posez une question précise sur ce code...",
  "livelab.waitingTitle": "En attente de code",
  "livelab.waitingSubtitle": "Collez du code et cliquez sur Expliquer. Vous pouvez aussi ajouter une question ci-dessous.",
  "livelab.explainError": "Erreur lors de la génération de l'explication. Réessayez.",
  "livelab.focusTitle": "Focus Guard",
  "livelab.focusDeepWork": "Concentration profonde",
  "livelab.focusReview": "Pause de révision IA",
  "livelab.focusStart": "Démarrer",
  "livelab.focusPause": "Pause",
  "livelab.focusReset": "Réinitialiser",
  "livelab.stuckTip": "Toujours sur le même code ? Voici une astuce rapide pour avancer :",
  "livelab.stuckDismiss": "Fermer",
  "assetReviver.title": "Asset Reviver",
  "assetReviver.subtitle": "Importez des exports ternes, obtenez des textes marketing et des e-books soignés.",
  "assetReviver.uploadFile": "Importer un fichier",
  "assetReviver.uploadHint": "Excel (.xlsx/.xls), CSV, ou export Notion (.txt/.md)",
  "assetReviver.or": "ou",
  "assetReviver.pasteLabel": "Ou écrivez directement votre brouillon de contenu ici",
  "assetReviver.pastePlaceholder": "Écrivez ou collez votre contenu brut ici...",
  "assetReviver.generateFromText": "Générer à partir du texte",
  "assetReviver.recentJobs": "Tâches récentes",
  "assetReviver.emptyTitle": "Asset Reviver",
  "assetReviver.emptySubtitle": "Sélectionnez une tâche dans la barre latérale ou importez un nouvel export pour générer automatiquement du contenu marketing et des e-books.",
  "assetReviver.marketingTab": "Texte marketing",
  "assetReviver.ebookTab": "E-Book",
  "assetReviver.coverTab": "Illustration de couverture",
  "assetReviver.cover": "Esquisse de couverture promotionnelle",
}

const es: Translations = {
  "nav.brand": "IgniteAI",
  "nav.jumpstart": "JumpStart",
  "nav.livelab": "LiveLab",
  "nav.assetReviver": "Asset Reviver",
  "nav.language": "Idioma",
  "nav.autoDetect": "Detección automática",
  "nav.career": "Career Catalyst",
  "jumpstart.title": "JumpStart",
  "jumpstart.subtitle": "Describe un objetivo y deja que Gemini lo convierta al instante en un tablero Kanban.",
  "jumpstart.promptPlaceholder": "ej. Lanzar una nueva landing page para una cafetería...",
  "jumpstart.generate": "Generar",
  "jumpstart.generatedBoards": "Tableros generados",
  "jumpstart.noBoards": "Aún no hay tableros.",
  "jumpstart.selectBoard": "Selecciona un tablero de la lista para verlo",
  "jumpstart.generatedFrom": "Generado a partir de",
  "jumpstart.delegate": "Delegar al agente",
  "jumpstart.delegating": "Delegando...",
  "jumpstart.delegated": "Notas del agente añadidas",
  "livelab.title": "LiveLab",
  "livelab.subtitle": "Pega código y deja que Gemini lo explique.",
  "livelab.explain": "Explicar código",
  "livelab.codePlaceholder": "Pega tu código aquí...",
  "livelab.questionPlaceholder": "Haz una pregunta específica sobre este código...",
  "livelab.waitingTitle": "Esperando código",
  "livelab.waitingSubtitle": "Pega algo de código y haz clic en Explicar. También puedes añadir una pregunta específica abajo.",
  "livelab.explainError": "Error al generar la explicación. Inténtalo de nuevo.",
  "livelab.focusTitle": "Focus Guard",
  "livelab.focusDeepWork": "Enfoque profundo",
  "livelab.focusReview": "Pausa de revisión IA",
  "livelab.focusStart": "Iniciar",
  "livelab.focusPause": "Pausar",
  "livelab.focusReset": "Reiniciar",
  "livelab.stuckTip": "¿Sigues con el mismo código? Aquí tienes un consejo rápido para avanzar:",
  "livelab.stuckDismiss": "Cerrar",
  "assetReviver.title": "Asset Reviver",
  "assetReviver.subtitle": "Sube exportaciones aburridas, obtén textos de marketing y e-books pulidos.",
  "assetReviver.uploadFile": "Subir archivo",
  "assetReviver.uploadHint": "Excel (.xlsx/.xls), CSV, o una exportación de Notion (.txt/.md)",
  "assetReviver.or": "o",
  "assetReviver.pasteLabel": "O escribe el borrador del contenido/datos aquí directamente",
  "assetReviver.pastePlaceholder": "Escribe o pega tu contenido en bruto aquí...",
  "assetReviver.generateFromText": "Generar desde texto",
  "assetReviver.recentJobs": "Tareas recientes",
  "assetReviver.emptyTitle": "Asset Reviver",
  "assetReviver.emptySubtitle": "Selecciona una tarea de la barra lateral o sube una nueva exportación para generar automáticamente contenido de marketing y e-books.",
  "assetReviver.marketingTab": "Texto de marketing",
  "assetReviver.ebookTab": "E-Book",
  "assetReviver.coverTab": "Arte de portada",
  "assetReviver.cover": "Boceto de portada promocional",
}

const de: Translations = {
  "nav.brand": "IgniteAI",
  "nav.jumpstart": "JumpStart",
  "nav.livelab": "LiveLab",
  "nav.assetReviver": "Asset Reviver",
  "nav.language": "Sprache",
  "nav.autoDetect": "Automatische Erkennung",
  "nav.career": "Career Catalyst",
  "jumpstart.title": "JumpStart",
  "jumpstart.subtitle": "Beschreibe ein Ziel, und lass Gemini es sofort in ein Kanban-Board umwandeln.",
  "jumpstart.promptPlaceholder": "z. B. Neue Landingpage für ein Café starten...",
  "jumpstart.generate": "Generieren",
  "jumpstart.generatedBoards": "Erstellte Boards",
  "jumpstart.noBoards": "Noch keine Boards.",
  "jumpstart.selectBoard": "Wähle ein Board aus der Liste aus",
  "jumpstart.generatedFrom": "Erstellt aus",
  "jumpstart.delegate": "An Agent delegieren",
  "jumpstart.delegating": "Delegiere...",
  "jumpstart.delegated": "Agentennotizen hinzugefügt",
  "livelab.title": "LiveLab",
  "livelab.subtitle": "Code einfügen und von Gemini erklären lassen.",
  "livelab.explain": "Code erklären",
  "livelab.codePlaceholder": "Code hier einfügen...",
  "livelab.questionPlaceholder": "Stelle eine konkrete Frage zu diesem Code...",
  "livelab.waitingTitle": "Warte auf Code",
  "livelab.waitingSubtitle": "Füge etwas Code ein und klicke auf Erklären. Du kannst unten auch eine konkrete Frage stellen.",
  "livelab.explainError": "Fehler beim Erstellen der Erklärung. Bitte erneut versuchen.",
  "livelab.focusTitle": "Focus Guard",
  "livelab.focusDeepWork": "Tiefe Konzentration",
  "livelab.focusReview": "KI-Review-Pause",
  "livelab.focusStart": "Start",
  "livelab.focusPause": "Pause",
  "livelab.focusReset": "Zurücksetzen",
  "livelab.stuckTip": "Immer noch beim gleichen Code? Hier ist ein schneller Tipp:",
  "livelab.stuckDismiss": "Schließen",
  "assetReviver.title": "Asset Reviver",
  "assetReviver.subtitle": "Lade langweilige Exporte hoch und erhalte poliertes Marketingmaterial und E-Books.",
  "assetReviver.uploadFile": "Datei hochladen",
  "assetReviver.uploadHint": "Excel (.xlsx/.xls), CSV oder ein Notion-Export (.txt/.md)",
  "assetReviver.or": "oder",
  "assetReviver.pasteLabel": "Oder schreibe den Entwurf des Inhalts/der Daten direkt hier",
  "assetReviver.pastePlaceholder": "Schreibe oder füge deinen Rohinhalt hier ein...",
  "assetReviver.generateFromText": "Aus Text generieren",
  "assetReviver.recentJobs": "Letzte Aufträge",
  "assetReviver.emptyTitle": "Asset Reviver",
  "assetReviver.emptySubtitle": "Wähle einen Auftrag aus der Seitenleiste oder lade einen neuen Export hoch, um automatisch Marketingtexte und E-Books zu erstellen.",
  "assetReviver.marketingTab": "Marketingtext",
  "assetReviver.ebookTab": "E-Book",
  "assetReviver.coverTab": "Cover-Design",
  "assetReviver.cover": "Werbe-Cover-Skizze",
}

const DICTIONARIES: Record<LanguageCode, Translations> = { en, ar, fr, es, de }

const STORAGE_KEY = "igniteai.language"

function detectLanguage(): LanguageCode {
  const browserLangs = typeof navigator !== "undefined" ? navigator.languages || [navigator.language] : []
  for (const raw of browserLangs) {
    const code = raw?.slice(0, 2).toLowerCase()
    if (code && (Object.keys(DICTIONARIES) as LanguageCode[]).includes(code as LanguageCode)) {
      return code as LanguageCode
    }
  }
  return "en"
}

interface LanguageContextValue {
  setting: LanguageSetting
  language: LanguageCode
  dir: "ltr" | "rtl"
  setSetting: (setting: LanguageSetting) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = useState<LanguageSetting>(() => {
    if (typeof window === "undefined") return "auto"
    return (localStorage.getItem(STORAGE_KEY) as LanguageSetting | null) || "auto"
  })

  const language = useMemo<LanguageCode>(
    () => (setting === "auto" ? detectLanguage() : setting),
    [setting]
  )

  const dir: "ltr" | "rtl" = RTL_LANGUAGES.includes(language) ? "rtl" : "ltr"

  useEffect(() => {
    document.documentElement.dir = dir
    document.documentElement.lang = language
  }, [dir, language])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, setting)
  }, [setting])

  const t = useMemo(() => {
    const dict = DICTIONARIES[language]
    return (key: TranslationKey) => dict[key] ?? DICTIONARIES.en[key] ?? key
  }, [language])

  const value = useMemo(
    () => ({ setting, language, dir, setSetting, t }),
    [setting, language, dir, t]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider")
  return ctx
}
