/**
 * ملف Supabase البسيط
 * 
 * هذا الملف يربط React مع Supabase
 * استخدمه في أي مكان: import { supabase } from './lib/supabase'
 * 
 * ✅ تم الإعداد تلقائياً - جاهز للاستخدام!
 */

import { createClient } from '@supabase/supabase-js'

// الحصول على المفاتيح من ملف .env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://xcsfqzeyooncpqbcqihm.supabase.co'
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjc2ZxemV5b29uY3BxYmNxaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MjIyNTcsImV4cCI6MjA3ODA5ODI1N30.3K1Jjv05s7zfsAvo7GUYEHJRgcjtQooT0htM1wvOIs8'

// التحقق من وجود المفاتيح
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ خطأ: يرجى إضافة REACT_APP_SUPABASE_URL و REACT_APP_SUPABASE_ANON_KEY في ملف .env')
} else {
  console.log('✅ Supabase جاهز للاستخدام!')
}

// إنشاء Supabase Client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// تصدير للاستخدام في أي مكان
export default supabase
