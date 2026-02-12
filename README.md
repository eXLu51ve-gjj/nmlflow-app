# nmL Flow Mobile - Android Application

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React Native](https://img.shields.io/badge/react--native-0.76-green.svg)
![Expo](https://img.shields.io/badge/expo-52.0-orange.svg)
![Android](https://img.shields.io/badge/android-7.0+-brightgreen.svg)

**Мобильное приложение для управления проектами и командой**

[🇷🇺 Русский](#-русская-документация) | [🇬🇧 English](#-english-documentation)

</div>

---

## 🇷🇺 Русская документация

### 📖 Описание

**nmL Flow Mobile** — мобильное приложение для Android, которое позволяет управлять проектами, задачами и командой прямо с вашего смартфона. Работает в связке с серверной частью nmL Flow.

### ✨ Возможности

- 📋 **Управление задачами** - создание, редактирование, комментирование
- 👥 **Командная работа** - просмотр команды, назначение задач
- 💬 **Чат** - общение с командой в реальном времени
- 📊 **Аналитика** - диаграммы активности и статистика
- 💰 **Зарплата** - отметка рабочих дней и расчет зарплаты
- 🔔 **Push-уведомления** - мгновенные оповещения о новых задачах
- 🎨 **Темная тема** - современный дизайн с градиентами
- 🌐 **Самостоятельный сервер** - подключение к вашему серверу

### 📋 Требования

- **Android** 7.0 (API 24) или выше
- **Интернет-соединение**
- **Сервер nmL Flow** (см. [серверную часть](https://github.com/eXLu51ve-gjj/nmlflow-server))

### 📱 Установка APK

#### Для пользователей

1. Скачайте APK из [RuStore](https://apps.rustore.ru/app/com.nmlflow.app) или [Releases](https://github.com/eXLu51ve-gjj/nmlflow-app/releases)
2. Разрешите установку из неизвестных источников (если требуется)
3. Установите приложение
4. При первом запуске введите URL вашего сервера
5. Войдите с учетными данными

#### Демо-сервер

Для тестирования доступен демо-сервер:

**URL:** `http://demo.nmlflow.com:3000`

**Учетные данные:**
- Администратор: `demo-admin@demo.ru` / `demo123`
- Сотрудник 1: `demo1@demo.ru` / `demo123`
- Сотрудник 2: `demo2@demo.ru` / `demo123`
- Сотрудник 3: `demo3@demo.ru` / `demo123`

### 🔧 Сборка из исходников

#### 1. Установите зависимости

**Node.js и npm:**
- Скачайте с [nodejs.org](https://nodejs.org/) (версия 20.x или выше)

**Android Studio:**
- Скачайте с [developer.android.com](https://developer.android.com/studio)
- Установите Android SDK (API 34)
- Установите JDK 17

**Expo CLI:**
```bash
npm install -g expo-cli
```

#### 2. Клонируйте репозиторий

```bash
git clone https://github.com/yourusername/nmlflow-app.git
cd nmlflow-app
```

#### 3. Установите зависимости проекта

```bash
npm install
```

#### 4. Настройте Firebase (Push-уведомления)

##### Создайте проект Firebase

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект
3. Добавьте Android приложение:
   - Package name: `com.nmlflow.app`
   - Скачайте `google-services.json`
   - Поместите файл в корень проекта `nmlflowApp/`

##### Получите Server Key

1. В Firebase Console откройте **Project Settings** (⚙️)
2. Перейдите на вкладку **Cloud Messaging**
3. Скопируйте **Server key**
4. Добавьте его в `.env` файл сервера (см. документацию сервера)

#### 5. Настройте URL сервера (опционально)

По умолчанию приложение запрашивает URL при первом входе. Если хотите указать URL по умолчанию:

Откройте `constants/api.ts`:

```typescript
export const API_BASE_URL = 'https://your-domain.com'; // Замените на ваш домен
```

#### 6. Соберите приложение

##### Режим разработки (с Metro)

```bash
npx expo start
```

Затем нажмите `a` для запуска на Android эмуляторе/устройстве.

##### Production сборка (APK)

**Шаг 1: Создайте нативные файлы Android**

```bash
npx expo prebuild --clean --platform android
```

**Шаг 2: Откройте проект в Android Studio**

```bash
# Windows
start android/
# macOS/Linux
open android/
```

Или откройте папку `android/` через Android Studio.

**Шаг 3: Создайте Keystore (если еще нет)**

В Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Выберите **APK**
3. Нажмите **Create new...** для создания keystore
4. Заполните данные:
   - **Key store path:** `android/app/nmlflow-release.keystore`
   - **Password:** придумайте надежный пароль
   - **Key alias:** `nmlflow-key`
   - **Key password:** тот же пароль
   - **Validity:** 25 лет
   - **Certificate:**
     - First and Last Name: `nmL Flow`
     - Organization: `nmL`
     - City: `Moscow`
     - Country Code: `RU`

**Шаг 4: Соберите APK**

1. Выберите созданный keystore
2. Введите пароли
3. Нажмите **Next** → **release** → **Finish**

APK будет находиться в:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Альтернативный способ (через командную строку):**

```bash
cd android
./gradlew assembleRelease
```

#### 7. Установите APK на устройство

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 🔐 Настройка подписи (для обновлений)

Сохраните файлы keystore в безопасном месте! Они нужны для выпуска обновлений.

**Автоматическая подпись при сборке:**

Создайте файл `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=nmlflow-release.keystore
MYAPP_RELEASE_KEY_ALIAS=nmlflow-key
MYAPP_RELEASE_STORE_PASSWORD=ваш_пароль
MYAPP_RELEASE_KEY_PASSWORD=ваш_пароль
```

⚠️ **Важно:** Добавьте `gradle.properties` в `.gitignore`!

### 📊 Использование

#### Первый запуск

1. Откройте приложение
2. Введите URL вашего сервера (например: `http://192.168.1.100:3000`)
3. Зарегистрируйтесь или войдите

#### Основные функции

**Главная страница:**
- Статистика задач и активности
- Быстрый доступ к функциям
- Диаграмма активности команды

**Задачи:**
- Просмотр задач по проектам
- Свайп между колонками
- Создание и редактирование задач
- Комментарии и вложения

**CRM:**
- Управление лидами
- Воронка продаж
- Добавление комментариев

**Чат:**
- Общение с командой
- Отправка фото
- Push-уведомления о новых сообщениях

**Зарплата:**
- Отметка рабочих дней
- Автоматический расчет
- История выплат

**Настройки:**
- Смена фона
- Настройка прозрачности UI
- Управление уведомлениями

### 🎨 Кастомизация

#### Изменение темы

Откройте `constants/theme.ts`:

```typescript
export const colors = {
  primary: '#8b5cf6',      // Основной цвет
  background: '#0a0a1a',   // Фон
  text: '#ffffff',         // Текст
  // ...
};
```

#### Добавление фонов

Поместите изображения в `assets/images/backgrounds/` и обновите `components/settings/BackgroundPicker.tsx`.

### 🔄 Обновление приложения

1. Получите последние изменения:
```bash
git pull origin main
```

2. Обновите зависимости:
```bash
npm install
```

3. Пересоберите нативные файлы:
```bash
npx expo prebuild --clean
```

4. Увеличьте версию в `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

5. Соберите новый APK (см. шаг 6 выше)

### 🐛 Решение проблем

#### Приложение не подключается к серверу

1. Проверьте URL сервера (должен быть доступен из сети)
2. Убедитесь что сервер запущен
3. Проверьте firewall/порты
4. Для локальной сети используйте IP адрес (не localhost)

#### Push-уведомления не работают

1. Проверьте что `google-services.json` в корне проекта
2. Убедитесь что `FCM_SERVER_KEY` настроен на сервере
3. Пересоберите приложение после добавления `google-services.json`

#### Ошибка при сборке

```bash
# Очистите кэш
cd android
./gradlew clean

# Пересоберите
./gradlew assembleRelease
```

#### Metro bundler не запускается

```bash
# Очистите кэш Metro
npx expo start -c
```

### 🏗️ Архитектура проекта

```
nmlflowApp/
├── app/                    # Экраны приложения (Expo Router)
│   ├── (auth)/            # Экраны авторизации
│   ├── (tabs)/            # Основные экраны с табами
│   └── task/              # Детали задачи
├── components/            # Переиспользуемые компоненты
│   ├── ui/               # UI компоненты
│   ├── providers/        # Context провайдеры
│   └── settings/         # Компоненты настроек
├── constants/            # Константы и конфигурация
│   ├── api.ts           # API endpoints
│   └── theme.ts         # Цвета и стили
├── lib/                 # Утилиты и API клиент
│   ├── api.ts          # API функции
│   └── supabase.ts     # Supabase клиент (не используется)
├── store/              # Zustand store (глобальное состояние)
├── assets/             # Изображения и шрифты
├── android/            # Нативный Android код
└── google-services.json # Firebase конфигурация
```

### 📝 Лицензия

MIT License - свободно используйте в коммерческих и личных проектах.

### 🤝 Поддержка

- 📧 Email: nml5222600@mail.ru
- 💬 Telegram: https://t.me/eXLu51ve
- 🐛 Issues: [GitHub Issues](https://github.com/eXLu51ve-gjj/nmlflow-app/issues)

### 🌟 Вклад в проект

Мы приветствуем вклад в развитие проекта!

1. Fork репозитория
2. Создайте ветку (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

---

## 🇬🇧 English Documentation

### 📖 Description

**nmL Flow Mobile** is an Android application for project and team management directly from your smartphone. Works with nmL Flow server.

### ✨ Features

- 📋 **Task Management** - create, edit, comment
- 👥 **Team Collaboration** - view team, assign tasks
- 💬 **Chat** - real-time team communication
- 📊 **Analytics** - activity charts and statistics
- 💰 **Salary** - mark work days and calculate salary
- 🔔 **Push Notifications** - instant task notifications
- 🎨 **Dark Theme** - modern design with gradients
- 🌐 **Self-hosted** - connect to your own server

### 📋 Requirements

- **Android** 7.0 (API 24) or higher
- **Internet connection**
- **nmL Flow Server** (see [server documentation](https://github.com/yourusername/nmlflow-server))

### 📱 APK Installation

#### For Users

1. Download APK from [RuStore](https://apps.rustore.ru/app/com.nmlflow.app) or [Releases](https://github.com/yourusername/nmlflow-app/releases)
2. Allow installation from unknown sources (if required)
3. Install application
4. On first launch, enter your server URL
5. Login with credentials

#### Demo Server

Demo server available for testing:

**URL:** `http://demo.nmlflow.com:3000`

**Credentials:**
- Administrator: `demo-admin@demo.ru` / `demo123`
- Employee 1: `demo1@demo.ru` / `demo123`
- Employee 2: `demo2@demo.ru` / `demo123`
- Employee 3: `demo3@demo.ru` / `demo123`

### 🔧 Build from Source

#### 1. Install Dependencies

**Node.js and npm:**
- Download from [nodejs.org](https://nodejs.org/) (version 20.x or higher)

**Android Studio:**
- Download from [developer.android.com](https://developer.android.com/studio)
- Install Android SDK (API 34)
- Install JDK 17

**Expo CLI:**
```bash
npm install -g expo-cli
```

#### 2. Clone Repository

```bash
git clone https://github.com/yourusername/nmlflow-app.git
cd nmlflow-app
```

#### 3. Install Project Dependencies

```bash
npm install
```

#### 4. Configure Firebase (Push Notifications)

##### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project
3. Add Android application:
   - Package name: `com.nmlflow.app`
   - Download `google-services.json`
   - Place file in project root `nmlflowApp/`

##### Get Server Key

1. In Firebase Console open **Project Settings** (⚙️)
2. Go to **Cloud Messaging** tab
3. Copy **Server key**
4. Add it to server `.env` file (see server documentation)

#### 5. Configure Server URL (optional)

By default, app requests URL on first login. To set default URL:

Open `constants/api.ts`:

```typescript
export const API_BASE_URL = 'https://your-domain.com'; // Replace with your domain
```

#### 6. Build Application

##### Development Mode (with Metro)

```bash
npx expo start
```

Then press `a` to launch on Android emulator/device.

##### Production Build (APK)

**Step 1: Create Android Native Files**

```bash
npx expo prebuild --clean --platform android
```

**Step 2: Open Project in Android Studio**

```bash
# Windows
start android/
# macOS/Linux
open android/
```

Or open `android/` folder through Android Studio.

**Step 3: Create Keystore (if not exists)**

In Android Studio:
1. **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Click **Create new...** to create keystore
4. Fill in data:
   - **Key store path:** `android/app/nmlflow-release.keystore`
   - **Password:** create strong password
   - **Key alias:** `nmlflow-key`
   - **Key password:** same password
   - **Validity:** 25 years
   - **Certificate:**
     - First and Last Name: `nmL Flow`
     - Organization: `nmL`
     - City: `Moscow`
     - Country Code: `RU`

**Step 4: Build APK**

1. Select created keystore
2. Enter passwords
3. Click **Next** → **release** → **Finish**

APK will be located at:
```
android/app/build/outputs/apk/release/app-release.apk
```

**Alternative Method (command line):**

```bash
cd android
./gradlew assembleRelease
```

#### 7. Install APK on Device

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

### 🔐 Signing Configuration (for updates)

Save keystore files in a safe place! They are needed for releasing updates.

**Automatic Signing on Build:**

Create file `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=nmlflow-release.keystore
MYAPP_RELEASE_KEY_ALIAS=nmlflow-key
MYAPP_RELEASE_STORE_PASSWORD=your_password
MYAPP_RELEASE_KEY_PASSWORD=your_password
```

⚠️ **Important:** Add `gradle.properties` to `.gitignore`!

### 📊 Usage

#### First Launch

1. Open application
2. Enter your server URL (e.g., `http://192.168.1.100:3000`)
3. Register or login

#### Main Features

**Home Page:**
- Task and activity statistics
- Quick access to functions
- Team activity chart

**Tasks:**
- View tasks by projects
- Swipe between columns
- Create and edit tasks
- Comments and attachments

**CRM:**
- Lead management
- Sales funnel
- Add comments

**Chat:**
- Team communication
- Send photos
- Push notifications for new messages

**Salary:**
- Mark work days
- Automatic calculation
- Payment history

**Settings:**
- Change background
- UI transparency settings
- Notification management

### 🎨 Customization

#### Change Theme

Open `constants/theme.ts`:

```typescript
export const colors = {
  primary: '#8b5cf6',      // Primary color
  background: '#0a0a1a',   // Background
  text: '#ffffff',         // Text
  // ...
};
```

#### Add Backgrounds

Place images in `assets/images/backgrounds/` and update `components/settings/BackgroundPicker.tsx`.

### 🔄 Update Application

1. Get latest changes:
```bash
git pull origin main
```

2. Update dependencies:
```bash
npm install
```

3. Rebuild native files:
```bash
npx expo prebuild --clean
```

4. Increase version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",
    "android": {
      "versionCode": 2
    }
  }
}
```

5. Build new APK (see step 6 above)

### 🐛 Troubleshooting

#### App Can't Connect to Server

1. Check server URL (must be accessible from network)
2. Ensure server is running
3. Check firewall/ports
4. For local network use IP address (not localhost)

#### Push Notifications Not Working

1. Check that `google-services.json` is in project root
2. Ensure `FCM_SERVER_KEY` is configured on server
3. Rebuild app after adding `google-services.json`

#### Build Error

```bash
# Clean cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleRelease
```

#### Metro Bundler Won't Start

```bash
# Clear Metro cache
npx expo start -c
```

### 🏗️ Project Architecture

```
nmlflowApp/
├── app/                    # App screens (Expo Router)
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Main screens with tabs
│   └── task/              # Task details
├── components/            # Reusable components
│   ├── ui/               # UI components
│   ├── providers/        # Context providers
│   └── settings/         # Settings components
├── constants/            # Constants and configuration
│   ├── api.ts           # API endpoints
│   └── theme.ts         # Colors and styles
├── lib/                 # Utilities and API client
│   ├── api.ts          # API functions
│   └── supabase.ts     # Supabase client (unused)
├── store/              # Zustand store (global state)
├── assets/             # Images and fonts
├── android/            # Native Android code
└── google-services.json # Firebase configuration
```

### 📝 License

MIT License - free to use in commercial and personal projects.

### 🤝 Support

- 📧 Email: nml5222600@mail.ru
- 💬 Telegram: https://t.me/eXLu51ve
- 🐛 Issues: [GitHub Issues](https://github.com/eXLu51ve-gjj/nmlflow-app/issues)

### 🌟 Contributing

We welcome contributions!

1. Fork repository
2. Create branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

<div align="center">

Made with ❤️ by nmL Flow Team

[⭐ Star this repo](https://github.com/eXLu51ve-gjj/nmlflow-app) | [🐛 Report Bug](https://github.com/eXLu51ve-gjj/nmlflow-app/issues) | [💡 Request Feature](https://github.com/eXLu51ve-gjj/nmlflow-app/issues)

</div>
