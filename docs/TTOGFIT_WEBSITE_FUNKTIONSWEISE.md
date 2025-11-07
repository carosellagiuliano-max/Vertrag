---
**Dokument:** TTOGFIT.COM – Website Funktionsweise
**Version:** 1.0.0
**Datum:** 2025-11-07
**Autor:** Beautify Pro GmbH / TTOGFIT.COM Projektteam
**Status:** Aktiv
**Kategorie:** Technische Dokumentation
---

# 🎯 TTOGFIT.COM – Wie die Website funktioniert

> **Eine moderne Personal Training Plattform für Premium Online-Coaching**

---

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [System-Architektur](#system-architektur)
3. [Benutzer-Journey](#benutzer-journey)
4. [Hauptfunktionen](#hauptfunktionen)
5. [Technologie-Stack](#technologie-stack)
6. [Datenfluss](#datenfluss)
7. [Integration & APIs](#integration--apis)

---

## 🌟 Überblick

TTOGFIT.COM ist eine Premium-Personal-Training-Plattform, die traditionelles Coaching mit modernster digitaler Technologie verbindet.

```mermaid
graph LR
    A[👤 Benutzer] --> B[🌐 Website]
    B --> C[📱 Dashboard]
    C --> D[💪 Workouts]
    C --> E[🥗 Ernährung]
    C --> F[📊 Fortschritt]
    
    style A fill:#8B5CF6,color:#fff
    style B fill:#3B82F6,color:#fff
    style C fill:#10B981,color:#fff
    style D fill:#F59E0B,color:#fff
    style E fill:#EF4444,color:#fff
    style F fill:#06B6D4,color:#fff
```

### 🎯 Hauptziele

- **Personalisiertes Coaching** – Individuelle Trainings- und Ernährungspläne
- **24/7 Zugang** – Jederzeit und überall verfügbar
- **Messbare Resultate** – Detailliertes Progress-Tracking
- **Premium Erfahrung** – Erstklassige Benutzeroberfläche

---

## 🏗️ System-Architektur

### High-Level Architektur

```mermaid
graph TB
    subgraph "🌐 Frontend Layer"
        WEB[Next.js Website<br/>React + TypeScript]
        MOBILE[Mobile-Optimiert<br/>Responsive Design]
    end
    
    subgraph "⚙️ Backend Layer"
        API[REST API<br/>Node.js]
        AUTH[Auth Service<br/>Auth0/Clerk]
        PAYMENT[Payment Service<br/>Stripe]
    end
    
    subgraph "💾 Daten Layer"
        DB[(PostgreSQL<br/>Hauptdatenbank)]
        CACHE[(Redis<br/>Cache)]
        FILES[AWS S3<br/>Dateien]
    end
    
    subgraph "🔌 Externe Services"
        COACH[Trainerize/My PT Hub<br/>Coaching App]
        EMAIL[SendGrid<br/>E-Mails]
        ANALYTICS[Plausible<br/>Analytics]
    end
    
    WEB --> API
    MOBILE --> API
    API --> AUTH
    API --> PAYMENT
    API --> DB
    API --> CACHE
    API --> FILES
    API --> COACH
    API --> EMAIL
    WEB --> ANALYTICS
    
    style WEB fill:#3B82F6,color:#fff
    style MOBILE fill:#3B82F6,color:#fff
    style API fill:#10B981,color:#fff
    style AUTH fill:#10B981,color:#fff
    style PAYMENT fill:#10B981,color:#fff
    style DB fill:#F59E0B,color:#fff
    style CACHE fill:#F59E0B,color:#fff
    style FILES fill:#F59E0B,color:#fff
    style COACH fill:#6B7280,color:#fff
    style EMAIL fill:#6B7280,color:#fff
    style ANALYTICS fill:#6B7280,color:#fff
```

### 📦 Komponenten-Übersicht

| Komponente | Technologie | Zweck |
|------------|-------------|-------|
| **Frontend** | Next.js 14+ | Server-Side Rendering, SEO |
| **Backend** | Node.js + Express | REST API, Business Logic |
| **Datenbank** | PostgreSQL | Benutzerdaten, Workouts |
| **Cache** | Redis | Session Management, Performance |
| **Storage** | AWS S3 | Bilder, Videos, Dokumente |
| **Auth** | Auth0/Clerk | Sichere Authentifizierung |
| **Payment** | Stripe | Zahlungsabwicklung |

---

## 👥 Benutzer-Journey

### 1️⃣ Entdeckung & Anmeldung

```mermaid
journey
    title Neue Kunden-Journey
    section Entdeckung
      Website besuchen: 5: Besucher
      Programme ansehen: 4: Besucher
      Preise prüfen: 4: Besucher
    section Interesse
      Kostenlose Beratung buchen: 5: Lead
      E-Mail erhalten: 5: Lead
    section Conversion
      Video-Call mit Coach: 5: Lead
      Programm wählen: 5: Lead
      Bezahlung abschliessen: 5: Kunde
    section Onboarding
      Willkommens-E-Mail: 5: Kunde
      Dashboard-Zugang: 5: Kunde
      Ersten Workout starten: 5: Kunde
```

### 2️⃣ Haupt-Nutzerfluss

```mermaid
flowchart TD
    START([Benutzer öffnet Website]) --> LOGIN{Eingeloggt?}
    
    LOGIN -->|Nein| PUBLIC[Öffentliche Seiten]
    PUBLIC --> HOME[Homepage]
    PUBLIC --> PROGRAMS[Programme]
    PUBLIC --> ABOUT[Über uns]
    PUBLIC --> CONTACT[Kontakt]
    
    LOGIN -->|Ja| DASH[Dashboard]
    
    DASH --> WORKOUTS[💪 Workouts ansehen]
    DASH --> NUTRITION[🥗 Ernährungsplan]
    DASH --> PROGRESS[📊 Fortschritt tracken]
    DASH --> MESSAGES[💬 Nachrichten]
    DASH --> PROFILE[⚙️ Profil]
    
    WORKOUTS --> COMPLETE[Workout abschliessen]
    COMPLETE --> LOG[Fortschritt loggen]
    LOG --> DASH
    
    NUTRITION --> MEALS[Mahlzeiten ansehen]
    MEALS --> TRACK[Makros tracken]
    TRACK --> DASH
    
    PROGRESS --> STATS[Statistiken ansehen]
    STATS --> PHOTOS[Fortschrittsfotos]
    PHOTOS --> DASH
    
    style START fill:#8B5CF6,color:#fff
    style DASH fill:#10B981,color:#fff
    style WORKOUTS fill:#F59E0B,color:#fff
    style NUTRITION fill:#EF4444,color:#fff
    style PROGRESS fill:#06B6D4,color:#fff
```

---

## ⚡ Hauptfunktionen

### 🏠 Homepage

**Zweck:** Erste Anlaufstelle für neue Besucher

```mermaid
graph TB
    HERO[Hero Section<br/>Hauptbotschaft + CTA] --> BENEFITS[Vorteile<br/>3-4 Key Benefits]
    BENEFITS --> PROGRAMS[Programme<br/>Übersicht der Angebote]
    PROGRAMS --> TESTIMONIALS[Testimonials<br/>Erfolgsgeschichten]
    TESTIMONIALS --> COACH[Coach Vorstellung<br/>Alessio Garcia]
    COACH --> CTA[Call-to-Action<br/>Kostenlose Beratung]
    
    style HERO fill:#3B82F6,color:#fff
    style BENEFITS fill:#10B981,color:#fff
    style PROGRAMS fill:#F59E0B,color:#fff
    style TESTIMONIALS fill:#8B5CF6,color:#fff
    style COACH fill:#EC4899,color:#fff
    style CTA fill:#EF4444,color:#fff
```

**Hauptelemente:**
- ✨ Hero-Bereich mit starker Botschaft
- 🎯 Klare Value Proposition
- 📸 Professionelle Bilder & Videos
- 💬 Social Proof (Testimonials)
- 📞 Einfacher Buchungsprozess

---

### 📱 Dashboard (Kundenbereich)

```mermaid
graph LR
    subgraph "Dashboard Hauptnavigation"
        A[📊 Übersicht] --> B[💪 Workouts]
        B --> C[🥗 Ernährung]
        C --> D[📈 Fortschritt]
        D --> E[💬 Nachrichten]
        E --> F[⚙️ Einstellungen]
    end
    
    style A fill:#10B981,color:#fff
    style B fill:#F59E0B,color:#fff
    style C fill:#EF4444,color:#fff
    style D fill:#06B6D4,color:#fff
    style E fill:#8B5CF6,color:#fff
    style F fill:#6B7280,color:#fff
```

#### 💪 Workout-Modul

**Features:**
- Wöchentlicher Trainingsplan
- Video-Anleitungen für jede Übung
- Progress-Tracking (Gewicht, Wiederholungen)
- Timer & Rest-Perioden
- Notizen & Feedback

```mermaid
sequenceDiagram
    participant U as 👤 Benutzer
    participant D as 📱 Dashboard
    participant API as ⚙️ Backend API
    participant T as 🏋️ Trainerize
    
    U->>D: Workout starten
    D->>API: GET /api/workouts/today
    API->>T: Sync Workout-Plan
    T-->>API: Workout-Daten
    API-->>D: Workout anzeigen
    D-->>U: Übungen + Videos
    
    U->>D: Workout abschliessen
    D->>API: POST /api/workouts/complete
    API->>T: Update Progress
    API-->>D: Erfolg
    D-->>U: ✅ Gratulation!
```

#### 🥗 Ernährungs-Modul

**Features:**
- Personalisierter Essensplan
- Makro-Tracking (Protein, Kohlenhydrate, Fette)
- Rezept-Datenbank
- Einkaufslisten
- Wasseraufnahme-Tracker

#### 📈 Fortschritts-Modul

**Features:**
- Gewichtsverlauf (Chart)
- Körpermaße-Tracking
- Fortschrittsfotos (Vorher/Nachher)
- Kraft-Entwicklung
- Wöchentliche Reports

```mermaid
graph TB
    subgraph "📊 Progress Tracking"
        WEIGHT[⚖️ Gewicht<br/>Wöchentlich]
        MEASURES[📏 Körpermaße<br/>Monatlich]
        PHOTOS[📸 Fotos<br/>Monatlich]
        STRENGTH[💪 Kraft<br/>Pro Workout]
    end
    
    WEIGHT --> CHART1[📉 Gewichtskurve]
    MEASURES --> CHART2[📊 Maße-Übersicht]
    PHOTOS --> GALLERY[🖼️ Foto-Galerie]
    STRENGTH --> CHART3[📈 Kraft-Entwicklung]
    
    style WEIGHT fill:#06B6D4,color:#fff
    style MEASURES fill:#10B981,color:#fff
    style PHOTOS fill:#F59E0B,color:#fff
    style STRENGTH fill:#EF4444,color:#fff
```

---

## 🛠️ Technologie-Stack

### Frontend

```mermaid
graph LR
    subgraph "🎨 Frontend Technologies"
        A[Next.js 14+<br/>React Framework] --> B[TypeScript<br/>Type Safety]
        B --> C[Tailwind CSS<br/>Styling]
        C --> D[shadcn/ui<br/>Components]
        D --> E[React Query<br/>Data Fetching]
        E --> F[next-intl<br/>i18n]
    end
    
    style A fill:#000,color:#fff
    style B fill:#3178C6,color:#fff
    style C fill:#06B6D4,color:#fff
    style D fill:#000,color:#fff
    style E fill:#EF4444,color:#fff
    style F fill:#10B981,color:#fff
```

**Hauptmerkmale:**
- ⚡ **Next.js 14+** – Server-Side Rendering für SEO
- 🎯 **TypeScript** – Weniger Fehler, bessere Entwicklererfahrung
- 🎨 **Tailwind CSS** – Utility-First CSS Framework
- 🧩 **shadcn/ui** – Wiederverwendbare UI-Komponenten
- 🔄 **React Query** – Effizientes Daten-Management
- 🌍 **next-intl** – Mehrsprachigkeit (DE, EN, FR, IT)

### Backend

```mermaid
graph TD
    subgraph "⚙️ Backend Technologies"
        A[Node.js<br/>Runtime] --> B[Express<br/>Web Framework]
        B --> C[PostgreSQL<br/>Datenbank]
        C --> D[Prisma<br/>ORM]
        D --> E[Redis<br/>Caching]
        E --> F[JWT<br/>Auth Tokens]
    end
    
    style A fill:#339933,color:#fff
    style B fill:#000,color:#fff
    style C fill:#336791,color:#fff
    style D fill:#2D3748,color:#fff
    style E fill:#DC382D,color:#fff
    style F fill:#000,color:#fff
```

**Hauptmerkmale:**
- 🟢 **Node.js** – JavaScript Runtime
- 🚀 **Express** – Minimalistische Web-Framework
- 🐘 **PostgreSQL** – Relationale Datenbank
- 🔷 **Prisma** – Type-Safe Database Client
- ⚡ **Redis** – In-Memory Caching
- 🔐 **JWT** – Sichere Token-basierte Auth

---

## 🔄 Datenfluss

### Benutzer-Authentifizierung

```mermaid
sequenceDiagram
    participant B as 🌐 Browser
    participant FE as 🎨 Frontend
    participant BE as ⚙️ Backend API
    participant A as 🔐 Auth0
    participant DB as 💾 Database
    
    B->>FE: Benutzer klickt "Login"
    FE->>A: Redirect zu Auth0
    A->>A: Benutzer gibt Credentials ein
    A-->>FE: Redirect mit Code
    FE->>BE: POST /auth/callback + Code
    BE->>A: Validiere Code
    A-->>BE: Access Token + User Info
    BE->>DB: Erstelle/Update User
    DB-->>BE: User-Daten
    BE-->>FE: JWT Token + User Profile
    FE->>FE: Speichere Token (Cookie)
    FE-->>B: ✅ Eingeloggt → Dashboard
```

### Workout-Synchronisation

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant APP as 📱 TTOGFIT App
    participant API as ⚙️ Backend
    participant T as 🏋️ Trainerize
    participant DB as 💾 Database
    
    Note over T: Coach erstellt Workout
    T->>API: Webhook: Workout erstellt
    API->>DB: Speichere Workout
    
    U->>APP: Öffnet Dashboard
    APP->>API: GET /workouts/weekly
    API->>DB: Query Workouts
    DB-->>API: Workout-Daten
    API-->>APP: Workouts + Videos
    
    U->>APP: Workout abschliessen
    APP->>API: POST /workouts/log
    API->>DB: Speichere Progress
    API->>T: Sync zurück zu Trainerize
    T-->>API: ✅ Bestätigung
    API-->>APP: ✅ Gespeichert
    APP-->>U: 🎉 Great Job!
```

### Payment-Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant FE as 🌐 Frontend
    participant BE as ⚙️ Backend
    participant S as 💳 Stripe
    participant DB as 💾 Database
    participant E as 📧 Email
    
    U->>FE: Wählt Programm
    FE->>BE: POST /subscriptions/create
    BE->>S: Create Checkout Session
    S-->>BE: Session URL
    BE-->>FE: Redirect URL
    FE-->>U: Redirect zu Stripe
    
    U->>S: Zahlung eingeben
    S->>S: Prozessiere Zahlung
    S-->>BE: Webhook: Payment Success
    BE->>DB: Erstelle Subscription
    BE->>E: Sende Willkommens-E-Mail
    E-->>U: 📧 Willkommen!
    S-->>U: Redirect zurück
    FE->>BE: GET /subscriptions/status
    BE-->>FE: ✅ Aktiv
    FE-->>U: 🎉 Dashboard-Zugang
```

---

## 🔌 Integration & APIs

### Integrierte Services

```mermaid
graph TB
    subgraph "🌐 TTOGFIT Platform"
        CORE[Core Platform<br/>Next.js + Node.js]
    end
    
    subgraph "🔌 Externe Integrationen"
        direction TB
        TRAIN[Trainerize/My PT Hub<br/>Workout Management]
        PAY[Stripe<br/>Payments]
        EMAIL[SendGrid<br/>Transactional Email]
        MAIL[Mailchimp<br/>Marketing Email]
        CAL[Calendly<br/>Booking]
        ANALYTICS[Plausible<br/>Analytics]
    end
    
    CORE --> TRAIN
    CORE --> PAY
    CORE --> EMAIL
    CORE --> MAIL
    CORE --> CAL
    CORE --> ANALYTICS
    
    style CORE fill:#3B82F6,color:#fff
    style TRAIN fill:#F59E0B,color:#fff
    style PAY fill:#635BFF,color:#fff
    style EMAIL fill:#1A82E2,color:#fff
    style MAIL fill:#FFE01B,color:#000
    style CAL fill:#006BFF,color:#fff
    style ANALYTICS fill:#5850EC,color:#fff
```

### API-Endpunkte (Beispiele)

#### 🔐 Authentifizierung

```
POST   /api/auth/login          - Benutzer-Login
POST   /api/auth/register       - Neuer Benutzer
POST   /api/auth/logout         - Ausloggen
GET    /api/auth/me             - Aktueller Benutzer
```

#### 👤 Benutzer

```
GET    /api/users/:id           - Benutzer-Profil
PATCH  /api/users/:id           - Profil aktualisieren
GET    /api/users/:id/stats     - Benutzer-Statistiken
```

#### 💪 Workouts

```
GET    /api/workouts/weekly     - Wöchentlicher Plan
GET    /api/workouts/:id        - Einzelnes Workout
POST   /api/workouts/:id/log    - Workout loggen
GET    /api/exercises           - Übungs-Bibliothek
```

#### 🥗 Ernährung

```
GET    /api/nutrition/plan      - Aktueller Essensplan
GET    /api/nutrition/recipes   - Rezept-Datenbank
POST   /api/nutrition/log       - Mahlzeit loggen
GET    /api/nutrition/macros    - Makro-Übersicht
```

#### 💳 Subscriptions

```
POST   /api/subscriptions/create    - Neue Subscription
GET    /api/subscriptions/:id       - Subscription-Details
POST   /api/subscriptions/:id/cancel - Kündigen
GET    /api/subscriptions/invoices  - Rechnungen
```

---

## 📊 Performance & Monitoring

### Core Web Vitals Ziele

```mermaid
graph LR
    subgraph "⚡ Performance Metrics"
        A[LCP<br/>Largest Contentful Paint<br/>< 2.5s]
        B[FID<br/>First Input Delay<br/>< 100ms]
        C[CLS<br/>Cumulative Layout Shift<br/>< 0.1]
    end
    
    style A fill:#10B981,color:#fff
    style B fill:#06B6D4,color:#fff
    style C fill:#8B5CF6,color:#fff
```

### Monitoring Tools

| Tool | Zweck | Metriken |
|------|-------|----------|
| **Vercel Analytics** | Performance Tracking | Core Web Vitals, Load Time |
| **Sentry** | Error Tracking | Fehler, Crashes, Performance |
| **Plausible** | Web Analytics | Traffic, Conversions, Privacy-First |
| **LogRocket** | Session Replay | User Behavior, Bugs |
| **UptimeRobot** | Uptime Monitoring | Verfügbarkeit 99.9%+ |

---

## 🔒 Sicherheit

### Sicherheits-Ebenen

```mermaid
graph TB
    subgraph "🛡️ Security Layers"
        A[HTTPS/TLS 1.3<br/>Verschlüsselte Verbindung]
        B[Authentication<br/>Auth0 + MFA]
        C[Authorization<br/>Role-Based Access]
        D[Data Encryption<br/>At Rest + In Transit]
        E[Rate Limiting<br/>DDoS Protection]
        F[Input Validation<br/>XSS/SQL Injection Prevention]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    
    style A fill:#10B981,color:#fff
    style B fill:#06B6D4,color:#fff
    style C fill:#8B5CF6,color:#fff
    style D fill:#F59E0B,color:#fff
    style E fill:#EF4444,color:#fff
    style F fill:#EC4899,color:#fff
```

**Hauptmerkmale:**
- ✅ HTTPS überall (TLS 1.3)
- ✅ Multi-Factor Authentication (MFA)
- ✅ DSGVO/DSG-konform
- ✅ Regular Security Audits
- ✅ Encrypted Data Storage
- ✅ DDoS Protection (Cloudflare)

---

## 🌍 Internationalisierung

Die Website unterstützt mehrere Sprachen:

```mermaid
graph LR
    ROOT[ttogfit.com] --> DE[🇩🇪 Deutsch<br/>ttogfit.com/de]
    ROOT --> EN[🇬🇧 English<br/>ttogfit.com/en]
    ROOT --> FR[🇫🇷 Français<br/>ttogfit.com/fr]
    ROOT --> IT[🇮🇹 Italiano<br/>ttogfit.com/it]
    
    style ROOT fill:#3B82F6,color:#fff
    style DE fill:#10B981,color:#fff
    style EN fill:#F59E0B,color:#fff
    style FR fill:#EF4444,color:#fff
    style IT fill:#06B6D4,color:#fff
```

**Features:**
- Automatische Spracherkennung (Browser-Sprache)
- URL-basiertes Routing (`/de`, `/en`, `/fr`, `/it`)
- Lokalisierte Inhalte (Texte, Bilder, Videos)
- Währungsumrechnung (CHF, EUR, GBP, USD)
- Zeitzone-Anpassung für Buchungen

---

## 📱 Responsive Design

Die Website funktioniert perfekt auf allen Geräten:

```mermaid
graph LR
    subgraph "📱 Device Support"
        A[📱 Mobile<br/>320px - 767px] --> B[📱 Tablet<br/>768px - 1023px]
        B --> C[💻 Desktop<br/>1024px - 1439px]
        C --> D[🖥️ Large Desktop<br/>1440px+]
    end
    
    style A fill:#EF4444,color:#fff
    style B fill:#F59E0B,color:#fff
    style C fill:#10B981,color:#fff
    style D fill:#06B6D4,color:#fff
```

**Mobile-First Approach:**
- ✅ Touch-optimierte Buttons
- ✅ Swipe-Navigation
- ✅ Optimierte Bildgrößen
- ✅ Progressive Web App (PWA)
- ✅ Offline-Funktionalität (teilweise)

---

## 🚀 Deployment & Hosting

### Deployment-Pipeline

```mermaid
graph LR
    A[👨‍💻 Developer<br/>Code Push] --> B[GitHub<br/>Repository]
    B --> C[GitHub Actions<br/>CI/CD]
    C --> D{Tests<br/>Pass?}
    D -->|❌ Nein| E[❌ Deployment<br/>Abgebrochen]
    D -->|✅ Ja| F[Vercel<br/>Build]
    F --> G[Preview<br/>Deployment]
    G --> H{Approval?}
    H -->|❌ Nein| E
    H -->|✅ Ja| I[🚀 Production<br/>Deployment]
    I --> J[✅ Live auf<br/>ttogfit.com]
    
    style A fill:#8B5CF6,color:#fff
    style B fill:#181717,color:#fff
    style C fill:#2088FF,color:#fff
    style D fill:#F59E0B,color:#fff
    style F fill:#000,color:#fff
    style I fill:#10B981,color:#fff
    style J fill:#3B82F6,color:#fff
```

**Hosting-Infrastruktur:**
- **Frontend:** Vercel (Global CDN)
- **Backend:** Railway / AWS ECS
- **Datenbank:** AWS RDS (PostgreSQL)
- **Cache:** Redis Cloud
- **Storage:** AWS S3 / Cloudflare R2
- **CDN:** Cloudflare

---

## 📈 Analytics & Tracking

### Tracking-Events

```mermaid
graph TD
    USER[👤 Benutzer-Aktion] --> EVENT{Event-Typ}
    
    EVENT --> PAGE[📄 Pageview]
    EVENT --> CLICK[🖱️ Button Click]
    EVENT --> FORM[📝 Form Submit]
    EVENT --> CONVERSION[💰 Conversion]
    
    PAGE --> ANALYTICS[Plausible Analytics]
    CLICK --> ANALYTICS
    FORM --> ANALYTICS
    CONVERSION --> ANALYTICS
    
    ANALYTICS --> DASHBOARD[📊 Analytics Dashboard]
    
    style USER fill:#8B5CF6,color:#fff
    style EVENT fill:#3B82F6,color:#fff
    style ANALYTICS fill:#5850EC,color:#fff
    style DASHBOARD fill:#10B981,color:#fff
```

**Getrackte Metriken:**
- 📄 Seitenaufrufe
- 👥 Unique Visitors
- ⏱️ Session-Dauer
- 📊 Conversion-Rate
- 🚀 Bounce-Rate
- 🎯 Goal-Completions

**Privacy-First:**
- ✅ Kein Google Analytics
- ✅ Keine invasiven Cookies
- ✅ DSGVO-konform
- ✅ Anonymisierte Daten

---

## 🎨 Design-System

### Farbpalette

```mermaid
graph LR
    subgraph "🎨 Brand Colors"
        PRIMARY[Primary<br/>#3B82F6<br/>Blau]
        SECONDARY[Secondary<br/>#10B981<br/>Grün]
        ACCENT[Accent<br/>#F59E0B<br/>Orange]
        ERROR[Error<br/>#EF4444<br/>Rot]
        SUCCESS[Success<br/>#10B981<br/>Grün]
    end
    
    style PRIMARY fill:#3B82F6,color:#fff
    style SECONDARY fill:#10B981,color:#fff
    style ACCENT fill:#F59E0B,color:#fff
    style ERROR fill:#EF4444,color:#fff
    style SUCCESS fill:#10B981,color:#fff
```

### Typografie

- **Headings:** Inter (Bold, 700)
- **Body:** Inter (Regular, 400)
- **Code:** Fira Code (Mono)

### Komponenten-Bibliothek

Basierend auf **shadcn/ui**:
- Buttons
- Forms (Input, Select, Checkbox)
- Cards
- Modal Dialogs
- Tables
- Charts
- Navigation
- Alerts & Notifications

---

## ✅ Qualitätsstandards

### Testing

```mermaid
graph TB
    subgraph "🧪 Testing Pyramid"
        A[Unit Tests<br/>Jest + React Testing Library<br/>70%]
        B[Integration Tests<br/>Playwright<br/>20%]
        C[E2E Tests<br/>Playwright<br/>10%]
    end
    
    C --> B
    B --> A
    
    style A fill:#10B981,color:#fff
    style B fill:#3B82F6,color:#fff
    style C fill:#F59E0B,color:#fff
```

**Testabdeckung:**
- ✅ Unit Tests: >80%
- ✅ Integration Tests: Kritische Flows
- ✅ E2E Tests: User Journeys
- ✅ Performance Tests: Load Testing
- ✅ Security Tests: Penetration Testing

### Code Quality

- ✅ **TypeScript** – Type Safety
- ✅ **ESLint** – Code Linting
- ✅ **Prettier** – Code Formatting
- ✅ **Husky** – Git Hooks
- ✅ **Conventional Commits** – Commit Messages

---

## 🔮 Roadmap

### Phase 1: MVP (3 Monate)
- ✅ Website Launch
- ✅ 1:1 Coaching Modul
- ✅ Payment Integration
- ✅ Basic Dashboard

### Phase 2: Erweiterung (6 Monate)
- 🔄 Gruppenprogramme
- 🔄 Mobile App (React Native)
- 🔄 Community Features
- 🔄 Video-Library

### Phase 3: Skalierung (12 Monate)
- 📅 AI-basierte Empfehlungen
- 📅 Corporate Wellness Packages
- 📅 Internationale Expansion
- 📅 Partner-Programm

---

## 📞 Support & Kontakt

**Technischer Support:**
- 📧 E-Mail: support@ttogfit.com
- 💬 Live-Chat: Auf der Website
- 📚 Hilfe-Center: ttogfit.com/help

**Business Kontakt:**
- 📧 E-Mail: alessio@ttogfit.com
- 🌐 Website: ttogfit.com
- 📱 Social Media: @ttogfit

---

## 📚 Zusätzliche Ressourcen

- [📖 API-Dokumentation](docs/technical/API_SPECIFICATIONS.md)
- [🎨 Design-System](docs/ux-design/DESIGN_SYSTEM.md)
- [🔒 Sicherheits-Leitfaden](docs/compliance/SECURITY_PRIVACY_BRIEF.md)
- [📊 Analytics-Dashboard](#)

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 2025-11-07  
**Nächste Review:** 2026-02-07

---

**© 2025 TTOGFIT.COM – Premium Personal Training**