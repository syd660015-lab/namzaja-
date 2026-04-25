# نمذجة | Namzag

تطبيق أكاديمي متطور لتحويل نموذج اختبار واحد إلى نسخ متعددة (A, B, C) بضغطة زر، مع تبديل عشوائي ذكي للأسئلة والخيارات لضمان النزاهة الأكاديمية.

## المميزات
- رفع ملفات PDF, DOCX, TXT.
- تحليل محتوى الاختبار باستخدام الذكاء الاصطناعي (Gemini 2.0).
- توليد 3 نماذج مختلفة فوراً.
- تحليل إحصائي وسايكومتري للفقرات الامتحانية.
- تصدير النتائج بصيغة PDF و TXT.

## متطلبات التشغيل (Vercel)
لنشر التطبيق على Vercel، يرجى التأكد من إضافة المتغيرات البيئية التالية:

| المتغير | الوصف |
| :--- | :--- |
| `GEMINI_API_KEY` | مفتاح API الخاص بـ Google Gemini |
| `APP_URL` | رابط التطبيق الخاص بك |

## التثبيت والتشغيل المحلي
```bash
npm install
npm run dev
```

---

# Namzag | Exam Modeling App

An advanced academic application to transform a single exam model into multiple versions (A, B, C) with a single click, featuring smart randomization of questions and options to ensure academic integrity.

## Features
- Upload PDF, DOCX, and TXT files.
- Analyze exam content using AI (Gemini 2.0).
- Generate 3 different versions instantly.
- Statistical and psychometric analysis of exam items.
- Export results in PDF and TXT formats.

## Deployment Requirements (Vercel)
To deploy this app on Vercel, please ensure you add the following environment variables:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key |
| `APP_URL` | Your application URL |

## Local Installation and Development
```bash
npm install
npm run dev
```
