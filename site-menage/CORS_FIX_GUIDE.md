# دليل إصلاح مشكلة CORS في Supabase

## المشكلة
```
Access to fetch at 'https://xcsfqzeyooncpqbcqihm.supabase.co/rest/v1/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## الحلول المطلوبة

### الحل 1: تنفيذ SQL Script لإصلاح RLS Policies

1. افتح **Supabase Dashboard**
2. اذهب إلى **SQL Editor**
3. انسخ محتوى ملف `sql/fix_cors_rls_policies.sql`
4. نفذ السكريبت

هذا السكريبت سيقوم بـ:
- تفعيل RLS على جميع الجداول
- إنشاء policies للقراءة العامة لجميع الجداول
- السماح بالوصول العام للقراءة

### الحل 2: التحقق من إعدادات Supabase Dashboard

1. اذهب إلى **Settings** → **API**
2. تأكد من أن **CORS** مفعل
3. تأكد من أن **anon key** صحيح

### الحل 3: التحقق من ملف .env

تأكد من أن ملف `.env` يحتوي على:
```env
REACT_APP_SUPABASE_URL=https://xcsfqzeyooncpqbcqihm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

### الحل 4: إعادة تشغيل التطبيق

بعد تنفيذ SQL script:
```bash
# أوقف السيرفر (Ctrl+C)
# ثم أعد تشغيله
npm start
```

### الحل 5: التحقق من RLS Policies يدوياً

1. اذهب إلى **Authentication** → **Policies**
2. تأكد من وجود policies للقراءة العامة على جميع الجداول:
   - `menage`
   - `types_menage`
   - `category_gallery`
   - `gallery`
   - `ratings`
   - `services`

### الحل 6: استخدام Service Role Key (للاختبار فقط)

⚠️ **تحذير**: هذا الحل للاختبار فقط، لا تستخدمه في الإنتاج!

إذا استمرت المشكلة، يمكنك استخدام **Service Role Key** بدلاً من **Anon Key** للاختبار:
1. اذهب إلى **Settings** → **API**
2. انسخ **Service Role Key**
3. استخدمه في ملف `.env` مؤقتاً للاختبار

## ملاحظات مهمة

- Supabase يدعم CORS تلقائياً، لكن RLS policies قد تمنع الوصول
- بعد تنفيذ SQL script، يجب أن تعمل جميع الجداول
- إذا استمرت المشكلة، تحقق من إعدادات Supabase Dashboard

## الملفات المطلوبة

- `sql/fix_cors_rls_policies.sql` - SQL script لإصلاح RLS policies
- `src/lib/supabase.js` - ملف Supabase client (تم تحديثه)

## الدعم

إذا استمرت المشكلة بعد تطبيق جميع الحلول:
1. تحقق من إعدادات Supabase Dashboard
2. تحقق من أن المفاتيح صحيحة
3. تحقق من أن RLS policies موجودة ومفعّلة

