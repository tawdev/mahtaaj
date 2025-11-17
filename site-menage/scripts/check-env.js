const fs = require('fs');
const path = require('path');

try {
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

console.log('\n🔍 التحقق من Environment Variables...\n');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.log('⚠️  ملف .env غير موجود!');
  
  // Try to create from .env.example if it exists
  if (fs.existsSync(envExamplePath)) {
    console.log('📋 نسخ من .env.example...');
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ تم إنشاء ملف .env من .env.example');
    console.log('⚠️  تأكد من تحديث القيم في ملف .env قبل البناء للبرودكشن!\n');
  } else {
    console.log('📝 إنشاء ملف .env جديد...');
    const defaultEnv = `# Supabase Configuration
# احصل على هذه القيم من Supabase Dashboard > Settings > API
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
`;
    fs.writeFileSync(envPath, defaultEnv);
    console.log('✅ تم إنشاء ملف .env جديد');
    console.log('⚠️  تأكد من تحديث القيم في ملف .env قبل البناء للبرودكشن!\n');
  }
} else {
  console.log('✅ ملف .env موجود');
  
  // Read and check required variables
  const envContent = fs.readFileSync(envPath, 'utf8');
  const supabaseVars = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY'];
  
  // Check Supabase variables
  console.log('\n🗄️  Supabase Variables:');
  let supabasePresent = true;
  supabaseVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const match = envContent.match(new RegExp(`${varName}=(.+)`));
      if (match && match[1] && !match[1].trim().startsWith('#') && 
          !match[1].includes('your-project') && !match[1].includes('your-anon-key')) {
        console.log(`✅ ${varName} = ${match[1].trim().substring(0, 30)}...`);
      } else {
        console.log(`⚠️  ${varName} غير محدد أو يحتوي على قيم افتراضية`);
        supabasePresent = false;
      }
    } else {
      console.log(`⚠️  ${varName} غير موجود`);
      supabasePresent = false;
    }
  });
  
  if (supabasePresent) {
    console.log('\n✅ Supabase جاهز للاستخدام!\n');
  } else {
    console.log('\n⚠️  Supabase غير مُعد - راجع ENV_SETUP.md لإعداد Supabase\n');
  }
}

console.log('🚀 بدء عملية البناء...\n');
} catch (error) {
  console.error('\n⚠️  خطأ في التحقق من Environment Variables:', error.message);
  console.log('🚀 متابعة البناء على أي حال...\n');
}
