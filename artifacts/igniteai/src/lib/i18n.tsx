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
  | "career.title"
  | "career.subtitle"
  | "career.resumes"
  | "career.targetCountry"
  | "career.remote"
  | "career.uploadResume"
  | "career.uploadHint"
  | "career.uploadReadError"
  | "career.uploadTooLarge"
  | "career.uploadProcessError"
  | "career.skills"
  | "career.experience"
  | "career.jobApplications"
  | "career.addApplication"
  | "career.uploadToStart"
  | "career.newApplication"
  | "career.company"
  | "career.companyPlaceholder"
  | "career.role"
  | "career.rolePlaceholder"
  | "career.jobDesc"
  | "career.jobDescPlaceholder"
  | "career.generateCoverLetter"
  | "career.found"
  | "career.applying"
  | "career.submitted"
  | "career.letter"
  | "career.remoteBadge"
  | "career.ats.title"
  | "career.ats.subtitle"
  | "career.ats.jobDescription"
  | "career.ats.jobDescriptionPlaceholder"
  | "career.ats.resumeText"
  | "career.ats.resumeTextPlaceholder"
  | "career.ats.resumeSourceHelp"
  | "career.ats.run"
  | "career.ats.running"
  | "career.ats.scoreLabel"
  | "career.ats.scoreOutOf"
  | "career.ats.breakdown"
  | "career.ats.issues"
  | "career.ats.topFixes"
  | "career.ats.emptyTitle"
  | "career.ats.emptyDescription"
  | "career.ats.error"
  | "career.ats.inputRequired"
  | "career.ats.fallbackNotice"
  | "career.ats.keywordMatch"
  | "career.ats.formatting"
  | "career.ats.sections"
  | "career.ats.actionImpact"
  | "career.ats.lengthReadability"
  | "career.ats.fallbackKeyword"
  | "career.ats.fallbackFormatting"
  | "career.ats.fallbackSections"
  | "career.ats.fallbackActionImpact"
  | "career.ats.fallbackLength"
  | "career.ats.jobDescriptionTooShort"
  | "career.ats.resumeTooShort"

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
  "career.title": "Career Catalyst",
  "career.subtitle": "Upload your resume, let AI merge your real projects, and track job applications.",
  "career.resumes": "Resumes",
  "career.targetCountry": "Target country (e.g. USA)",
  "career.remote": "Open to remote",
  "career.uploadResume": "Upload resume",
  "career.uploadHint": "PDF, Word, or text file",
  "career.uploadReadError": "Couldn't read text from this file. Scanned/image-only PDFs require OCR; try a text-based PDF, Word file, or paste the resume text.",
  "career.uploadTooLarge": "This file is too large to extract safely. Upload a smaller document.",
  "career.uploadProcessError": "We couldn't upload or process this resume. Please try again.",
  "career.skills": "Skills",
  "career.experience": "Experience",
  "career.jobApplications": "Job Applications",
  "career.addApplication": "Add Application",
  "career.uploadToStart": "Upload or select a resume above to start tracking applications.",
  "career.newApplication": "New Job Application",
  "career.company": "Company",
  "career.companyPlaceholder": "e.g. Stripe",
  "career.role": "Role",
  "career.rolePlaceholder": "e.g. Senior Software Engineer",
  "career.jobDesc": "Job description (optional — improves cover letter)",
  "career.jobDescPlaceholder": "Paste the job description or key requirements…",
  "career.generateCoverLetter": "Generate cover letter & add",
  "career.found": "Found",
  "career.applying": "Applying",
  "career.submitted": "Submitted",
  "career.letter": "Letter",
  "career.remoteBadge": "Remote",
  "career.ats.title": "ATS Score",
  "career.ats.subtitle": "Compare your resume with a job description and get targeted, actionable feedback.",
  "career.ats.jobDescription": "Job description",
  "career.ats.jobDescriptionPlaceholder": "Paste the full job description here…",
  "career.ats.resumeText": "Resume text",
  "career.ats.resumeTextPlaceholder": "Paste your resume text here, or select an uploaded resume from the left panel.",
  "career.ats.resumeSourceHelp": "Use the selected resume from the left panel when this field is empty.",
  "career.ats.run": "Analyze ATS match",
  "career.ats.running": "Analyzing resume…",
  "career.ats.scoreLabel": "ATS compatibility",
  "career.ats.scoreOutOf": "out of 100",
  "career.ats.breakdown": "Score breakdown",
  "career.ats.issues": "Findings",
  "career.ats.topFixes": "Highest-impact fixes",
  "career.ats.emptyTitle": "Ready when you are",
  "career.ats.emptyDescription": "Add a job description and resume to see an ATS score with specific recommendations.",
  "career.ats.error": "We couldn't analyze this resume. Please try again.",
  "career.ats.inputRequired": "Add a job description and either paste resume text or select an uploaded resume.",
  "career.ats.fallbackNotice": "The AI response could not be validated. This is a safe fallback, not a reliable ATS score. Please retry.",
  "career.ats.keywordMatch": "Keyword Match",
  "career.ats.formatting": "Formatting & Parseability",
  "career.ats.sections": "Section Completeness",
  "career.ats.actionImpact": "Action Verbs & Impact",
  "career.ats.lengthReadability": "Length & Readability",
  "career.ats.fallbackKeyword": "Retry to compare resume keywords with the job description.",
  "career.ats.fallbackFormatting": "Retry with a text-based resume to assess ATS parseability.",
  "career.ats.fallbackSections": "Retry to check which standard resume sections are present.",
  "career.ats.fallbackActionImpact": "Retry to assess action verbs and measurable results in your bullets.",
  "career.ats.fallbackLength": "Retry to assess resume length and readability.",
  "career.ats.jobDescriptionTooShort": "Paste at least 40 characters of the job description.",
  "career.ats.resumeTooShort": "Paste at least 50 characters of resume text.",
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
  "career.title": "محفز المسيرة",
  "career.subtitle": "ارفع سيرتك الذاتية، دع الذكاء الاصطناعي يدمج مشاريعك الحقيقية، وتتبع طلبات التوظيف.",
  "career.resumes": "السير الذاتية",
  "career.targetCountry": "الدولة المستهدفة (مثل: السعودية)",
  "career.remote": "منفتح على العمل عن بُعد",
  "career.uploadResume": "رفع السيرة الذاتية",
  "career.uploadHint": "PDF أو Word أو ملف نصي",
  "career.uploadReadError": "تعذرت قراءة نص من هذا الملف. ملفات PDF الممسوحة ضوئيًا أو التي تحتوي صورًا فقط تحتاج إلى OCR؛ جرّب PDF نصيًا أو ملف Word أو الصق نص السيرة الذاتية.",
  "career.uploadTooLarge": "الملف كبير جدًا لاستخراج النص بأمان. ارفع مستندًا أصغر.",
  "career.uploadProcessError": "تعذّر رفع السيرة الذاتية أو معالجتها. حاول مرة أخرى.",
  "career.skills": "المهارات",
  "career.experience": "الخبرة",
  "career.jobApplications": "طلبات التوظيف",
  "career.addApplication": "إضافة طلب",
  "career.uploadToStart": "ارفع أو اختر سيرة ذاتية أعلاه لبدء تتبع الطلبات.",
  "career.newApplication": "طلب توظيف جديد",
  "career.company": "الشركة",
  "career.companyPlaceholder": "مثال: أرامكو",
  "career.role": "المنصب",
  "career.rolePlaceholder": "مثال: مهندس برمجيات أول",
  "career.jobDesc": "وصف الوظيفة (اختياري — يُحسّن رسالة التغطية)",
  "career.jobDescPlaceholder": "الصق وصف الوظيفة أو المتطلبات الرئيسية...",
  "career.generateCoverLetter": "إنشاء رسالة تغطية وإضافة",
  "career.found": "تم العثور عليها",
  "career.applying": "جارٍ التقديم",
  "career.submitted": "تم الإرسال",
  "career.letter": "الرسالة",
  "career.remoteBadge": "عن بُعد",
  "career.ats.title": "درجة توافق ATS",
  "career.ats.subtitle": "قارن سيرتك الذاتية بوصف الوظيفة واحصل على ملاحظات عملية ومحددة.",
  "career.ats.jobDescription": "وصف الوظيفة",
  "career.ats.jobDescriptionPlaceholder": "الصق وصف الوظيفة الكامل هنا...",
  "career.ats.resumeText": "نص السيرة الذاتية",
  "career.ats.resumeTextPlaceholder": "الصق نص سيرتك الذاتية هنا، أو اختر سيرة رفعتها من اللوحة اليسرى.",
  "career.ats.resumeSourceHelp": "سيتم استخدام السيرة المحددة في اللوحة اليسرى إذا تركت هذا الحقل فارغًا.",
  "career.ats.run": "تحليل توافق ATS",
  "career.ats.running": "جارٍ تحليل السيرة الذاتية...",
  "career.ats.scoreLabel": "توافق السيرة مع أنظمة ATS",
  "career.ats.scoreOutOf": "من 100",
  "career.ats.breakdown": "تفصيل الدرجة",
  "career.ats.issues": "ملاحظات",
  "career.ats.topFixes": "أهم التحسينات",
  "career.ats.emptyTitle": "جاهز عندما تكون مستعدًا",
  "career.ats.emptyDescription": "أضف وصف الوظيفة والسيرة الذاتية لعرض الدرجة مع توصيات محددة.",
  "career.ats.error": "تعذر تحليل هذه السيرة الذاتية. حاول مرة أخرى.",
  "career.ats.inputRequired": "أضف وصف الوظيفة والصق نص السيرة الذاتية أو اختر سيرة رفعتها.",
  "career.ats.fallbackNotice": "تعذر التحقق من استجابة الذكاء الاصطناعي. هذه نتيجة احتياطية وليست درجة موثوقة. يرجى إعادة المحاولة.",
  "career.ats.keywordMatch": "مطابقة الكلمات المفتاحية",
  "career.ats.formatting": "التنسيق وقابلية القراءة آليًا",
  "career.ats.sections": "اكتمال الأقسام",
  "career.ats.actionImpact": "أفعال الإنجاز والأثر",
  "career.ats.lengthReadability": "الطول وسهولة القراءة",
  "career.ats.fallbackKeyword": "أعد التحليل لمقارنة كلمات السيرة بوصف الوظيفة.",
  "career.ats.fallbackFormatting": "أعد التحليل باستخدام نص السيرة لتقييم قابلية قراءتها آليًا.",
  "career.ats.fallbackSections": "أعد التحليل للتحقق من وجود أقسام السيرة القياسية.",
  "career.ats.fallbackActionImpact": "أعد التحليل لتقييم أفعال الإنجاز والنتائج القابلة للقياس.",
  "career.ats.fallbackLength": "أعد التحليل لتقييم طول السيرة وسهولة قراءتها.",
  "career.ats.jobDescriptionTooShort": "الصق 40 حرفًا على الأقل من وصف الوظيفة.",
  "career.ats.resumeTooShort": "الصق 50 حرفًا على الأقل من نص السيرة الذاتية.",
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
  "career.title": "Career Catalyst",
  "career.subtitle": "Importez votre CV, laissez l'IA fusionner vos projets réels et suivez vos candidatures.",
  "career.resumes": "CV",
  "career.targetCountry": "Pays cible (ex. France)",
  "career.remote": "Ouvert au télétravail",
  "career.uploadResume": "Importer le CV",
  "career.uploadHint": "PDF, Word ou fichier texte",
  "career.uploadReadError": "Impossible de lire le texte de ce fichier. Les PDF numérisés ou composés uniquement d'images nécessitent l'OCR ; essayez un PDF textuel, un fichier Word ou collez le texte du CV.",
  "career.uploadTooLarge": "Ce fichier est trop volumineux pour une extraction sûre. Importez un document plus petit.",
  "career.uploadProcessError": "Impossible d'importer ou de traiter ce CV. Veuillez réessayer.",
  "career.skills": "Compétences",
  "career.experience": "Expérience",
  "career.jobApplications": "Candidatures",
  "career.addApplication": "Ajouter une candidature",
  "career.uploadToStart": "Importez ou sélectionnez un CV ci-dessus pour commencer.",
  "career.newApplication": "Nouvelle candidature",
  "career.company": "Entreprise",
  "career.companyPlaceholder": "ex. Airbus",
  "career.role": "Poste",
  "career.rolePlaceholder": "ex. Ingénieur logiciel senior",
  "career.jobDesc": "Description du poste (optionnel — améliore la lettre)",
  "career.jobDescPlaceholder": "Collez la description du poste ou les exigences clés…",
  "career.generateCoverLetter": "Générer la lettre & ajouter",
  "career.found": "Trouvé",
  "career.applying": "En cours",
  "career.submitted": "Envoyée",
  "career.letter": "Lettre",
  "career.remoteBadge": "Télétravail",
  "career.ats.title": "Score ATS",
  "career.ats.subtitle": "Comparez votre CV à une offre d'emploi et obtenez des conseils ciblés et concrets.",
  "career.ats.jobDescription": "Description du poste",
  "career.ats.jobDescriptionPlaceholder": "Collez ici l'offre d'emploi complète…",
  "career.ats.resumeText": "Texte du CV",
  "career.ats.resumeTextPlaceholder": "Collez votre CV ici ou sélectionnez un CV importé dans le panneau de gauche.",
  "career.ats.resumeSourceHelp": "Le CV sélectionné à gauche sera utilisé si ce champ est vide.",
  "career.ats.run": "Analyser la compatibilité ATS",
  "career.ats.running": "Analyse du CV…",
  "career.ats.scoreLabel": "Compatibilité ATS",
  "career.ats.scoreOutOf": "sur 100",
  "career.ats.breakdown": "Détail du score",
  "career.ats.issues": "Constats",
  "career.ats.topFixes": "Améliorations prioritaires",
  "career.ats.emptyTitle": "Prêt quand vous l'êtes",
  "career.ats.emptyDescription": "Ajoutez une offre et un CV pour obtenir un score ATS et des recommandations précises.",
  "career.ats.error": "Impossible d'analyser ce CV. Veuillez réessayer.",
  "career.ats.inputRequired": "Ajoutez une offre et collez un CV ou sélectionnez un CV importé.",
  "career.ats.fallbackNotice": "La réponse de l'IA n'a pas pu être validée. Ce résultat de secours n'est pas un score fiable. Veuillez réessayer.",
  "career.ats.keywordMatch": "Correspondance des mots-clés",
  "career.ats.formatting": "Mise en forme et lisibilité ATS",
  "career.ats.sections": "Sections complètes",
  "career.ats.actionImpact": "Verbes d'action et impact",
  "career.ats.lengthReadability": "Longueur et lisibilité",
  "career.ats.fallbackKeyword": "Relancez l'analyse pour comparer les mots-clés du CV à l'offre.",
  "career.ats.fallbackFormatting": "Relancez avec un CV textuel pour évaluer sa lisibilité ATS.",
  "career.ats.fallbackSections": "Relancez l'analyse pour vérifier les sections standards du CV.",
  "career.ats.fallbackActionImpact": "Relancez l'analyse pour évaluer les verbes d'action et les résultats mesurables.",
  "career.ats.fallbackLength": "Relancez l'analyse pour évaluer la longueur et la lisibilité du CV.",
  "career.ats.jobDescriptionTooShort": "Collez au moins 40 caractères de description de poste.",
  "career.ats.resumeTooShort": "Collez au moins 50 caractères de texte de CV.",
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
  "career.title": "Career Catalyst",
  "career.subtitle": "Sube tu CV, deja que la IA integre tus proyectos reales y haz seguimiento de candidaturas.",
  "career.resumes": "CVs",
  "career.targetCountry": "País objetivo (ej. España)",
  "career.remote": "Abierto al trabajo remoto",
  "career.uploadResume": "Subir CV",
  "career.uploadHint": "PDF, Word o archivo de texto",
  "career.uploadReadError": "No se pudo leer el texto del archivo. Los PDF escaneados o compuestos solo por imágenes requieren OCR; prueba con un PDF de texto, un archivo Word o pega el texto del CV.",
  "career.uploadTooLarge": "El archivo es demasiado grande para extraerlo de forma segura. Sube un documento más pequeño.",
  "career.uploadProcessError": "No se pudo subir o procesar el CV. Inténtalo de nuevo.",
  "career.skills": "Habilidades",
  "career.experience": "Experiencia",
  "career.jobApplications": "Solicitudes de empleo",
  "career.addApplication": "Añadir solicitud",
  "career.uploadToStart": "Sube o selecciona un CV arriba para empezar a rastrear solicitudes.",
  "career.newApplication": "Nueva solicitud de empleo",
  "career.company": "Empresa",
  "career.companyPlaceholder": "ej. Telefónica",
  "career.role": "Puesto",
  "career.rolePlaceholder": "ej. Ingeniero de software senior",
  "career.jobDesc": "Descripción del puesto (opcional — mejora la carta)",
  "career.jobDescPlaceholder": "Pega la descripción o los requisitos clave…",
  "career.generateCoverLetter": "Generar carta & añadir",
  "career.found": "Encontrada",
  "career.applying": "Solicitando",
  "career.submitted": "Enviada",
  "career.letter": "Carta",
  "career.remoteBadge": "Remoto",
  "career.ats.title": "Puntuación ATS",
  "career.ats.subtitle": "Compara tu CV con una oferta y recibe sugerencias concretas y específicas.",
  "career.ats.jobDescription": "Descripción del puesto",
  "career.ats.jobDescriptionPlaceholder": "Pega aquí la descripción completa del puesto…",
  "career.ats.resumeText": "Texto del CV",
  "career.ats.resumeTextPlaceholder": "Pega aquí tu CV o selecciona uno que hayas subido en el panel izquierdo.",
  "career.ats.resumeSourceHelp": "Si este campo está vacío, se usará el CV seleccionado a la izquierda.",
  "career.ats.run": "Analizar compatibilidad ATS",
  "career.ats.running": "Analizando el CV…",
  "career.ats.scoreLabel": "Compatibilidad ATS",
  "career.ats.scoreOutOf": "de 100",
  "career.ats.breakdown": "Desglose de puntuación",
  "career.ats.issues": "Hallazgos",
  "career.ats.topFixes": "Mejoras prioritarias",
  "career.ats.emptyTitle": "Listo cuando quieras",
  "career.ats.emptyDescription": "Añade una oferta y un CV para ver una puntuación ATS con recomendaciones específicas.",
  "career.ats.error": "No se pudo analizar este CV. Inténtalo de nuevo.",
  "career.ats.inputRequired": "Añade una oferta y pega un CV o selecciona uno que hayas subido.",
  "career.ats.fallbackNotice": "No se pudo validar la respuesta de IA. Este resultado seguro no es una puntuación fiable. Vuelve a intentarlo.",
  "career.ats.keywordMatch": "Coincidencia de palabras clave",
  "career.ats.formatting": "Formato y lectura ATS",
  "career.ats.sections": "Secciones completas",
  "career.ats.actionImpact": "Verbos de acción e impacto",
  "career.ats.lengthReadability": "Extensión y legibilidad",
  "career.ats.fallbackKeyword": "Vuelve a analizar para comparar las palabras clave del CV con la oferta.",
  "career.ats.fallbackFormatting": "Vuelve a intentarlo con un CV de texto para evaluar su lectura ATS.",
  "career.ats.fallbackSections": "Vuelve a analizar para comprobar las secciones estándar del CV.",
  "career.ats.fallbackActionImpact": "Vuelve a analizar para evaluar verbos de acción y resultados medibles.",
  "career.ats.fallbackLength": "Vuelve a analizar para evaluar la extensión y legibilidad del CV.",
  "career.ats.jobDescriptionTooShort": "Pega al menos 40 caracteres de la descripción del puesto.",
  "career.ats.resumeTooShort": "Pega al menos 50 caracteres del texto del CV.",
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
  "career.title": "Career Catalyst",
  "career.subtitle": "Lade deinen Lebenslauf hoch, lass die KI deine echten Projekte einbinden und verfolge Bewerbungen.",
  "career.resumes": "Lebensläufe",
  "career.targetCountry": "Zielland (z. B. Deutschland)",
  "career.remote": "Offen für Remote-Arbeit",
  "career.uploadResume": "Lebenslauf hochladen",
  "career.uploadHint": "PDF, Word oder Textdatei",
  "career.uploadReadError": "Der Text dieser Datei konnte nicht gelesen werden. Gescannte oder bildbasierte PDFs benötigen OCR; verwende ein textbasiertes PDF, eine Word-Datei oder füge den Lebenslauftext ein.",
  "career.uploadTooLarge": "Diese Datei ist zu groß für eine sichere Textextraktion. Lade ein kleineres Dokument hoch.",
  "career.uploadProcessError": "Der Lebenslauf konnte nicht hochgeladen oder verarbeitet werden. Bitte erneut versuchen.",
  "career.skills": "Fähigkeiten",
  "career.experience": "Erfahrung",
  "career.jobApplications": "Bewerbungen",
  "career.addApplication": "Bewerbung hinzufügen",
  "career.uploadToStart": "Lade einen Lebenslauf hoch oder wähle einen aus, um Bewerbungen zu verfolgen.",
  "career.newApplication": "Neue Bewerbung",
  "career.company": "Unternehmen",
  "career.companyPlaceholder": "z. B. SAP",
  "career.role": "Stelle",
  "career.rolePlaceholder": "z. B. Senior Software Engineer",
  "career.jobDesc": "Stellenbeschreibung (optional — verbessert das Anschreiben)",
  "career.jobDescPlaceholder": "Stellenbeschreibung oder Anforderungen einfügen…",
  "career.generateCoverLetter": "Anschreiben generieren & hinzufügen",
  "career.found": "Gefunden",
  "career.applying": "Beworben",
  "career.submitted": "Eingereicht",
  "career.letter": "Anschreiben",
  "career.remoteBadge": "Remote",
  "career.ats.title": "ATS-Bewertung",
  "career.ats.subtitle": "Vergleiche deinen Lebenslauf mit einer Stellenanzeige und erhalte konkrete, gezielte Hinweise.",
  "career.ats.jobDescription": "Stellenbeschreibung",
  "career.ats.jobDescriptionPlaceholder": "Füge hier die vollständige Stellenbeschreibung ein…",
  "career.ats.resumeText": "Lebenslauftext",
  "career.ats.resumeTextPlaceholder": "Füge deinen Lebenslauf hier ein oder wähle links einen hochgeladenen Lebenslauf aus.",
  "career.ats.resumeSourceHelp": "Wenn dieses Feld leer ist, wird der links ausgewählte Lebenslauf verwendet.",
  "career.ats.run": "ATS-Abgleich analysieren",
  "career.ats.running": "Lebenslauf wird analysiert…",
  "career.ats.scoreLabel": "ATS-Kompatibilität",
  "career.ats.scoreOutOf": "von 100",
  "career.ats.breakdown": "Bewertungsübersicht",
  "career.ats.issues": "Ergebnisse",
  "career.ats.topFixes": "Wichtigste Verbesserungen",
  "career.ats.emptyTitle": "Bereit, wenn du es bist",
  "career.ats.emptyDescription": "Füge eine Stellenanzeige und einen Lebenslauf hinzu, um eine ATS-Bewertung mit konkreten Empfehlungen zu erhalten.",
  "career.ats.error": "Der Lebenslauf konnte nicht analysiert werden. Bitte erneut versuchen.",
  "career.ats.inputRequired": "Füge eine Stellenanzeige hinzu und füge einen Lebenslauftext ein oder wähle einen hochgeladenen Lebenslauf.",
  "career.ats.fallbackNotice": "Die KI-Antwort konnte nicht validiert werden. Dieses sichere Ersatzresultat ist keine zuverlässige Bewertung. Bitte erneut versuchen.",
  "career.ats.keywordMatch": "Keyword-Übereinstimmung",
  "career.ats.formatting": "Formatierung und ATS-Lesbarkeit",
  "career.ats.sections": "Vollständigkeit der Abschnitte",
  "career.ats.actionImpact": "Aktionsverben und Wirkung",
  "career.ats.lengthReadability": "Länge und Lesbarkeit",
  "career.ats.fallbackKeyword": "Starte erneut, um Keywords im Lebenslauf mit der Stellenanzeige abzugleichen.",
  "career.ats.fallbackFormatting": "Starte mit einem Text-Lebenslauf erneut, um die ATS-Lesbarkeit zu prüfen.",
  "career.ats.fallbackSections": "Starte erneut, um die üblichen Lebenslaufabschnitte zu prüfen.",
  "career.ats.fallbackActionImpact": "Starte erneut, um Aktionsverben und messbare Ergebnisse zu bewerten.",
  "career.ats.fallbackLength": "Starte erneut, um Länge und Lesbarkeit des Lebenslaufs zu bewerten.",
  "career.ats.jobDescriptionTooShort": "Füge mindestens 40 Zeichen der Stellenbeschreibung ein.",
  "career.ats.resumeTooShort": "Füge mindestens 50 Zeichen des Lebenslaufs ein.",
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
