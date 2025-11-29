-- RLS ni o'chirish va qayta sozlash
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

-- Yoki RLS yoqiq bo'lsa, policy qo'shish:
-- ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Eski policylarni o'chirish
DROP POLICY IF EXISTS "Allow public read" ON chat_messages;
DROP POLICY IF EXISTS "Allow public insert" ON chat_messages;
DROP POLICY IF EXISTS "Allow public update" ON chat_messages;
DROP POLICY IF EXISTS "Allow public delete" ON chat_messages;

-- Yangi policylar
CREATE POLICY "Allow public read" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON chat_messages FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON chat_messages FOR DELETE USING (true);
