export const supportedLanguages = ["en", "ru", "es", "pt", "tr", "uk", "ar"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageOptions: Array<{ code: SupportedLanguage; label: string }> = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "ar", label: "العربية" }
];

const englishMessages = {
  app: {
    eyebrow: "femi foundation",
    heroTitle: "Simple cycle tracking, built for calm daily use.",
    heroCopy:
      "Milestone 0 ships the Mini App shell, authentication path, navigation, settings baseline, and backend connectivity.",
    tabs: {
      today: "Today",
      calendar: "Calendar",
      history: "History",
      settings: "Settings"
    }
  },
  today: {
    title: "Today",
    description: "The first screen is reserved for the shortest daily flow.",
    currentGoalLabel: "Current goal",
    currentGoalValue: "Fast check-ins under 10 seconds",
    apiStatusLabel: "API status",
    apiUnavailable: "unavailable",
    lastHeartbeatLabel: "Last heartbeat",
    lastHeartbeatFallback: "not connected yet",
    quickInputsTitle: "Planned quick inputs",
    quickInputsDescription:
      "These are placeholders for Milestone 1, kept visible so the shell matches the roadmap.",
    quickInputs: ["Mood", "Energy", "Pain", "Discharge", "Sleep", "Symptoms"]
  },
  calendar: {
    title: "Calendar",
    description: "Milestone 1 will turn this into the main cycle calendar and period logging view.",
    body: "Calendar UI will live here.",
    muted: "Foundation phase keeps routing and layout in place."
  },
  history: {
    title: "History",
    description: "History becomes useful after cycle logs and check-ins exist.",
    body: "No entries yet.",
    muted: "This screen is ready for daily check-ins and symptom logs."
  },
  settings: {
    title: "Settings",
    description: "This page anchors the non-medical and privacy posture from the start.",
    productType: "Product type",
    productTypeValue: "Personal tracking app, not a medical application.",
    coreModel: "Core model",
    coreModelValue: "Ad-free and no subscription gate for baseline functionality.",
    dataPosture: "Data posture",
    dataPostureValue: "No ads, no sale of personal data, no unrelated third-party sharing.",
    languageTitle: "Language",
    languageDescription:
      "The app detects Telegram or browser language automatically, but the user can override it here.",
    importantNoticeTitle: "Important notice",
    importantNoticeDescription:
      "This copy matches the project disclaimer and should remain visible in the product.",
    importantNotice:
      "femi is not a medical app and does not provide medical advice, diagnosis, or treatment recommendations."
  }
};

export type Messages = typeof englishMessages;

export const translations: Record<SupportedLanguage, Messages> = {
  en: englishMessages,
  ru: {
    app: {
      eyebrow: "femi foundation",
      heroTitle: "Простой трекинг цикла для спокойного ежедневного использования.",
      heroCopy:
        "Milestone 0 включает оболочку Mini App, путь аутентификации, навигацию, базовые настройки и подключение к backend.",
      tabs: {
        today: "Сегодня",
        calendar: "Календарь",
        history: "История",
        settings: "Настройки"
      }
    },
    today: {
      title: "Сегодня",
      description: "Первый экран оставлен под самый короткий ежедневный сценарий.",
      currentGoalLabel: "Текущая цель",
      currentGoalValue: "Быстрые отметки меньше чем за 10 секунд",
      apiStatusLabel: "Статус API",
      apiUnavailable: "недоступно",
      lastHeartbeatLabel: "Последний отклик",
      lastHeartbeatFallback: "пока нет соединения",
      quickInputsTitle: "Планируемые быстрые поля",
      quickInputsDescription:
        "Это плейсхолдеры для Milestone 1, чтобы оболочка уже соответствовала roadmap.",
      quickInputs: ["Настроение", "Энергия", "Боль", "Выделения", "Сон", "Симптомы"]
    },
    calendar: {
      title: "Календарь",
      description:
        "В Milestone 1 этот экран станет основным видом цикла и логирования менструации.",
      body: "Здесь появится интерфейс календаря.",
      muted: "На этапе foundation мы фиксируем маршруты и каркас интерфейса."
    },
    history: {
      title: "История",
      description: "История станет полезной после появления логов цикла и ежедневных отметок.",
      body: "Записей пока нет.",
      muted: "Этот экран подготовлен для чек-инов и логов симптомов."
    },
    settings: {
      title: "Настройки",
      description:
        "Эта страница с самого начала фиксирует немедицинский и приватный характер продукта.",
      productType: "Тип продукта",
      productTypeValue: "Приложение для личного трекинга, а не медицинское приложение.",
      coreModel: "Базовая модель",
      coreModelValue: "Без рекламы и без подписки, блокирующей базовый функционал.",
      dataPosture: "Подход к данным",
      dataPostureValue:
        "Без рекламы, без продажи персональных данных и без передачи не связанным третьим сторонам.",
      languageTitle: "Язык",
      languageDescription:
        "Приложение автоматически определяет язык Telegram или браузера, но пользователь может переопределить его здесь.",
      importantNoticeTitle: "Важное уведомление",
      importantNoticeDescription:
        "Этот текст повторяет project disclaimer и должен оставаться видимым в продукте.",
      importantNotice:
        "femi не является медицинским приложением и не дает медицинских рекомендаций, диагнозов или назначений лечения."
    }
  },
  es: {
    app: {
      eyebrow: "base de femi",
      heroTitle: "Seguimiento del ciclo simple, pensado para un uso diario tranquilo.",
      heroCopy:
        "El Milestone 0 entrega la base de la Mini App, la ruta de autenticación, la navegación, los ajustes iniciales y la conexión con el backend.",
      tabs: {
        today: "Hoy",
        calendar: "Calendario",
        history: "Historial",
        settings: "Ajustes"
      }
    },
    today: {
      title: "Hoy",
      description: "La primera pantalla está reservada para el flujo diario más corto.",
      currentGoalLabel: "Objetivo actual",
      currentGoalValue: "Registros rápidos en menos de 10 segundos",
      apiStatusLabel: "Estado del API",
      apiUnavailable: "no disponible",
      lastHeartbeatLabel: "Último latido",
      lastHeartbeatFallback: "sin conexión todavía",
      quickInputsTitle: "Entradas rápidas planificadas",
      quickInputsDescription:
        "Estos son placeholders para el Milestone 1, visibles para que la shell ya refleje la hoja de ruta.",
      quickInputs: ["Ánimo", "Energía", "Dolor", "Flujo", "Sueño", "Síntomas"]
    },
    calendar: {
      title: "Calendario",
      description:
        "El Milestone 1 convertirá esta vista en el calendario principal del ciclo y del registro del período.",
      body: "Aquí irá la interfaz del calendario.",
      muted: "La fase foundation deja preparados el enrutado y la estructura."
    },
    history: {
      title: "Historial",
      description: "El historial será útil cuando existan registros del ciclo y check-ins.",
      body: "Aún no hay entradas.",
      muted: "Esta pantalla está lista para check-ins diarios y síntomas."
    },
    settings: {
      title: "Ajustes",
      description:
        "Esta página fija desde el inicio la postura no médica y de privacidad del producto.",
      productType: "Tipo de producto",
      productTypeValue: "Aplicación de seguimiento personal, no una aplicación médica.",
      coreModel: "Modelo base",
      coreModelValue: "Sin anuncios y sin suscripción para el funcionamiento básico.",
      dataPosture: "Tratamiento de datos",
      dataPostureValue:
        "Sin anuncios, sin venta de datos personales y sin compartir con terceros no relacionados.",
      languageTitle: "Idioma",
      languageDescription:
        "La app detecta automáticamente el idioma de Telegram o del navegador, pero la usuaria puede cambiarlo aquí.",
      importantNoticeTitle: "Aviso importante",
      importantNoticeDescription:
        "Este texto coincide con el disclaimer del proyecto y debe permanecer visible en el producto.",
      importantNotice:
        "femi no es una aplicación médica y no ofrece recomendaciones médicas, diagnóstico ni tratamiento."
    }
  },
  pt: {
    app: {
      eyebrow: "base do femi",
      heroTitle: "Rastreamento de ciclo simples para um uso diário calmo.",
      heroCopy:
        "O Milestone 0 entrega a shell da Mini App, o fluxo de autenticação, a navegação, a base de configurações e a conectividade com o backend.",
      tabs: {
        today: "Hoje",
        calendar: "Calendário",
        history: "Histórico",
        settings: "Configurações"
      }
    },
    today: {
      title: "Hoje",
      description: "A primeira tela fica reservada para o fluxo diário mais curto.",
      currentGoalLabel: "Objetivo atual",
      currentGoalValue: "Check-ins rápidos em menos de 10 segundos",
      apiStatusLabel: "Status da API",
      apiUnavailable: "indisponível",
      lastHeartbeatLabel: "Último heartbeat",
      lastHeartbeatFallback: "ainda sem conexão",
      quickInputsTitle: "Entradas rápidas planejadas",
      quickInputsDescription:
        "Esses são placeholders do Milestone 1, mantidos visíveis para que a shell reflita o roadmap.",
      quickInputs: ["Humor", "Energia", "Dor", "Fluxo", "Sono", "Sintomas"]
    },
    calendar: {
      title: "Calendário",
      description:
        "No Milestone 1 esta tela se tornará a principal visão do ciclo e do registro menstrual.",
      body: "A interface do calendário ficará aqui.",
      muted: "A fase foundation mantém o roteamento e o layout no lugar."
    },
    history: {
      title: "Histórico",
      description: "O histórico passa a ser útil quando existirem registros do ciclo e check-ins.",
      body: "Ainda não há registros.",
      muted: "Esta tela está pronta para check-ins diários e sintomas."
    },
    settings: {
      title: "Configurações",
      description:
        "Esta página consolida desde o início a postura não médica e de privacidade do produto.",
      productType: "Tipo de produto",
      productTypeValue: "Aplicativo de rastreamento pessoal, não um aplicativo médico.",
      coreModel: "Modelo principal",
      coreModelValue: "Sem anúncios e sem paywall por assinatura no básico.",
      dataPosture: "Postura de dados",
      dataPostureValue:
        "Sem anúncios, sem venda de dados pessoais e sem compartilhamento com terceiros não relacionados.",
      languageTitle: "Idioma",
      languageDescription:
        "O app detecta automaticamente o idioma do Telegram ou do navegador, mas a usuária pode alterar aqui.",
      importantNoticeTitle: "Aviso importante",
      importantNoticeDescription:
        "Este texto espelha o disclaimer do projeto e deve permanecer visível no produto.",
      importantNotice:
        "femi não é um aplicativo médico e não fornece aconselhamento médico, diagnóstico ou recomendações de tratamento."
    }
  },
  tr: {
    app: {
      eyebrow: "femi temel katmanı",
      heroTitle: "Sakin günlük kullanım için tasarlanmış basit döngü takibi.",
      heroCopy:
        "Milestone 0, Mini App kabuğunu, kimlik doğrulama yolunu, gezinmeyi, ayar temelini ve backend bağlantısını sunar.",
      tabs: {
        today: "Bugün",
        calendar: "Takvim",
        history: "Geçmiş",
        settings: "Ayarlar"
      }
    },
    today: {
      title: "Bugün",
      description: "İlk ekran en kısa günlük akış için ayrıldı.",
      currentGoalLabel: "Güncel hedef",
      currentGoalValue: "10 saniyenin altında hızlı girişler",
      apiStatusLabel: "API durumu",
      apiUnavailable: "ulaşılamıyor",
      lastHeartbeatLabel: "Son yanıt",
      lastHeartbeatFallback: "henüz bağlantı yok",
      quickInputsTitle: "Planlanan hızlı girişler",
      quickInputsDescription:
        "Bunlar Milestone 1 için yer tutuculardır; kabuğun yol haritasına uyması için görünür tutulur.",
      quickInputs: ["Ruh hali", "Enerji", "Ağrı", "Akıntı", "Uyku", "Belirtiler"]
    },
    calendar: {
      title: "Takvim",
      description: "Milestone 1 bu ekranı ana döngü takvimi ve adet kaydı görünümüne dönüştürecek.",
      body: "Takvim arayüzü burada yer alacak.",
      muted: "Foundation aşaması yönlendirme ve yerleşimi hazır tutar."
    },
    history: {
      title: "Geçmiş",
      description: "Geçmiş, döngü kayıtları ve günlük girişler oluştuğunda anlam kazanır.",
      body: "Henüz kayıt yok.",
      muted: "Bu ekran günlük girişler ve semptom kayıtları için hazır."
    },
    settings: {
      title: "Ayarlar",
      description: "Bu sayfa ürünün tıbbi olmayan ve gizlilik duruşunu en baştan sabitler.",
      productType: "Ürün türü",
      productTypeValue: "Kişisel takip uygulaması, tıbbi uygulama değil.",
      coreModel: "Temel model",
      coreModelValue: "Reklamsız ve temel işlevler için abonelik engeli yok.",
      dataPosture: "Veri yaklaşımı",
      dataPostureValue: "Reklam yok, kişisel veri satışı yok, alakasız üçüncü taraf paylaşımı yok.",
      languageTitle: "Dil",
      languageDescription:
        "Uygulama Telegram veya tarayıcı dilini otomatik algılar, ancak kullanıcı burada değiştirebilir.",
      importantNoticeTitle: "Önemli uyarı",
      importantNoticeDescription:
        "Bu metin proje disclaimer'ı ile uyumludur ve üründe görünür kalmalıdır.",
      importantNotice:
        "femi tıbbi bir uygulama değildir ve tıbbi tavsiye, teşhis veya tedavi önerisi sunmaz."
    }
  },
  uk: {
    app: {
      eyebrow: "база femi",
      heroTitle: "Простий трекінг циклу для спокійного щоденного використання.",
      heroCopy:
        "Milestone 0 включає оболонку Mini App, шлях автентифікації, навігацію, базові налаштування та підключення до backend.",
      tabs: {
        today: "Сьогодні",
        calendar: "Календар",
        history: "Історія",
        settings: "Налаштування"
      }
    },
    today: {
      title: "Сьогодні",
      description: "Перший екран відведено під найкоротший щоденний сценарій.",
      currentGoalLabel: "Поточна ціль",
      currentGoalValue: "Швидкі відмітки менш ніж за 10 секунд",
      apiStatusLabel: "Статус API",
      apiUnavailable: "недоступно",
      lastHeartbeatLabel: "Останній відгук",
      lastHeartbeatFallback: "ще немає з'єднання",
      quickInputsTitle: "Заплановані швидкі поля",
      quickInputsDescription:
        "Це плейсхолдери для Milestone 1, залишені видимими, щоб оболонка вже відповідала roadmap.",
      quickInputs: ["Настрій", "Енергія", "Біль", "Виділення", "Сон", "Симптоми"]
    },
    calendar: {
      title: "Календар",
      description: "У Milestone 1 цей екран стане основним видом циклу та логування менструації.",
      body: "Тут буде інтерфейс календаря.",
      muted: "На фазі foundation ми фіксуємо маршрутизацію та каркас інтерфейсу."
    },
    history: {
      title: "Історія",
      description: "Історія стане корисною після появи логів циклу та щоденних відміток.",
      body: "Записів поки немає.",
      muted: "Цей екран готовий для щоденних чек-інів і логів симптомів."
    },
    settings: {
      title: "Налаштування",
      description:
        "Ця сторінка з самого початку закріплює немедичний і приватний характер продукту.",
      productType: "Тип продукту",
      productTypeValue: "Застосунок для особистого трекінгу, а не медичний застосунок.",
      coreModel: "Базова модель",
      coreModelValue: "Без реклами та без підписки, що блокує базовий функціонал.",
      dataPosture: "Підхід до даних",
      dataPostureValue:
        "Без реклами, без продажу персональних даних і без передачі не пов'язаним третім сторонам.",
      languageTitle: "Мова",
      languageDescription:
        "Застосунок автоматично визначає мову Telegram або браузера, але користувачка може змінити її тут.",
      importantNoticeTitle: "Важливе повідомлення",
      importantNoticeDescription:
        "Цей текст повторює project disclaimer і має залишатися видимим у продукті.",
      importantNotice:
        "femi не є медичним застосунком і не надає медичних рекомендацій, діагнозів або призначень лікування."
    }
  },
  ar: {
    app: {
      eyebrow: "أساس femi",
      heroTitle: "تتبع بسيط للدورة مصمم للاستخدام اليومي الهادئ.",
      heroCopy:
        "يوفر Milestone 0 هيكل Mini App ومسار المصادقة والتنقل وإعدادات الأساس والاتصال مع الخلفية.",
      tabs: {
        today: "اليوم",
        calendar: "التقويم",
        history: "السجل",
        settings: "الإعدادات"
      }
    },
    today: {
      title: "اليوم",
      description: "تم تخصيص الشاشة الأولى لأقصر تدفق يومي ممكن.",
      currentGoalLabel: "الهدف الحالي",
      currentGoalValue: "تسجيلات سريعة خلال أقل من 10 ثوان",
      apiStatusLabel: "حالة API",
      apiUnavailable: "غير متاح",
      lastHeartbeatLabel: "آخر نبضة",
      lastHeartbeatFallback: "لا يوجد اتصال بعد",
      quickInputsTitle: "مدخلات سريعة مخططة",
      quickInputsDescription:
        "هذه عناصر نائبة لـ Milestone 1 وتم إبقاؤها مرئية حتى تتماشى الواجهة مع خارطة الطريق.",
      quickInputs: ["المزاج", "الطاقة", "الألم", "الإفرازات", "النوم", "الأعراض"]
    },
    calendar: {
      title: "التقويم",
      description: "في Milestone 1 ستصبح هذه الشاشة العرض الرئيسي للدورة وتسجيل الدورة الشهرية.",
      body: "ستظهر واجهة التقويم هنا.",
      muted: "تحافظ مرحلة foundation على التوجيه والهيكل في مكانهما."
    },
    history: {
      title: "السجل",
      description: "يصبح السجل مفيدًا بعد توفر سجلات الدورة والمتابعات اليومية.",
      body: "لا توجد إدخالات بعد.",
      muted: "هذه الشاشة جاهزة للمتابعات اليومية وسجلات الأعراض."
    },
    settings: {
      title: "الإعدادات",
      description: "تثبت هذه الصفحة منذ البداية موقف المنتج غير الطبي ونهجه في الخصوصية.",
      productType: "نوع المنتج",
      productTypeValue: "تطبيق تتبع شخصي وليس تطبيقًا طبيًا.",
      coreModel: "النموذج الأساسي",
      coreModelValue: "من دون إعلانات ومن دون حجب الوظائف الأساسية خلف اشتراك.",
      dataPosture: "نهج البيانات",
      dataPostureValue:
        "لا إعلانات، لا بيع للبيانات الشخصية، ولا مشاركة مع أطراف ثالثة غير مرتبطة.",
      languageTitle: "اللغة",
      languageDescription:
        "يكتشف التطبيق لغة Telegram أو المتصفح تلقائيًا، لكن يمكن للمستخدمة تغييرها هنا.",
      importantNoticeTitle: "تنبيه مهم",
      importantNoticeDescription:
        "يتطابق هذا النص مع disclaimer الخاص بالمشروع ويجب أن يبقى ظاهرًا داخل المنتج.",
      importantNotice: "femi ليس تطبيقًا طبيًا ولا يقدم نصائح طبية أو تشخيصًا أو توصيات علاجية."
    }
  }
};
