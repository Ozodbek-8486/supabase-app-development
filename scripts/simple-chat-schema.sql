-- =============================================
-- ODDIY REAL-TIME CHAT DATABASE SCHEMA
-- Supabase Dashboard -> SQL Editor da ishga tushiring
-- =============================================

-- Xabarlar jadvali
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indeks (tezroq qidiruv uchun)
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at 
ON public.chat_messages(created_at DESC);

-- RLS o'chirish (hamma yoza oladi va o'qiy oladi)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Hamma o'qiy oladi
CREATE POLICY "Hamma xabarlarni ko'radi" ON public.chat_messages
    FOR SELECT USING (true);

-- Hamma yozishi mumkin
CREATE POLICY "Hamma xabar yozishi mumkin" ON public.chat_messages
    FOR INSERT WITH CHECK (true);

-- Realtime yoqish
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
