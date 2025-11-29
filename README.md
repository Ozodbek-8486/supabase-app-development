# 💬 Supabase Real-Time Chat Ilovasi

Next.js 16 va Supabase yordamida qurilgan to'liq funksional real-time chat ilovasi.

## ✨ Xususiyatlar


### 💬 Real-Time Chat
- Haqiqiy vaqtda xabar almashish
- Xonalar (rooms) tizimi
- Ommaviy va maxfiy xonalar
- Xabarlarni tahrirlash va o'chirish
- Typing indicator (yozmoqda...)


### 👥 Foydalanuvchi Profili
- Profil rasmi
- Foydalanuvchi nomi
- Online/Offline holati
- Oxirgi ko'rilgan vaqt

## 🚀 O'rnatish

### 1. Supabase Loyiha Yaratish

1. [supabase.com](https://supabase.com) ga o'ting
2. Yangi loyiha yarating
3. Project Settings -> API dan quyidagilarni oling:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Database Schema O'rnatish

Supabase Dashboard -> SQL Editor ga o'ting va `scripts/supabase-schema.sql` faylini ishga tushiring.

### 3. OAuth Sozlash (Ixtiyoriy)

#### Google OAuth:
1. [Google Cloud Console](https://console.cloud.google.com) ga o'ting
2. OAuth 2.0 Client ID yarating
3. Supabase Dashboard -> Authentication -> Providers -> Google
4. Client ID va Secret ni kiriting
5. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### GitHub OAuth:
1. [GitHub Developer Settings](https://github.com/settings/developers) ga o'ting
2. New OAuth App yarating
3. Supabase Dashboard -> Authentication -> Providers -> GitHub
4. Client ID va Secret ni kiriting
5. Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Environment Variables

`.env.example` faylini `.env.local` ga nusxalang:

```bash
cp .env.example .env.local
```

Keyin o'z qiymatlaringizni kiriting.

### 5. Dependencies O'rnatish

```bash
npm install
# yoki
pnpm install
# yoki
yarn install
```

### 6. Development Server

```bash
npm run dev
# yoki
pnpm dev
```

Brauzerda [http://localhost:3000](http://localhost:3000) ni oching.

## 📂 Loyiha Strukturasi

```
├── app/
│   ├── auth/
│   │   ├── callback/        # OAuth callback
│   │   ├── login/           # Kirish sahifasi
│   │   ├── sign-up/         # Ro'yxatdan o'tish
│   │   └── sign-up-success/ # Muvaffaqiyatli ro'yxatdan o'tish
│   └── chat/                # Asosiy chat sahifasi
├── components/
│   ├── chat/
│   │   ├── chat-header.tsx     # Xona sarlavhasi
│   │   ├── chat-input.tsx      # Xabar yozish
│   │   ├── chat-messages.tsx   # Xabarlar ro'yxati
│   │   ├── chat-sidebar.tsx    # Xonalar paneli
│   │   └── typing-indicator.tsx # Yozmoqda...
│   └── ui/                  # UI komponentlari (shadcn/ui)
├── hooks/
│   ├── use-chat.ts          # Chat hooklari
│   └── use-file-upload.ts   # Fayl yuklash hook
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Auth middleware
│   └── types/
│       └── database.ts      # TypeScript tiplar
├── scripts/
│   └── supabase-schema.sql  # Database schema
└── middleware.ts            # Next.js middleware
```

## 🔧 Texnologiyalar

- **Next.js 16** - React framework
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Storage
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI komponentlari
- **TypeScript** - Type safety
- **date-fns** - Sana formatlash

## 📱 Sahifalar

| Sahifa | Yo'l | Tavsif |
|--------|------|--------|
| Kirish | `/auth/login` | Email/parol yoki OAuth |
| Ro'yxatdan o'tish | `/auth/sign-up` | Yangi hisob yaratish |
| Chat | `/chat` | Asosiy chat interfeysi |
| Profil | `/profile` | Foydalanuvchi profili |

## 🔒 Xavfsizlik

- Row Level Security (RLS) yoqilgan
- Foydalanuvchilar faqat o'z ma'lumotlarini ko'ra oladi
- Xona a'zolari faqat o'z xonalarining xabarlarini ko'radi
- Tokenlar xavfsiz saqlanadi

## 📝 Litsenziya

MIT

---

Muallif: Supabase Chat Team
