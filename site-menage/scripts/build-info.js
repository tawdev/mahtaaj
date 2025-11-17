const fs = require('fs');
const path = require('path');

try {
console.log('\n📦 معلومات البناء:\n');

const buildPath = path.join(__dirname, '..', 'build');

if (fs.existsSync(buildPath)) {
  console.log('✅ تم إنشاء مجلد build بنجاح!');
  
  // Get build folder size
  const getSize = (dirPath) => {
    let totalSize = 0;
    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        totalSize += getSize(filePath);
      } else {
        totalSize += stat.size;
      }
    });
    
    return totalSize;
  };
  
  const sizeInBytes = getSize(buildPath);
  const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(2);
  
  console.log(`📊 حجم المجلد: ${sizeInMB} MB`);
  
  // Check main files
  const mainFiles = ['index.html', 'static'];
  console.log('\n📁 الملفات الرئيسية:');
  mainFiles.forEach(file => {
    const filePath = path.join(buildPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`   ✅ ${file}`);
    } else {
      console.log(`   ❌ ${file} - مفقود!`);
    }
  });
  
  console.log('\n🎉 البناء مكتمل! المشروع جاهز للرفع على السيرفر.\n');
  console.log('📤 يمكنك الآن رفع محتوى مجلد build على السيرفر.\n');
} else {
  console.log('❌ مجلد build غير موجود! حدث خطأ في البناء.\n');
  process.exit(1);
}
} catch (error) {
  console.error('\n⚠️  خطأ في عرض معلومات البناء:', error.message);
}

