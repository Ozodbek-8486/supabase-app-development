-- =============================================
-- SUPABASE REAL-TIME CHAT DATABASE SCHEMA
-- =============================================

-- 1. Foydalanuvchilar profili jadvali
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat xonalari jadvali
CREATE TABLE IF NOT EXISTS public.chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Xona a'zolari jadvali
CREATE TABLE IF NOT EXISTS public.room_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

-- 4. Xabarlar jadvali
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    is_edited BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Xabar o'qilganligi jadvali
CREATE TABLE IF NOT EXISTS public.message_reads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- 6. Direct Messages (Shaxsiy xabarlar)
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    file_url TEXT,
    file_name TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEKSLAR (Tezroq qidiruv uchun)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Profiles uchun RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles hamma ko'ra oladi" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Foydalanuvchi o'z profilini yangilashi mumkin" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Foydalanuvchi o'z profilini yaratishi mumkin" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Chat rooms uchun RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ommaviy xonalarni hamma ko'radi" ON public.chat_rooms
    FOR SELECT USING (NOT is_private OR EXISTS (
        SELECT 1 FROM public.room_members WHERE room_id = id AND user_id = auth.uid()
    ));

CREATE POLICY "Autentifikatsiya qilingan foydalanuvchi xona yaratishi mumkin" ON public.chat_rooms
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admin xonani yangilashi mumkin" ON public.chat_rooms
    FOR UPDATE USING (created_by = auth.uid());

-- Room members uchun RLS
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Xona a'zolarini ko'rish" ON public.room_members
    FOR SELECT USING (true);

CREATE POLICY "Xonaga qo'shilish" ON public.room_members
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Xonadan chiqish" ON public.room_members
    FOR DELETE USING (user_id = auth.uid());

-- Messages uchun RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Xona a'zolari xabarlarni ko'radi" ON public.messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
    ));

CREATE POLICY "Xona a'zolari xabar yuborishi mumkin" ON public.messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.room_members WHERE room_id = messages.room_id AND user_id = auth.uid()
    ) AND user_id = auth.uid());

CREATE POLICY "Foydalanuvchi o'z xabarini tahrirlashi mumkin" ON public.messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Foydalanuvchi o'z xabarini o'chirishi mumkin" ON public.messages
    FOR DELETE USING (user_id = auth.uid());

-- Direct messages uchun RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shaxsiy xabarlarni ko'rish" ON public.direct_messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Shaxsiy xabar yuborish" ON public.direct_messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "O'z xabarini o'chirish" ON public.direct_messages
    FOR DELETE USING (sender_id = auth.uid());

-- =============================================
-- REALTIME YOQISH
-- =============================================

-- Xabarlar uchun realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- =============================================
-- TRIGGERLAR (Avtomatik yangilanish)
-- =============================================

-- Updated_at avtomatik yangilash funksiyasi
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Profiles trigger
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Messages trigger
CREATE TRIGGER on_messages_updated
    BEFORE UPDATE ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Chat rooms trigger
CREATE TRIGGER on_chat_rooms_updated
    BEFORE UPDATE ON public.chat_rooms
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================
-- YANGI FOYDALANUVCHI RO'YXATDAN O'TGANDA PROFIL YARATISH
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STORAGE BUCKET (Fayl yuklash uchun)
-- =============================================

-- Chat fayllar uchun bucket yaratish (Supabase Dashboard orqali yoki SQL)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Autentifikatsiya qilingan foydalanuvchi fayl yuklashi mumkin"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Hamma fayllarni ko'rishi mumkin"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');

CREATE POLICY "Foydalanuvchi o'z faylini o'chirishi mumkin"
ON storage.objects FOR DELETE
USING (bucket_id = 'chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);
