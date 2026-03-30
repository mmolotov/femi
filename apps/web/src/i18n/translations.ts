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

export const baseMessages = {
  app: {
    eyebrow: "femi mvp",
    heroTitle: "Simple cycle tracking, built for calm daily use.",
    heroCopy:
      "Milestone 1 adds onboarding, period logging, daily check-ins, history, and a usable cycle calendar without feature bloat.",
    loading: "Syncing your cycle data…",
    previewTitle: "Browser preview mode",
    previewBody:
      "Open the app inside Telegram to run real authentication and save cycle data. Browser preview stays useful for layout and copy checks.",
    syncErrorTitle: "We could not load your data",
    syncErrorBody:
      "Telegram auth completed, but the app could not load profile or cycle data from the backend.",
    telegramAuthFailed: "Telegram authentication failed.",
    telegramAuthInvalidResponse: "Telegram authentication returned an invalid response.",
    dataLoadError: "Failed to load application data.",
    primaryNavLabel: "Primary navigation",
    tabs: {
      today: "Today",
      calendar: "Calendar",
      history: "History",
      settings: "Settings"
    }
  },
  onboarding: {
    title: "A short setup before the first entry",
    description:
      "Set your usual cycle and period length once. You can change both later in settings.",
    cycleLengthLabel: "Usual cycle length",
    periodLengthLabel: "Usual period length",
    cycleLengthHint: "Common range: 20 to 45 days",
    periodLengthHint: "Common range: 2 to 10 days",
    submitIdle: "Save setup",
    submitPending: "Saving…",
    saveError: "Setup could not be saved."
  },
  today: {
    title: "Today",
    description: "The first screen is reserved for the shortest daily flow.",
    cycleDayLabel: "Current cycle day",
    cycleDayFallback: "not enough data yet",
    nextPeriodLabel: "Predicted next period",
    nextPeriodFallback: "prediction starts after the first period log",
    activePeriodLabel: "Current state",
    activePeriodYes: "period in progress",
    activePeriodNo: "not in period days",
    periodActionsTitle: "Period actions",
    periodActionsDescription: "Use the shortest possible actions for today's period state.",
    startPeriod: "Log period start",
    endPeriod: "Log period end",
    startPeriodError: "Could not log period start.",
    endPeriodError: "Could not log period end.",
    saveStateIdle: "Save today's check-in",
    saveStatePending: "Saving check-in…",
    saveSuccess: "Today's entry was saved.",
    saveError: "Check-in could not be saved.",
    checkinTitle: "Quick daily check-in",
    checkinDescription: "A compact entry for the day. Leave any field empty if it does not matter.",
    mood: "Mood",
    energy: "Energy",
    pain: "Pain",
    discharge: "Discharge",
    sleep: "Sleep quality",
    note: "Optional note",
    notePlaceholder: "Anything you want to remember for this day.",
    symptomsTitle: "Symptoms",
    symptomsDescription: "Tap to add the symptoms that matter today.",
    symptomNone: "No symptoms selected",
    statusLoaded: "connected",
    scorePlaceholder: "Not set",
    dischargePlaceholder: "Not set",
    dischargeOptions: {
      none: "None",
      dry: "Dry",
      sticky: "Sticky",
      creamy: "Creamy",
      watery: "Watery"
    }
  },
  calendar: {
    title: "Calendar",
    description: "Month view of logged period days and the next predicted period.",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    legendLogged: "Logged period day",
    legendPredicted: "Predicted period day",
    legendToday: "Today",
    empty: "No cycle markers for this month yet.",
    loadError: "Calendar data could not be loaded.",
    selectedDateLabel: "Selected date",
    selectedDateFallback: "No date selected",
    flowIntensityLabel: "Flow intensity",
    flowIntensityPlaceholder: "Not set",
    startPeriod: "Start period here",
    endPeriod: "End period here",
    savePeriodDay: "Save period day",
    savePending: "Saving period log…",
    saveSuccess: "Period day saved.",
    saveError: "Period log could not be saved.",
    startSuccess: "Period start saved.",
    endSuccess: "Period end saved.",
    tagsSuffix: "tags"
  },
  history: {
    title: "History",
    description: "Recent check-ins, period logs, and symptom tags.",
    empty: "No entries yet.",
    loadError: "History could not be loaded.",
    checkinLabel: "Check-in",
    periodLabel: "Period",
    symptomsLabel: "Symptoms",
    periodStarted: "start",
    periodEnded: "end",
    scoreMood: "mood",
    scoreEnergy: "energy",
    scorePain: "pain"
  },
  labels: {
    flowIntensity: {
      spotting: "Spotting",
      light: "Light",
      medium: "Medium",
      heavy: "Heavy"
    },
    symptoms: {
      cramps: "Cramps",
      headache: "Headache",
      nausea: "Nausea",
      acne: "Acne",
      bloating: "Bloating",
      breast_tenderness: "Breast tenderness",
      fatigue: "Fatigue",
      pms: "PMS"
    }
  },
  settings: {
    title: "Settings",
    description: "This page anchors the non-medical and privacy posture from the start.",
    preferencesTitle: "Tracking preferences",
    preferencesDescription:
      "These values drive the first prediction model and the onboarding baseline for cycle tracking.",
    cycleLengthLabel: "Cycle length (days)",
    periodLengthLabel: "Period length (days)",
    timezoneLabel: "Timezone",
    remindersEnabledLabel: "Reminders enabled",
    saveIdle: "Save settings",
    savePending: "Saving settings…",
    saveSuccess: "Settings saved.",
    saveError: "Settings could not be saved.",
    productType: "Product type",
    productTypeValue: "Personal tracking app, not a medical application.",
    coreModel: "Core model",
    coreModelValue: "Ad-free and no subscription gate for baseline functionality.",
    dataPosture: "Data posture",
    dataPostureValue: "No ads, no sale of personal data, no unrelated third-party sharing.",
    integrationTitle: "Telegram integration",
    integrationDescription:
      "This block shows whether the app is running inside Telegram and whether the initial Telegram auth path succeeded.",
    environment: "Runtime environment",
    environmentTelegram: "Telegram Mini App",
    environmentBrowser: "Browser preview",
    sessionStatus: "Session status",
    sessionAuthenticating: "authorizing with Telegram",
    sessionAuthenticated: "authenticated",
    sessionPreview: "preview mode, no Telegram init data",
    sessionError: "Telegram auth failed",
    telegramAccount: "Telegram account",
    telegramAccountFallback: "account not available yet",
    telegramLanguage: "Telegram language",
    telegramLanguageFallback: "not provided",
    authErrorLabel: "Auth error",
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

export type Messages = typeof baseMessages;

export const translations: Record<SupportedLanguage, Record<string, unknown>> = {
  en: baseMessages,
  ru: {
    app: {
      eyebrow: "femi mvp",
      heroTitle: "Простой трекинг цикла для спокойного ежедневного использования.",
      heroCopy:
        "Milestone 1 добавляет онбординг, логирование менструации, ежедневные чек-ины, историю и рабочий календарь цикла без перегруженного функционала.",
      loading: "Синхронизируем данные цикла…",
      previewTitle: "Режим превью в браузере",
      previewBody:
        "Откройте приложение внутри Telegram, чтобы пройти настоящую аутентификацию и сохранять данные цикла. Превью в браузере полезно для проверки интерфейса и текста.",
      syncErrorTitle: "Не удалось загрузить данные",
      syncErrorBody:
        "Аутентификация через Telegram прошла, но приложение не смогло загрузить профиль или данные цикла с backend.",
      telegramAuthFailed: "Не удалось пройти аутентификацию через Telegram.",
      telegramAuthInvalidResponse: "Telegram вернул некорректный ответ аутентификации.",
      dataLoadError: "Не удалось загрузить данные приложения.",
      primaryNavLabel: "Основная навигация",
      tabs: {
        today: "Сегодня",
        calendar: "Календарь",
        history: "История",
        settings: "Настройки"
      }
    },
    onboarding: {
      title: "Короткая настройка перед первой записью",
      description:
        "Один раз укажите обычную длину цикла и менструации. Позже это можно изменить в настройках.",
      cycleLengthLabel: "Обычная длина цикла",
      periodLengthLabel: "Обычная длина менструации",
      cycleLengthHint: "Обычный диапазон: от 20 до 45 дней",
      periodLengthHint: "Обычный диапазон: от 2 до 10 дней",
      submitIdle: "Сохранить настройку",
      submitPending: "Сохраняем…",
      saveError: "Не удалось сохранить начальную настройку."
    },
    today: {
      title: "Сегодня",
      description: "Первый экран оставлен под самый короткий ежедневный сценарий.",
      cycleDayLabel: "Текущий день цикла",
      cycleDayFallback: "пока недостаточно данных",
      nextPeriodLabel: "Прогноз следующей менструации",
      nextPeriodFallback: "прогноз появится после первой записи о менструации",
      activePeriodLabel: "Текущее состояние",
      activePeriodYes: "идут дни менструации",
      activePeriodNo: "сейчас не дни менструации",
      periodActionsTitle: "Действия по менструации",
      periodActionsDescription:
        "Используйте самые короткие действия, чтобы зафиксировать текущее состояние.",
      startPeriod: "Отметить начало менструации",
      endPeriod: "Отметить конец менструации",
      startPeriodError: "Не удалось отметить начало менструации.",
      endPeriodError: "Не удалось отметить конец менструации.",
      saveStateIdle: "Сохранить запись за сегодня",
      saveStatePending: "Сохраняем чек-ин…",
      saveSuccess: "Запись за сегодня сохранена.",
      saveError: "Не удалось сохранить чек-ин.",
      checkinTitle: "Быстрый ежедневный чек-ин",
      checkinDescription:
        "Компактная запись на день. Оставьте поле пустым, если оно сейчас не важно.",
      mood: "Настроение",
      energy: "Энергия",
      pain: "Боль",
      discharge: "Выделения",
      sleep: "Качество сна",
      note: "Необязательная заметка",
      notePlaceholder: "Все, что вы хотите запомнить за этот день.",
      symptomsTitle: "Симптомы",
      symptomsDescription: "Нажмите, чтобы отметить симптомы, которые важны сегодня.",
      symptomNone: "Симптомы не выбраны",
      scorePlaceholder: "Не указано",
      dischargePlaceholder: "Не указано",
      dischargeOptions: {
        none: "Нет",
        dry: "Сухо",
        sticky: "Липкие",
        creamy: "Кремовые",
        watery: "Водянистые"
      }
    },
    calendar: {
      title: "Календарь",
      description: "Вид месяца с отмеченными днями менструации и прогнозом следующего цикла.",
      previousMonth: "Предыдущий месяц",
      nextMonth: "Следующий месяц",
      legendLogged: "Записанный день менструации",
      legendPredicted: "Прогнозируемый день менструации",
      legendToday: "Сегодня",
      empty: "Для этого месяца пока нет отметок цикла.",
      loadError: "Не удалось загрузить календарь.",
      selectedDateLabel: "Выбранная дата",
      selectedDateFallback: "Дата не выбрана",
      flowIntensityLabel: "Интенсивность",
      flowIntensityPlaceholder: "Не указано",
      startPeriod: "Начать здесь",
      endPeriod: "Закончить здесь",
      savePeriodDay: "Сохранить день менструации",
      savePending: "Сохраняем запись о дне…",
      saveSuccess: "День менструации сохранен.",
      saveError: "Не удалось сохранить день менструации.",
      startSuccess: "Начало менструации сохранено.",
      endSuccess: "Конец менструации сохранен.",
      tagsSuffix: "тега"
    },
    history: {
      title: "История",
      description: "Недавние чек-ины, записи по менструации и теги симптомов.",
      empty: "Записей пока нет.",
      loadError: "Не удалось загрузить историю.",
      checkinLabel: "Чек-ин",
      periodLabel: "Менструация",
      symptomsLabel: "Симптомы",
      periodStarted: "начало",
      periodEnded: "конец",
      scoreMood: "настроение",
      scoreEnergy: "энергия",
      scorePain: "боль"
    },
    labels: {
      flowIntensity: {
        spotting: "мажущие",
        light: "слабая",
        medium: "средняя",
        heavy: "обильная"
      },
      symptoms: {
        cramps: "спазмы",
        headache: "головная боль",
        nausea: "тошнота",
        acne: "акне",
        bloating: "вздутие",
        breast_tenderness: "чувствительность груди",
        fatigue: "усталость",
        pms: "ПМС"
      }
    },
    settings: {
      title: "Настройки",
      description:
        "Эта страница с самого начала фиксирует немедицинский и приватный характер продукта.",
      preferencesTitle: "Параметры трекинга",
      preferencesDescription:
        "Эти значения используются для первого прогноза и базовой настройки трекинга цикла.",
      cycleLengthLabel: "Длина цикла (дни)",
      periodLengthLabel: "Длина менструации (дни)",
      timezoneLabel: "Часовой пояс",
      remindersEnabledLabel: "Напоминания включены",
      saveIdle: "Сохранить настройки",
      savePending: "Сохраняем настройки…",
      saveSuccess: "Настройки сохранены.",
      saveError: "Не удалось сохранить настройки.",
      productType: "Тип продукта",
      productTypeValue: "Приложение для личного трекинга, а не медицинское приложение.",
      coreModel: "Базовая модель",
      coreModelValue: "Без рекламы и без подписки, блокирующей базовый функционал.",
      dataPosture: "Подход к данным",
      dataPostureValue:
        "Без рекламы, без продажи персональных данных и без передачи не связанным третьим сторонам.",
      integrationTitle: "Интеграция с Telegram",
      integrationDescription:
        "Этот блок показывает, запущено ли приложение внутри Telegram и прошел ли начальный путь аутентификации.",
      environment: "Среда запуска",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "Превью в браузере",
      sessionStatus: "Статус сессии",
      sessionAuthenticating: "авторизация через Telegram",
      sessionAuthenticated: "аутентификация выполнена",
      sessionPreview: "режим превью, без Telegram init data",
      sessionError: "ошибка Telegram auth",
      telegramAccount: "Аккаунт Telegram",
      telegramAccountFallback: "аккаунт пока недоступен",
      telegramLanguage: "Язык Telegram",
      telegramLanguageFallback: "не передан",
      authErrorLabel: "Ошибка auth",
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
      eyebrow: "femi mvp",
      heroTitle: "Seguimiento del ciclo simple, pensado para un uso diario tranquilo.",
      heroCopy:
        "El Milestone 1 añade onboarding, registro del período, check-ins diarios, historial y un calendario de ciclo útil sin funciones de relleno.",
      loading: "Sincronizando los datos del ciclo…",
      previewTitle: "Modo de vista previa en navegador",
      previewBody:
        "Abre la app dentro de Telegram para realizar la autenticación real y guardar datos del ciclo. La vista previa en navegador sigue siendo útil para revisar diseño y textos.",
      syncErrorTitle: "No pudimos cargar tus datos",
      syncErrorBody:
        "La autenticación de Telegram se completó, pero la app no pudo cargar el perfil o los datos del ciclo desde el backend.",
      telegramAuthFailed: "La autenticación de Telegram falló.",
      telegramAuthInvalidResponse: "Telegram devolvió una respuesta de autenticación no válida.",
      dataLoadError: "No se pudieron cargar los datos de la aplicación.",
      primaryNavLabel: "Navegación principal",
      tabs: {
        today: "Hoy",
        calendar: "Calendario",
        history: "Historial",
        settings: "Ajustes"
      }
    },
    onboarding: {
      title: "Una configuración breve antes del primer registro",
      description:
        "Define una vez tu duración habitual del ciclo y del período. Luego podrás cambiar ambas en ajustes.",
      cycleLengthLabel: "Duración habitual del ciclo",
      periodLengthLabel: "Duración habitual del período",
      cycleLengthHint: "Rango común: de 20 a 45 días",
      periodLengthHint: "Rango común: de 2 a 10 días",
      submitIdle: "Guardar configuración",
      submitPending: "Guardando…",
      saveError: "No se pudo guardar la configuración inicial."
    },
    today: {
      title: "Hoy",
      description: "La primera pantalla está reservada para el flujo diario más corto.",
      cycleDayLabel: "Día actual del ciclo",
      cycleDayFallback: "todavía no hay suficientes datos",
      nextPeriodLabel: "Próximo período previsto",
      nextPeriodFallback: "la predicción comienza tras el primer registro del período",
      activePeriodLabel: "Estado actual",
      activePeriodYes: "período en curso",
      activePeriodNo: "fuera de los días del período",
      periodActionsTitle: "Acciones del período",
      periodActionsDescription:
        "Usa las acciones más cortas posibles para registrar el estado del período de hoy.",
      startPeriod: "Registrar inicio del período",
      endPeriod: "Registrar fin del período",
      startPeriodError: "No se pudo registrar el inicio del período.",
      endPeriodError: "No se pudo registrar el fin del período.",
      saveStateIdle: "Guardar check-in de hoy",
      saveStatePending: "Guardando check-in…",
      saveSuccess: "La entrada de hoy se guardó.",
      saveError: "No se pudo guardar el check-in.",
      checkinTitle: "Check-in diario rápido",
      checkinDescription:
        "Una entrada compacta para el día. Deja cualquier campo vacío si no importa hoy.",
      mood: "Ánimo",
      energy: "Energía",
      pain: "Dolor",
      discharge: "Flujo",
      sleep: "Calidad del sueño",
      note: "Nota opcional",
      notePlaceholder: "Lo que quieras recordar de este día.",
      symptomsTitle: "Síntomas",
      symptomsDescription: "Toca para añadir los síntomas que importan hoy.",
      symptomNone: "No hay síntomas seleccionados",
      scorePlaceholder: "Sin indicar",
      dischargePlaceholder: "Sin indicar",
      dischargeOptions: {
        none: "Ninguno",
        dry: "Seco",
        sticky: "Pegajoso",
        creamy: "Cremoso",
        watery: "Acuoso"
      }
    },
    calendar: {
      title: "Calendario",
      description:
        "Vista mensual con días de período registrados y la siguiente predicción del ciclo.",
      previousMonth: "Mes anterior",
      nextMonth: "Mes siguiente",
      legendLogged: "Día de período registrado",
      legendPredicted: "Día de período previsto",
      legendToday: "Hoy",
      empty: "Todavía no hay marcas del ciclo para este mes.",
      loadError: "No se pudo cargar el calendario.",
      selectedDateLabel: "Fecha seleccionada",
      selectedDateFallback: "No hay fecha seleccionada",
      flowIntensityLabel: "Intensidad",
      flowIntensityPlaceholder: "Sin indicar",
      startPeriod: "Iniciar período aquí",
      endPeriod: "Finalizar período aquí",
      savePeriodDay: "Guardar día de período",
      savePending: "Guardando registro del período…",
      saveSuccess: "Día de período guardado.",
      saveError: "No se pudo guardar el día de período.",
      startSuccess: "Inicio del período guardado.",
      endSuccess: "Fin del período guardado.",
      tagsSuffix: "etiquetas"
    },
    history: {
      title: "Historial",
      description: "Check-ins recientes, registros del período y etiquetas de síntomas.",
      empty: "Todavía no hay entradas.",
      loadError: "No se pudo cargar el historial.",
      checkinLabel: "Check-in",
      periodLabel: "Período",
      symptomsLabel: "Síntomas",
      periodStarted: "inicio",
      periodEnded: "fin",
      scoreMood: "ánimo",
      scoreEnergy: "energía",
      scorePain: "dolor"
    },
    labels: {
      flowIntensity: {
        spotting: "manchado",
        light: "leve",
        medium: "medio",
        heavy: "abundante"
      },
      symptoms: {
        cramps: "cólicos",
        headache: "dolor de cabeza",
        nausea: "náuseas",
        acne: "acné",
        bloating: "hinchazón",
        breast_tenderness: "sensibilidad en los senos",
        fatigue: "fatiga",
        pms: "SPM"
      }
    },
    settings: {
      title: "Ajustes",
      description:
        "Esta página fija desde el inicio la postura no médica y de privacidad del producto.",
      preferencesTitle: "Preferencias de seguimiento",
      preferencesDescription:
        "Estos valores alimentan el primer modelo de predicción y la base del seguimiento del ciclo.",
      cycleLengthLabel: "Duración del ciclo (días)",
      periodLengthLabel: "Duración del período (días)",
      timezoneLabel: "Zona horaria",
      remindersEnabledLabel: "Recordatorios activados",
      saveIdle: "Guardar ajustes",
      savePending: "Guardando ajustes…",
      saveSuccess: "Ajustes guardados.",
      saveError: "No se pudieron guardar los ajustes.",
      productType: "Tipo de producto",
      productTypeValue: "Aplicación de seguimiento personal, no una aplicación médica.",
      coreModel: "Modelo base",
      coreModelValue: "Sin anuncios y sin suscripción para el funcionamiento básico.",
      dataPosture: "Tratamiento de datos",
      dataPostureValue:
        "Sin anuncios, sin venta de datos personales y sin compartir con terceros no relacionados.",
      integrationTitle: "Integración con Telegram",
      integrationDescription:
        "Este bloque muestra si la app se ejecuta dentro de Telegram y si la autenticación inicial se completó.",
      environment: "Entorno de ejecución",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "Vista previa en navegador",
      sessionStatus: "Estado de la sesión",
      sessionAuthenticating: "autorizando con Telegram",
      sessionAuthenticated: "autenticada",
      sessionPreview: "modo vista previa, sin init data de Telegram",
      sessionError: "falló la auth de Telegram",
      telegramAccount: "Cuenta de Telegram",
      telegramAccountFallback: "la cuenta todavía no está disponible",
      telegramLanguage: "Idioma de Telegram",
      telegramLanguageFallback: "no proporcionado",
      authErrorLabel: "Error de auth",
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
      eyebrow: "femi mvp",
      heroTitle: "Rastreamento de ciclo simples para um uso diário calmo.",
      heroCopy:
        "O Milestone 1 adiciona onboarding, registro menstrual, check-ins diários, histórico e um calendário de ciclo útil sem funções desnecessárias.",
      loading: "Sincronizando os dados do ciclo…",
      previewTitle: "Modo de prévia no navegador",
      previewBody:
        "Abra o app dentro do Telegram para executar a autenticação real e salvar os dados do ciclo. A prévia no navegador continua útil para revisar layout e textos.",
      syncErrorTitle: "Não foi possível carregar seus dados",
      syncErrorBody:
        "A autenticação do Telegram foi concluída, mas o app não conseguiu carregar o perfil ou os dados do ciclo do backend.",
      telegramAuthFailed: "A autenticação do Telegram falhou.",
      telegramAuthInvalidResponse: "O Telegram retornou uma resposta de autenticação inválida.",
      dataLoadError: "Não foi possível carregar os dados do aplicativo.",
      primaryNavLabel: "Navegação principal",
      tabs: {
        today: "Hoje",
        calendar: "Calendário",
        history: "Histórico",
        settings: "Configurações"
      }
    },
    onboarding: {
      title: "Uma configuração rápida antes do primeiro registro",
      description:
        "Defina uma vez a duração habitual do ciclo e da menstruação. Você poderá alterar as duas depois nas configurações.",
      cycleLengthLabel: "Duração habitual do ciclo",
      periodLengthLabel: "Duração habitual da menstruação",
      cycleLengthHint: "Faixa comum: de 20 a 45 dias",
      periodLengthHint: "Faixa comum: de 2 a 10 dias",
      submitIdle: "Salvar configuração",
      submitPending: "Salvando…",
      saveError: "Não foi possível salvar a configuração inicial."
    },
    today: {
      title: "Hoje",
      description: "A primeira tela fica reservada para o fluxo diário mais curto.",
      cycleDayLabel: "Dia atual do ciclo",
      cycleDayFallback: "ainda não há dados suficientes",
      nextPeriodLabel: "Próxima menstruação prevista",
      nextPeriodFallback: "a previsão começa após o primeiro registro menstrual",
      activePeriodLabel: "Estado atual",
      activePeriodYes: "menstruação em andamento",
      activePeriodNo: "fora dos dias de menstruação",
      periodActionsTitle: "Ações de menstruação",
      periodActionsDescription:
        "Use as ações mais curtas possíveis para registrar o estado menstrual de hoje.",
      startPeriod: "Registrar início da menstruação",
      endPeriod: "Registrar fim da menstruação",
      startPeriodError: "Não foi possível registrar o início da menstruação.",
      endPeriodError: "Não foi possível registrar o fim da menstruação.",
      saveStateIdle: "Salvar check-in de hoje",
      saveStatePending: "Salvando check-in…",
      saveSuccess: "A entrada de hoje foi salva.",
      saveError: "Não foi possível salvar o check-in.",
      checkinTitle: "Check-in diário rápido",
      checkinDescription:
        "Uma entrada compacta para o dia. Deixe qualquer campo vazio se ele não for importante hoje.",
      mood: "Humor",
      energy: "Energia",
      pain: "Dor",
      discharge: "Fluxo",
      sleep: "Qualidade do sono",
      note: "Nota opcional",
      notePlaceholder: "Qualquer coisa que você queira lembrar deste dia.",
      symptomsTitle: "Sintomas",
      symptomsDescription: "Toque para adicionar os sintomas que importam hoje.",
      symptomNone: "Nenhum sintoma selecionado",
      scorePlaceholder: "Não definido",
      dischargePlaceholder: "Não definido",
      dischargeOptions: {
        none: "Nenhum",
        dry: "Seco",
        sticky: "Pegajoso",
        creamy: "Cremoso",
        watery: "Aquoso"
      }
    },
    calendar: {
      title: "Calendário",
      description: "Visão mensal com dias menstruais registrados e a próxima previsão de ciclo.",
      previousMonth: "Mês anterior",
      nextMonth: "Próximo mês",
      legendLogged: "Dia menstrual registrado",
      legendPredicted: "Dia menstrual previsto",
      legendToday: "Hoje",
      empty: "Ainda não há marcações de ciclo para este mês.",
      loadError: "Não foi possível carregar o calendário.",
      selectedDateLabel: "Data selecionada",
      selectedDateFallback: "Nenhuma data selecionada",
      flowIntensityLabel: "Intensidade",
      flowIntensityPlaceholder: "Não definido",
      startPeriod: "Iniciar menstruação aqui",
      endPeriod: "Encerrar menstruação aqui",
      savePeriodDay: "Salvar dia menstrual",
      savePending: "Salvando registro menstrual…",
      saveSuccess: "Dia menstrual salvo.",
      saveError: "Não foi possível salvar o dia menstrual.",
      startSuccess: "Início da menstruação salvo.",
      endSuccess: "Fim da menstruação salvo.",
      tagsSuffix: "tags"
    },
    history: {
      title: "Histórico",
      description: "Check-ins recentes, registros menstruais e tags de sintomas.",
      empty: "Ainda não há registros.",
      loadError: "Não foi possível carregar o histórico.",
      checkinLabel: "Check-in",
      periodLabel: "Menstruação",
      symptomsLabel: "Sintomas",
      periodStarted: "início",
      periodEnded: "fim",
      scoreMood: "humor",
      scoreEnergy: "energia",
      scorePain: "dor"
    },
    labels: {
      flowIntensity: {
        spotting: "escape",
        light: "leve",
        medium: "média",
        heavy: "intensa"
      },
      symptoms: {
        cramps: "cólicas",
        headache: "dor de cabeça",
        nausea: "náusea",
        acne: "acne",
        bloating: "inchaço",
        breast_tenderness: "sensibilidade nos seios",
        fatigue: "fadiga",
        pms: "TPM"
      }
    },
    settings: {
      title: "Configurações",
      description:
        "Esta página consolida desde o início a postura não médica e de privacidade do produto.",
      preferencesTitle: "Preferências de rastreamento",
      preferencesDescription:
        "Esses valores alimentam o primeiro modelo de previsão e a base do rastreamento do ciclo.",
      cycleLengthLabel: "Duração do ciclo (dias)",
      periodLengthLabel: "Duração da menstruação (dias)",
      timezoneLabel: "Fuso horário",
      remindersEnabledLabel: "Lembretes ativados",
      saveIdle: "Salvar configurações",
      savePending: "Salvando configurações…",
      saveSuccess: "Configurações salvas.",
      saveError: "Não foi possível salvar as configurações.",
      productType: "Tipo de produto",
      productTypeValue: "Aplicativo de rastreamento pessoal, não um aplicativo médico.",
      coreModel: "Modelo principal",
      coreModelValue: "Sem anúncios e sem paywall por assinatura no básico.",
      dataPosture: "Postura de dados",
      dataPostureValue:
        "Sem anúncios, sem venda de dados pessoais e sem compartilhamento com terceiros não relacionados.",
      integrationTitle: "Integração com Telegram",
      integrationDescription:
        "Este bloco mostra se o app está rodando dentro do Telegram e se a autenticação inicial foi concluída.",
      environment: "Ambiente de execução",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "Prévia no navegador",
      sessionStatus: "Status da sessão",
      sessionAuthenticating: "autorizando com o Telegram",
      sessionAuthenticated: "autenticada",
      sessionPreview: "modo de prévia, sem init data do Telegram",
      sessionError: "falha na auth do Telegram",
      telegramAccount: "Conta do Telegram",
      telegramAccountFallback: "conta ainda indisponível",
      telegramLanguage: "Idioma do Telegram",
      telegramLanguageFallback: "não informado",
      authErrorLabel: "Erro de auth",
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
      eyebrow: "femi mvp",
      heroTitle: "Sakin günlük kullanım için tasarlanmış basit döngü takibi.",
      heroCopy:
        "Milestone 1, gereksiz özellik yükü olmadan onboarding, adet kaydı, günlük check-in, geçmiş ve kullanılabilir bir döngü takvimi ekler.",
      loading: "Döngü verileri senkronize ediliyor…",
      previewTitle: "Tarayıcı önizleme modu",
      previewBody:
        "Gerçek kimlik doğrulaması yapmak ve döngü verilerini kaydetmek için uygulamayı Telegram içinde açın. Tarayıcı önizlemesi düzen ve metin kontrolü için yine de faydalıdır.",
      syncErrorTitle: "Verileriniz yüklenemedi",
      syncErrorBody:
        "Telegram auth tamamlandı, ancak uygulama backend'den profil veya döngü verilerini yükleyemedi.",
      telegramAuthFailed: "Telegram kimlik doğrulaması başarısız oldu.",
      telegramAuthInvalidResponse: "Telegram geçersiz bir kimlik doğrulama yanıtı döndürdü.",
      dataLoadError: "Uygulama verileri yüklenemedi.",
      primaryNavLabel: "Ana gezinme",
      tabs: {
        today: "Bugün",
        calendar: "Takvim",
        history: "Geçmiş",
        settings: "Ayarlar"
      }
    },
    onboarding: {
      title: "İlk kayıt öncesi kısa kurulum",
      description:
        "Tipik döngü ve adet sürenizi bir kez ayarlayın. Daha sonra bunları ayarlardan değiştirebilirsiniz.",
      cycleLengthLabel: "Tipik döngü süresi",
      periodLengthLabel: "Tipik adet süresi",
      cycleLengthHint: "Yaygın aralık: 20 ila 45 gün",
      periodLengthHint: "Yaygın aralık: 2 ila 10 gün",
      submitIdle: "Kurulumu kaydet",
      submitPending: "Kaydediliyor…",
      saveError: "İlk kurulum kaydedilemedi."
    },
    today: {
      title: "Bugün",
      description: "İlk ekran en kısa günlük akış için ayrıldı.",
      cycleDayLabel: "Güncel döngü günü",
      cycleDayFallback: "henüz yeterli veri yok",
      nextPeriodLabel: "Tahmini sonraki adet",
      nextPeriodFallback: "tahmin ilk adet kaydından sonra başlar",
      activePeriodLabel: "Güncel durum",
      activePeriodYes: "adet devam ediyor",
      activePeriodNo: "adet günlerinde değil",
      periodActionsTitle: "Adet işlemleri",
      periodActionsDescription:
        "Bugünkü adet durumunu kaydetmek için mümkün olan en kısa işlemleri kullanın.",
      startPeriod: "Adet başlangıcını kaydet",
      endPeriod: "Adet bitişini kaydet",
      startPeriodError: "Adet başlangıcı kaydedilemedi.",
      endPeriodError: "Adet bitişi kaydedilemedi.",
      saveStateIdle: "Bugünkü check-in'i kaydet",
      saveStatePending: "Check-in kaydediliyor…",
      saveSuccess: "Bugünkü kayıt kaydedildi.",
      saveError: "Check-in kaydedilemedi.",
      checkinTitle: "Hızlı günlük check-in",
      checkinDescription:
        "Gün için kompakt bir kayıt. Gerekli değilse herhangi bir alanı boş bırakın.",
      mood: "Ruh hali",
      energy: "Enerji",
      pain: "Ağrı",
      discharge: "Akıntı",
      sleep: "Uyku kalitesi",
      note: "İsteğe bağlı not",
      notePlaceholder: "Bu gün için hatırlamak istediğiniz her şey.",
      symptomsTitle: "Belirtiler",
      symptomsDescription: "Bugün önemli olan belirtileri eklemek için dokunun.",
      symptomNone: "Belirti seçilmedi",
      scorePlaceholder: "Ayarlanmadı",
      dischargePlaceholder: "Ayarlanmadı",
      dischargeOptions: {
        none: "Yok",
        dry: "Kuru",
        sticky: "Yapışkan",
        creamy: "Kremimsi",
        watery: "Sulu"
      }
    },
    calendar: {
      title: "Takvim",
      description: "Kayıtlı adet günlerini ve bir sonraki döngü tahminini gösteren aylık görünüm.",
      previousMonth: "Önceki ay",
      nextMonth: "Sonraki ay",
      legendLogged: "Kaydedilmiş adet günü",
      legendPredicted: "Tahmini adet günü",
      legendToday: "Bugün",
      empty: "Bu ay için henüz döngü işareti yok.",
      loadError: "Takvim yüklenemedi.",
      selectedDateLabel: "Seçilen tarih",
      selectedDateFallback: "Tarih seçilmedi",
      flowIntensityLabel: "Yoğunluk",
      flowIntensityPlaceholder: "Ayarlanmadı",
      startPeriod: "Adeti burada başlat",
      endPeriod: "Adeti burada bitir",
      savePeriodDay: "Adet gününü kaydet",
      savePending: "Adet kaydı kaydediliyor…",
      saveSuccess: "Adet günü kaydedildi.",
      saveError: "Adet günü kaydedilemedi.",
      startSuccess: "Adet başlangıcı kaydedildi.",
      endSuccess: "Adet bitişi kaydedildi.",
      tagsSuffix: "etiket"
    },
    history: {
      title: "Geçmiş",
      description: "Son check-in'ler, adet kayıtları ve semptom etiketleri.",
      empty: "Henüz kayıt yok.",
      loadError: "Geçmiş yüklenemedi.",
      checkinLabel: "Check-in",
      periodLabel: "Adet",
      symptomsLabel: "Belirtiler",
      periodStarted: "başlangıç",
      periodEnded: "bitiş",
      scoreMood: "ruh hali",
      scoreEnergy: "enerji",
      scorePain: "ağrı"
    },
    labels: {
      flowIntensity: {
        spotting: "lekelenme",
        light: "hafif",
        medium: "orta",
        heavy: "yoğun"
      },
      symptoms: {
        cramps: "kramplar",
        headache: "baş ağrısı",
        nausea: "mide bulantısı",
        acne: "akne",
        bloating: "şişkinlik",
        breast_tenderness: "göğüs hassasiyeti",
        fatigue: "yorgunluk",
        pms: "PMS"
      }
    },
    settings: {
      title: "Ayarlar",
      description: "Bu sayfa ürünün tıbbi olmayan ve gizlilik duruşunu en baştan sabitler.",
      preferencesTitle: "Takip tercihleri",
      preferencesDescription:
        "Bu değerler ilk tahmin modelini ve döngü takibinin başlangıç temelini belirler.",
      cycleLengthLabel: "Döngü süresi (gün)",
      periodLengthLabel: "Adet süresi (gün)",
      timezoneLabel: "Saat dilimi",
      remindersEnabledLabel: "Hatırlatıcılar açık",
      saveIdle: "Ayarları kaydet",
      savePending: "Ayarlar kaydediliyor…",
      saveSuccess: "Ayarlar kaydedildi.",
      saveError: "Ayarlar kaydedilemedi.",
      productType: "Ürün türü",
      productTypeValue: "Kişisel takip uygulaması, tıbbi uygulama değil.",
      coreModel: "Temel model",
      coreModelValue: "Reklamsız ve temel işlevler için abonelik engeli yok.",
      dataPosture: "Veri yaklaşımı",
      dataPostureValue: "Reklam yok, kişisel veri satışı yok, alakasız üçüncü taraf paylaşımı yok.",
      integrationTitle: "Telegram entegrasyonu",
      integrationDescription:
        "Bu blok uygulamanın Telegram içinde çalışıp çalışmadığını ve ilk Telegram auth yolunun başarılı olup olmadığını gösterir.",
      environment: "Çalışma ortamı",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "Tarayıcı önizlemesi",
      sessionStatus: "Oturum durumu",
      sessionAuthenticating: "Telegram ile yetkilendiriliyor",
      sessionAuthenticated: "kimlik doğrulandı",
      sessionPreview: "önizleme modu, Telegram init data yok",
      sessionError: "Telegram auth başarısız",
      telegramAccount: "Telegram hesabı",
      telegramAccountFallback: "hesap henüz kullanılamıyor",
      telegramLanguage: "Telegram dili",
      telegramLanguageFallback: "sağlanmadı",
      authErrorLabel: "Auth hatası",
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
      eyebrow: "femi mvp",
      heroTitle: "Простий трекінг циклу для спокійного щоденного використання.",
      heroCopy:
        "Milestone 1 додає онбординг, логування менструації, щоденні чек-іни, історію та зручний календар циклу без зайвого функціоналу.",
      loading: "Синхронізуємо дані циклу…",
      previewTitle: "Режим прев'ю в браузері",
      previewBody:
        "Відкрийте застосунок у Telegram, щоб пройти справжню автентифікацію та зберігати дані циклу. Прев'ю в браузері корисне для перевірки інтерфейсу й текстів.",
      syncErrorTitle: "Не вдалося завантажити ваші дані",
      syncErrorBody:
        "Автентифікація через Telegram пройшла, але застосунок не зміг завантажити профіль або дані циклу з backend.",
      telegramAuthFailed: "Не вдалося пройти автентифікацію через Telegram.",
      telegramAuthInvalidResponse: "Telegram повернув некоректну відповідь автентифікації.",
      dataLoadError: "Не вдалося завантажити дані застосунку.",
      primaryNavLabel: "Основна навігація",
      tabs: {
        today: "Сьогодні",
        calendar: "Календар",
        history: "Історія",
        settings: "Налаштування"
      }
    },
    onboarding: {
      title: "Коротке налаштування перед першим записом",
      description:
        "Один раз вкажіть звичну тривалість циклу та менструації. Пізніше це можна змінити в налаштуваннях.",
      cycleLengthLabel: "Звична тривалість циклу",
      periodLengthLabel: "Звична тривалість менструації",
      cycleLengthHint: "Поширений діапазон: від 20 до 45 днів",
      periodLengthHint: "Поширений діапазон: від 2 до 10 днів",
      submitIdle: "Зберегти налаштування",
      submitPending: "Зберігаємо…",
      saveError: "Не вдалося зберегти початкове налаштування."
    },
    today: {
      title: "Сьогодні",
      description: "Перший екран відведено під найкоротший щоденний сценарій.",
      cycleDayLabel: "Поточний день циклу",
      cycleDayFallback: "поки недостатньо даних",
      nextPeriodLabel: "Прогноз наступної менструації",
      nextPeriodFallback: "прогноз з'явиться після першого запису про менструацію",
      activePeriodLabel: "Поточний стан",
      activePeriodYes: "менструація триває",
      activePeriodNo: "зараз не дні менструації",
      periodActionsTitle: "Дії щодо менструації",
      periodActionsDescription: "Використовуйте найкоротші дії, щоб зафіксувати сьогоднішній стан.",
      startPeriod: "Позначити початок менструації",
      endPeriod: "Позначити завершення менструації",
      startPeriodError: "Не вдалося позначити початок менструації.",
      endPeriodError: "Не вдалося позначити завершення менструації.",
      saveStateIdle: "Зберегти запис за сьогодні",
      saveStatePending: "Зберігаємо чек-ін…",
      saveSuccess: "Запис за сьогодні збережено.",
      saveError: "Не вдалося зберегти чек-ін.",
      checkinTitle: "Швидкий щоденний чек-ін",
      checkinDescription:
        "Компактний запис на день. Залишайте поле порожнім, якщо воно зараз не важливе.",
      mood: "Настрій",
      energy: "Енергія",
      pain: "Біль",
      discharge: "Виділення",
      sleep: "Якість сну",
      note: "Необов'язкова нотатка",
      notePlaceholder: "Усе, що ви хочете запам'ятати про цей день.",
      symptomsTitle: "Симптоми",
      symptomsDescription: "Натисніть, щоб додати симптоми, які важливі сьогодні.",
      symptomNone: "Симптоми не вибрані",
      scorePlaceholder: "Не вказано",
      dischargePlaceholder: "Не вказано",
      dischargeOptions: {
        none: "Немає",
        dry: "Сухо",
        sticky: "Липкі",
        creamy: "Кремові",
        watery: "Водянисті"
      }
    },
    calendar: {
      title: "Календар",
      description: "Вигляд місяця з позначеними днями менструації та прогнозом наступного циклу.",
      previousMonth: "Попередній місяць",
      nextMonth: "Наступний місяць",
      legendLogged: "Записаний день менструації",
      legendPredicted: "Прогнозований день менструації",
      legendToday: "Сьогодні",
      empty: "Для цього місяця поки немає позначок циклу.",
      loadError: "Не вдалося завантажити календар.",
      selectedDateLabel: "Обрана дата",
      selectedDateFallback: "Дату не вибрано",
      flowIntensityLabel: "Інтенсивність",
      flowIntensityPlaceholder: "Не вказано",
      startPeriod: "Почати тут",
      endPeriod: "Завершити тут",
      savePeriodDay: "Зберегти день менструації",
      savePending: "Зберігаємо запис про день…",
      saveSuccess: "День менструації збережено.",
      saveError: "Не вдалося зберегти день менструації.",
      startSuccess: "Початок менструації збережено.",
      endSuccess: "Завершення менструації збережено.",
      tagsSuffix: "теги"
    },
    history: {
      title: "Історія",
      description: "Нещодавні чек-іни, записи про менструацію та теги симптомів.",
      empty: "Записів поки немає.",
      loadError: "Не вдалося завантажити історію.",
      checkinLabel: "Чек-ін",
      periodLabel: "Менструація",
      symptomsLabel: "Симптоми",
      periodStarted: "початок",
      periodEnded: "кінець",
      scoreMood: "настрій",
      scoreEnergy: "енергія",
      scorePain: "біль"
    },
    labels: {
      flowIntensity: {
        spotting: "мажучі",
        light: "легка",
        medium: "середня",
        heavy: "рясна"
      },
      symptoms: {
        cramps: "спазми",
        headache: "головний біль",
        nausea: "нудота",
        acne: "акне",
        bloating: "здуття",
        breast_tenderness: "чутливість грудей",
        fatigue: "втома",
        pms: "ПМС"
      }
    },
    settings: {
      title: "Налаштування",
      description:
        "Ця сторінка з самого початку закріплює немедичний і приватний характер продукту.",
      preferencesTitle: "Параметри трекінгу",
      preferencesDescription:
        "Ці значення використовуються для першого прогнозу та базового налаштування трекінгу циклу.",
      cycleLengthLabel: "Тривалість циклу (дні)",
      periodLengthLabel: "Тривалість менструації (дні)",
      timezoneLabel: "Часовий пояс",
      remindersEnabledLabel: "Нагадування увімкнені",
      saveIdle: "Зберегти налаштування",
      savePending: "Зберігаємо налаштування…",
      saveSuccess: "Налаштування збережено.",
      saveError: "Не вдалося зберегти налаштування.",
      productType: "Тип продукту",
      productTypeValue: "Застосунок для особистого трекінгу, а не медичний застосунок.",
      coreModel: "Базова модель",
      coreModelValue: "Без реклами та без підписки, що блокує базовий функціонал.",
      dataPosture: "Підхід до даних",
      dataPostureValue:
        "Без реклами, без продажу персональних даних і без передачі не пов'язаним третім сторонам.",
      integrationTitle: "Інтеграція з Telegram",
      integrationDescription:
        "Цей блок показує, чи запущено застосунок усередині Telegram і чи пройшов початковий шлях автентифікації.",
      environment: "Середовище запуску",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "Прев'ю у браузері",
      sessionStatus: "Статус сесії",
      sessionAuthenticating: "авторизація через Telegram",
      sessionAuthenticated: "автентифікацію виконано",
      sessionPreview: "режим прев'ю, без Telegram init data",
      sessionError: "помилка Telegram auth",
      telegramAccount: "Акаунт Telegram",
      telegramAccountFallback: "акаунт поки недоступний",
      telegramLanguage: "Мова Telegram",
      telegramLanguageFallback: "не передано",
      authErrorLabel: "Помилка auth",
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
      eyebrow: "femi mvp",
      heroTitle: "تتبع بسيط للدورة مصمم للاستخدام اليومي الهادئ.",
      heroCopy:
        "يضيف Milestone 1 الإعداد الأولي وتسجيل الدورة والمتابعات اليومية والسجل وتقويم دورة عملي من دون وظائف زائدة.",
      loading: "جارٍ مزامنة بيانات الدورة…",
      previewTitle: "وضع المعاينة في المتصفح",
      previewBody:
        "افتحي التطبيق داخل Telegram لتشغيل المصادقة الحقيقية وحفظ بيانات الدورة. تظل المعاينة في المتصفح مفيدة لمراجعة الواجهة والنصوص.",
      syncErrorTitle: "تعذر تحميل بياناتك",
      syncErrorBody:
        "اكتملت مصادقة Telegram، لكن التطبيق لم يتمكن من تحميل الملف الشخصي أو بيانات الدورة من الخادم الخلفي.",
      telegramAuthFailed: "فشلت مصادقة Telegram.",
      telegramAuthInvalidResponse: "أعاد Telegram استجابة مصادقة غير صالحة.",
      dataLoadError: "تعذر تحميل بيانات التطبيق.",
      primaryNavLabel: "التنقل الرئيسي",
      tabs: {
        today: "اليوم",
        calendar: "التقويم",
        history: "السجل",
        settings: "الإعدادات"
      }
    },
    onboarding: {
      title: "إعداد قصير قبل أول تسجيل",
      description:
        "حددي مرة واحدة طول الدورة المعتاد وطول الحيض. يمكنك تغييرهما لاحقًا من الإعدادات.",
      cycleLengthLabel: "الطول المعتاد للدورة",
      periodLengthLabel: "الطول المعتاد للحيض",
      cycleLengthHint: "النطاق الشائع: من 20 إلى 45 يومًا",
      periodLengthHint: "النطاق الشائع: من 2 إلى 10 أيام",
      submitIdle: "حفظ الإعداد",
      submitPending: "جارٍ الحفظ…",
      saveError: "تعذر حفظ الإعداد الأولي."
    },
    today: {
      title: "اليوم",
      description: "تم تخصيص الشاشة الأولى لأقصر تدفق يومي ممكن.",
      cycleDayLabel: "اليوم الحالي من الدورة",
      cycleDayFallback: "لا توجد بيانات كافية بعد",
      nextPeriodLabel: "موعد الحيض المتوقع التالي",
      nextPeriodFallback: "يبدأ التوقع بعد أول تسجيل للحيض",
      activePeriodLabel: "الحالة الحالية",
      activePeriodYes: "الحيض جارٍ",
      activePeriodNo: "ليست ضمن أيام الحيض",
      periodActionsTitle: "إجراءات الحيض",
      periodActionsDescription: "استخدمي أقصر الإجراءات الممكنة لتسجيل حالة الحيض اليوم.",
      startPeriod: "تسجيل بداية الحيض",
      endPeriod: "تسجيل نهاية الحيض",
      startPeriodError: "تعذر تسجيل بداية الحيض.",
      endPeriodError: "تعذر تسجيل نهاية الحيض.",
      saveStateIdle: "حفظ متابعة اليوم",
      saveStatePending: "جارٍ حفظ المتابعة…",
      saveSuccess: "تم حفظ إدخال اليوم.",
      saveError: "تعذر حفظ المتابعة.",
      checkinTitle: "متابعة يومية سريعة",
      checkinDescription: "إدخال مختصر لليوم. اتركي أي حقل فارغًا إذا لم يكن مهمًا الآن.",
      mood: "المزاج",
      energy: "الطاقة",
      pain: "الألم",
      discharge: "الإفرازات",
      sleep: "جودة النوم",
      note: "ملاحظة اختيارية",
      notePlaceholder: "أي شيء تريدين تذكره عن هذا اليوم.",
      symptomsTitle: "الأعراض",
      symptomsDescription: "اضغطي لإضافة الأعراض المهمة اليوم.",
      symptomNone: "لا توجد أعراض محددة",
      scorePlaceholder: "غير مضبوط",
      dischargePlaceholder: "غير مضبوط",
      dischargeOptions: {
        none: "لا شيء",
        dry: "جافة",
        sticky: "لزجة",
        creamy: "كريمية",
        watery: "مائية"
      }
    },
    calendar: {
      title: "التقويم",
      description: "عرض شهري يوضح أيام الدورة المسجلة وتوقع بداية الدورة التالية.",
      previousMonth: "الشهر السابق",
      nextMonth: "الشهر التالي",
      legendLogged: "يوم حيض مسجل",
      legendPredicted: "يوم حيض متوقع",
      legendToday: "اليوم",
      empty: "لا توجد علامات دورة لهذا الشهر بعد.",
      loadError: "تعذر تحميل التقويم.",
      selectedDateLabel: "التاريخ المحدد",
      selectedDateFallback: "لا يوجد تاريخ محدد",
      flowIntensityLabel: "الشدة",
      flowIntensityPlaceholder: "غير مضبوط",
      startPeriod: "ابدئي الحيض هنا",
      endPeriod: "أنهي الحيض هنا",
      savePeriodDay: "حفظ يوم الحيض",
      savePending: "جارٍ حفظ سجل الحيض…",
      saveSuccess: "تم حفظ يوم الحيض.",
      saveError: "تعذر حفظ يوم الحيض.",
      startSuccess: "تم حفظ بداية الحيض.",
      endSuccess: "تم حفظ نهاية الحيض.",
      tagsSuffix: "وسوم"
    },
    history: {
      title: "السجل",
      description: "المتابعات الأخيرة وسجلات الدورة وعلامات الأعراض.",
      empty: "لا توجد إدخالات بعد.",
      loadError: "تعذر تحميل السجل.",
      checkinLabel: "متابعة",
      periodLabel: "الحيض",
      symptomsLabel: "الأعراض",
      periodStarted: "البداية",
      periodEnded: "النهاية",
      scoreMood: "المزاج",
      scoreEnergy: "الطاقة",
      scorePain: "الألم"
    },
    labels: {
      flowIntensity: {
        spotting: "تبقيع",
        light: "خفيف",
        medium: "متوسط",
        heavy: "غزير"
      },
      symptoms: {
        cramps: "تشنجات",
        headache: "صداع",
        nausea: "غثيان",
        acne: "حب الشباب",
        bloating: "انتفاخ",
        breast_tenderness: "حساسية الثدي",
        fatigue: "إرهاق",
        pms: "متلازمة ما قبل الحيض"
      }
    },
    settings: {
      title: "الإعدادات",
      description: "تثبت هذه الصفحة منذ البداية موقف المنتج غير الطبي ونهجه في الخصوصية.",
      preferencesTitle: "تفضيلات التتبع",
      preferencesDescription: "تغذي هذه القيم أول نموذج للتوقع وخط الأساس لتتبع الدورة.",
      cycleLengthLabel: "طول الدورة (بالأيام)",
      periodLengthLabel: "طول الحيض (بالأيام)",
      timezoneLabel: "المنطقة الزمنية",
      remindersEnabledLabel: "التذكيرات مفعلة",
      saveIdle: "حفظ الإعدادات",
      savePending: "جارٍ حفظ الإعدادات…",
      saveSuccess: "تم حفظ الإعدادات.",
      saveError: "تعذر حفظ الإعدادات.",
      productType: "نوع المنتج",
      productTypeValue: "تطبيق تتبع شخصي وليس تطبيقًا طبيًا.",
      coreModel: "النموذج الأساسي",
      coreModelValue: "من دون إعلانات ومن دون حجب الوظائف الأساسية خلف اشتراك.",
      dataPosture: "نهج البيانات",
      dataPostureValue:
        "لا إعلانات، لا بيع للبيانات الشخصية، ولا مشاركة مع أطراف ثالثة غير مرتبطة.",
      integrationTitle: "تكامل Telegram",
      integrationDescription:
        "يوضح هذا القسم ما إذا كان التطبيق يعمل داخل Telegram وما إذا كان مسار المصادقة الأولي قد نجح.",
      environment: "بيئة التشغيل",
      environmentTelegram: "Telegram Mini App",
      environmentBrowser: "معاينة المتصفح",
      sessionStatus: "حالة الجلسة",
      sessionAuthenticating: "جارٍ التفويض عبر Telegram",
      sessionAuthenticated: "تمت المصادقة",
      sessionPreview: "وضع المعاينة، لا توجد Telegram init data",
      sessionError: "فشل Telegram auth",
      telegramAccount: "حساب Telegram",
      telegramAccountFallback: "الحساب غير متاح بعد",
      telegramLanguage: "لغة Telegram",
      telegramLanguageFallback: "غير متوفرة",
      authErrorLabel: "خطأ auth",
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
