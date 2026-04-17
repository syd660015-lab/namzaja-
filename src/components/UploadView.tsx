import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, ArrowRight, Loader2, FileText, Info, ShieldCheck, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fileService } from '../lib/fileService';
import { geminiService } from '../services/geminiService';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
}

function Tooltip({ children, content }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-bento-text text-white text-[12px] font-medium rounded-xl shadow-xl leading-relaxed text-right"
          >
            {content.split('\\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-bento-text" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface UploadViewProps {
  onParsed: (data: any) => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}

export function UploadView({ onParsed, onCancel, onError }: UploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [step, setStep] = useState<'upload' | 'pasting'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  } as any);

  const handleProcess = async () => {
    setParsing(true);
    try {
      let text = '';
      if (step === 'upload' && file) {
        text = await fileService.extractText(file);
      } else {
        text = pastedText;
      }

      const parsedData = await geminiService.parseExamText(text);
      onParsed(parsedData);
    } catch (err) {
      console.error(err);
      onError("فشل تحليل الاختبار. يرجى التأكد من تنسيق الملف.");
    } finally {
      setParsing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in zoom-in duration-300">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-bento-text">إدخال النسخة الأصلية</h1>
        <button onClick={onCancel} className="text-bento-text/50 hover:text-bento-text font-bold text-sm">إلغاء</button>
      </div>

      <div className="bento-card p-8">
        <p className="text-[13px] text-bento-text/50 mb-8">اختر الطريقة المناسبة لرفع اختبارك الأساسي للبدء بالتحويل الذكي.</p>
        
        <div className="flex p-1 bg-bento-bg rounded-2xl mb-8">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('upload')}
            className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition ${step === 'upload' ? 'bg-white shadow-sm text-primary' : 'text-bento-text/40'}`}
          >
            رفع ملف ذكي
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep('pasting')}
            className={`flex-1 py-3 rounded-xl text-sm font-extrabold transition ${step === 'pasting' ? 'bg-white shadow-sm text-primary' : 'text-bento-text/40'}`}
          >
            لصق النص المباشر
          </motion.button>
        </div>

        {step === 'upload' ? (
          <motion.div 
            {...getRootProps()} 
            whileHover={{ scale: 1.01, borderColor: 'var(--color-primary)' }}
            whileTap={{ scale: 0.99 }}
            className={`border-2 border-dashed rounded-[20px] py-16 px-6 text-center cursor-pointer transition ${isDragActive ? 'border-primary bg-primary-light' : 'border-bento-border hover:border-primary/50'}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex flex-col items-center">
                <div className="bg-accent/10 p-4 rounded-2xl mb-4">
                  <File className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-extrabold text-bento-text mb-1">{file.name}</h3>
                <p className="text-bento-text/40 text-[11px] uppercase font-bold tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="mt-6 text-red-500 text-xs font-black uppercase tracking-tighter flex items-center gap-1 hover:underline"
                >
                  حذف الملف والبدء من جديد
                </motion.button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-primary-light p-5 rounded-2xl mb-5">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-extrabold text-bento-text mb-2 text-lg">ألقِ الملف هنا</h3>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <p className="text-bento-text/40 text-[13px]">يدعم التنسيقات الأكاديمية القياسية</p>
                  <Tooltip content="• PDF: يضمن دقة عالية في تنسيق الأسئلة.\n• DOCX: التنسيق القياسي، مثالي للتحليل.\n• TXT: بسيط وسريع للتحويل المباشر.">
                    <Info className="w-4 h-4 text-primary cursor-help opacity-40 hover:opacity-100 transition" />
                  </Tooltip>
                </div>
                <span className="bento-btn-primary">تصفح ملفاتك</span>
              </div>
            )}
          </motion.div>
        ) : (
          <textarea 
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="انسخ نص الامتحان هنا (الأسئلة والخيارات)..."
            className="w-full h-72 p-5 border border-bento-border rounded-[20px] focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none resize-none transition text-sm leading-relaxed"
          />
        )}

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProcess}
          disabled={parsing || (step === 'upload' && !file) || (step === 'pasting' && !pastedText)}
          className="w-full mt-10 bento-btn-primary py-5 rounded-[20px] text-lg flex items-center justify-center gap-3 transition"
        >
          {parsing ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              جاري تحليل المحتوى بالذكاء الاصطناعي...
            </>
          ) : (
            <>
              البدء في التصميم
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </motion.button>

        <div className="mt-8 border-t border-bento-border/40 pt-6">
          <button 
            onClick={() => setShowPrivacy(!showPrivacy)}
            className="flex items-center gap-2 text-[12px] font-bold text-bento-text/30 hover:text-primary transition-colors group mx-auto"
          >
            <ShieldCheck className="w-4 h-4 text-accent" />
            كيف نستخدم بياناتك؟ الأمان والخصوصية
            <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${showPrivacy ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showPrivacy && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-5 bg-bento-bg rounded-2xl text-[12px] leading-relaxed text-bento-text/60 space-y-3">
                  <div className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <p>تتم معالجة بياناتك حصرياً لغرض توليد النماذج المطلوبة، ولا يتم تخزين النصوص الأصلية لأغراض التدريب العام للنماذج.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <p>نستخدم تقنيات Google Gemini API المتقدمة عبر قنوات مشفرة لضمان سرية محتوى اختباراتك.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />
                    <p>أنت تملك كامل الحقوق الفكرية لمحتوى اختبارك، والتطبيق يعمل كأداة مساعد ذكي فقط.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
