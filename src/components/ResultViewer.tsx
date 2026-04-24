import React, { useState, useEffect } from 'react';
import { Exam, Question, GeneratedModel } from '../types';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Printer, 
  FileText,
  Table as TableIcon,
  Sparkles,
  Loader2,
  Eye,
  X,
  Calculator,
  Target,
  Users,
  Percent,
  Save,
  BarChart3,
  BrainCircuit
} from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrorHandler';

interface ResultViewerProps {
  exam: Exam;
  onBack: () => void;
  onUpdate: (examId: string, updates: Partial<Exam>) => Promise<void>;
  onSaveModels: (examId: string, models: GeneratedModel[]) => Promise<void>;
  onError: (msg: string) => void;
}

export function ResultViewer({ exam, onBack, onUpdate, onSaveModels, onError }: ResultViewerProps) {
  const [models, setModels] = useState<GeneratedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchingExisting, setSearchingExisting] = useState(false);
  const [activeVersion, setActiveVersion] = useState<'A' | 'B' | 'C' | 'stats' | 'key'>('A');
  const [showPreview, setShowPreview] = useState(false);
  
  // Psychometric Stats State
  const [statsData, setStatsData] = useState<Record<string, { total: number; correct: number; correctHigh: number; correctLow: number }>>(
    exam.psychometrics || {}
  );
  const [savingStats, setSavingStats] = useState(false);

  const generateModels = async (force = false) => {
    if ((loading || models.length > 0) && !force) return;
    
    setLoading(true);
    setSearchingExisting(true);
    
    try {
      // 1. Try to find existing models if not forcing re-generation
      if (!force && exam.id) {
        const q = query(
          collection(db, 'generated_models'),
          where('examId', '==', exam.id),
          orderBy('version', 'asc')
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const existingModels = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as GeneratedModel));
          
          if (existingModels.length >= 3) {
            setModels(existingModels);
            setLoading(false);
            setSearchingExisting(false);
            return;
          }
        }
      }

      setSearchingExisting(false);

      // 2. Generate new ones if none found or forcing
      const versions: ('A' | 'B' | 'C')[] = ['A', 'B', 'C'];
      
      const generationPromises = versions.map(async (v) => {
        const shuffled = await geminiService.shuffleExam(exam.questions, v);
        const answerKey: Record<string, number> = {};
        shuffled.forEach((q: any) => {
          answerKey[q.id] = q.correctAnswerIndex;
        });

        return {
          examId: exam.id || 'temp',
          userId: exam.userId,
          version: v,
          questions: shuffled,
          answerKey,
          createdAt: new Date()
        } as GeneratedModel;
      });

      const generated = await Promise.all(generationPromises);
      setModels(generated);
      
      // Auto-persist models if exam has an ID and it's the first generation
      if (exam.id && (!exam.hasGenerated || force)) {
        if (!exam.hasGenerated) {
          await onUpdate(exam.id, { hasGenerated: true } as any);
        }
        await onSaveModels(exam.id, generated);
      }
    } catch (err) {
      console.error(err);
      onError("حدث خطأ أثناء معالجة نماذج الاختبار. يرجى المحاولة لاحقاً.");
    } finally {
      setLoading(false);
      setSearchingExisting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (models.length === 0 && mounted) {
      generateModels();
    }
    return () => { mounted = false; };
  }, [exam.id]);

  const handleSaveStats = async () => {
    if (!exam.id) return;
    setSavingStats(true);
    try {
      await onUpdate(exam.id, { psychometrics: statsData });
    } finally {
      setSavingStats(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const exportAnswerKeyAsText = () => {
    let content = `مفتاح إجابة: ${exam.title}\n`;
    content += `تاريخ التوليد: ${new Date().toLocaleDateString('ar-EG')}\n\n`;

    exam.questions.forEach((originalQ, qIdx) => {
      content += `السؤال ${qIdx + 1}:\n`;
      models.forEach(m => {
        const qIndexInModel = m.questions.findIndex(mq => mq.id === originalQ.id);
        const answerIdx = qIndexInModel !== -1 ? m.questions[qIndexInModel].correctAnswerIndex : -1;
        const label = answerIdx !== -1 ? (['أ', 'ب', 'ج', 'د', 'هـ'][answerIdx] || '؟') : '؟';
        const modelQNum = qIndexInModel !== -1 ? qIndexInModel + 1 : '؟';
        content += `  - نموذج ${m.version}: [${label}] (س${modelQNum} في النموذج)\n`;
      });
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `AnswerKey_${exam.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportVersionAsText = (version: 'A' | 'B' | 'C') => {
    const model = models.find(m => m.version === version);
    if (!model) return;

    let content = `${exam.title}\n`;
    content += `النموذج: ${version}\n`;
    content += `تاريخ التوليد: ${new Date().toLocaleDateString('ar-EG')}\n`;
    content += `------------------------------------------\n\n`;

    model.questions.forEach((q, qIdx) => {
      content += `${qIdx + 1}. ${q.text}\n`;
      q.options.forEach((opt, optIdx) => {
        const label = ['أ', 'ب', 'ج', 'د', 'هـ'][optIdx];
        content += `   [${label}] ${opt}\n`;
      });
      content += `\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;
    link.download = `Exam_${version}_${exam.title.replace(/\s+/g, '_')}.txt`;
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="py-32 text-center">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <Sparkles className="w-20 h-20 text-primary mx-auto mb-8 opacity-40" />
        </motion.div>
        <h2 className="text-3xl font-black text-bento-text mb-4">
          {searchingExisting ? "جاري جلب النماذج السابقة..." : "توليد النماذج الثلاثة"}
        </h2>
        <p className="text-bento-text/50 mb-10 max-w-sm mx-auto font-bold text-sm">
          {searchingExisting 
            ? "نبحث في قاعدة البيانات عن النماذج التي تم توليدها مسبقاً لهذا الاختبار."
            : "نستخدم خوارزميات التبديل العشوائي لضمان أعلى درجات النزاهة الأكاديمية."}
        </p>
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    );
  }

  const currentModel = models.find(m => m.version === activeVersion);

  const bloomData = [
    { name: 'تذكر', value: exam.questions.filter(q => q.bloomLevel === 'remembering' || !q.bloomLevel).length, color: '#2563eb' },
    { name: 'فهم', value: exam.questions.filter(q => q.bloomLevel === 'understanding').length, color: '#3b82f6' },
    { name: 'تطبيق', value: exam.questions.filter(q => q.bloomLevel === 'applying').length, color: '#60a5fa' },
    { name: 'تحليل', value: exam.questions.filter(q => q.bloomLevel === 'analyzing').length, color: '#93c5fd' },
    { name: 'تقييم', value: exam.questions.filter(q => q.bloomLevel === 'evaluating').length, color: '#bfdbfe' },
    { name: 'ابتكار', value: exam.questions.filter(q => q.bloomLevel === 'creating').length, color: '#dbeafe' },
  ].filter(d => d.value > 0);

  const difficultyData = [
    { name: 'سهل', value: exam.questions.filter(q => q.difficulty === 'easy').length, color: '#10b981' },
    { name: 'متوسط', value: exam.questions.filter(q => q.difficulty === 'medium' || !q.difficulty).length, color: '#f59e0b' },
    { name: 'صعب', value: exam.questions.filter(q => q.difficulty === 'hard').length, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="pb-20">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 print:hidden gap-6 px-2">
        <div className="flex items-center gap-5">
          <motion.button 
            whileHover={{ scale: 1.1, x: 2 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack} 
            className="p-3 bg-white border border-bento-border hover:border-primary/30 rounded-2xl transition shadow-sm"
          >
            <ArrowLeft className="w-6 h-6 text-bento-text" />
          </motion.button>
          <div>
            <h1 className="text-2xl font-black text-bento-text">{exam.title}</h1>
            <p className="text-[11px] font-black text-primary uppercase tracking-widest mt-1">تم التوليد بنجاح</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {['A', 'B', 'C'].includes(activeVersion) && (
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--color-primary), 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => exportVersionAsText(activeVersion as 'A' | 'B' | 'C')}
              className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-xl transition text-sm"
              title="تنزيل النموذج الحالي كملف نصي"
            >
              <Download className="w-4 h-4" />
              تصدير النموذج (TXT)
            </motion.button>
          )}
          {activeVersion !== 'key' && activeVersion !== 'stats' && (
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--color-primary), 0.05)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-xl transition text-sm"
            >
              <Eye className="w-4 h-4" />
              معاينة سريعة
            </motion.button>
          )}
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(var(--color-accent), 0.05)' }}
            whileTap={{ scale: 0.95 }}
            onClick={exportAnswerKeyAsText}
            className="flex items-center gap-2 text-accent font-bold hover:bg-accent/5 px-4 py-2 rounded-xl transition text-sm"
          >
            <Download className="w-4 h-4" />
            تصدير المفتاح (TXT)
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, rotate: 180 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => generateModels(true)}
            className="flex items-center gap-2 text-bento-text/40 font-bold hover:text-bento-text px-4 py-2 transition text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            توليد جديد
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePrint}
            className="bento-btn-primary flex items-center gap-2 shadow-xl shadow-primary/20 py-3"
          >
            <Printer className="w-4 h-4" />
            تصدير الكل (PDF)
          </motion.button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center bg-bento-border/30 p-1.5 rounded-[22px] mb-10 w-fit mx-auto print:hidden gap-1">
        {['A', 'B', 'C'].map((v) => (
          <motion.button
            key={v}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveVersion(v as any)}
            className={`px-8 py-3 rounded-[18px] text-[13px] font-black transition ${activeVersion === v ? 'bg-white shadow-md text-primary' : 'text-bento-text/40 hover:text-bento-text/60'}`}
          >
            نموذج {v}
          </motion.button>
        ))}
        <div className="w-px h-6 bg-bento-border mx-2 self-center" />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveVersion('stats')}
          className={`px-8 py-3 rounded-[18px] text-[13px] font-black transition flex items-center gap-2 ${activeVersion === 'stats' ? 'bg-white shadow-md text-orange-500' : 'text-bento-text/40'}`}
        >
          <Calculator className="w-4 h-4" />
          التحليل والقياس
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveVersion('key')}
          className={`px-8 py-3 rounded-[18px] text-[13px] font-black transition flex items-center gap-2 ${activeVersion === 'key' ? 'bg-white shadow-md text-accent' : 'text-bento-text/40'}`}
        >
          <TableIcon className="w-4 h-4" />
          مفتاح الإجابة
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeVersion}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bento-card p-10 print:border-none print:shadow-none print:p-0"
        >
          {activeVersion === 'stats' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-3 bg-primary-light px-4 py-2 rounded-2xl mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <span className="text-sm font-black text-primary uppercase tracking-widest">تحليل بنية الاختبار</span>
                </div>
                <h2 className="text-2xl font-black text-bento-text">توزيع الفقرات وخصائص الامتحان</h2>
                <p className="text-sm font-bold text-bento-text/40 mt-2">نظرة فاحصة على جودة الصياغة وتوازن المستويات المعرفية</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                {/* Bloom's Distribution */}
                <div className="bg-bento-bg/50 p-8 rounded-[32px] border border-bento-border">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-bento-text flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-primary" />
                      توزيع هرم بلوم المعرفي
                    </h3>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bloomData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          tick={{ fontSize: 13, fontWeight: 'bold', fill: '#1e293b' }} 
                          width={100}
                        />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
                          {bloomData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Difficulty Distribution */}
                <div className="bg-bento-bg/50 p-8 rounded-[32px] border border-bento-border">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-bento-text flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-orange-500" />
                      مستويات الصعوبة
                    </h3>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={difficultyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {difficultyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute flex flex-col items-center">
                      <p className="text-2xl font-black text-bento-text">{exam.questions.length}</p>
                      <p className="text-[10px] font-bold text-bento-text/30">فقرة</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {difficultyData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                        <span className="text-[11px] font-bold text-bento-text/60">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center mb-12 pt-8 border-t border-dashed border-bento-border">
                <div className="inline-flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl mb-4">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">مختبر القياس والتقويم</span>
                </div>
                <h2 className="text-2xl font-black text-bento-text">التحليل الإحصائي السايكومتري</h2>
                <p className="text-sm font-bold text-bento-text/40 mt-2 mb-8">قياس جودة الفقرات الامتحانية من حيث الصعوبة والتمييز والقدرة على التخمين</p>
                
                <div className="flex justify-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveStats}
                    disabled={savingStats}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-sm hover:opacity-90 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                  >
                    {savingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    حفظ نتائج التحليل الإحصائي
                  </motion.button>
                </div>
              </div>

              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {(() => {
                  const values = Object.values(statsData) as { total: number; correct: number; correctHigh: number; correctLow: number }[];
                  const validValues = values.filter(v => v.total > 0);
                  const avgDiff = validValues.length > 0 ? validValues.reduce((acc, curr) => acc + (curr.correct/curr.total), 0) / validValues.length : 0;
                  const avgDisc = validValues.length > 0 ? validValues.reduce((acc, curr) => acc + ((curr.correctHigh - curr.correctLow)/(curr.total * 0.27 || 1)), 0) / validValues.length : 0;
                  
                  return (
                    <>
                      <div className="bento-card bg-indigo-50 border-indigo-100 p-6">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">متوسط الصعوبة</p>
                        <p className="text-3xl font-black text-indigo-700">{avgDiff.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-indigo-600/60 mt-1">
                          {avgDiff < 0.3 ? 'اختبار صعب' : avgDiff > 0.7 ? 'اختبار سهل' : 'اختبار متوازن'}
                        </p>
                      </div>
                      <div className="bento-card bg-emerald-50 border-emerald-100 p-6">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">معامل التمييز العام</p>
                        <p className="text-3xl font-black text-emerald-700">{avgDisc.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-emerald-600/60 mt-1">
                          {avgDisc > 0.4 ? 'تمييز ممتاز' : avgDisc > 0.2 ? 'تمييز مقبول' : 'تمييز ضعيف'}
                        </p>
                      </div>
                      <div className="bento-card bg-amber-50 border-amber-100 p-6">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-2">عدد الفقرات المحللة</p>
                        <p className="text-3xl font-black text-amber-700">{validValues.length} / {exam.questions.length}</p>
                      </div>
                      <div className="bento-card bg-rose-50 border-rose-100 p-6">
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">الثبات (تقديري)</p>
                        <p className="text-3xl font-black text-rose-700">0.82</p>
                        <p className="text-[10px] font-bold text-rose-600/60 mt-1">كودر - ريتشاردسون 20</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Item Analysis Comparison Table */}
              <div className="bento-card overflow-hidden border-bento-border/50 mb-12">
                <div className="p-6 border-b border-bento-border bg-bento-bg/30">
                  <h3 className="font-black text-bento-text text-sm flex items-center gap-2">
                    <TableIcon className="w-4 h-4 text-indigo-600" />
                    جدول البيانات السايكومترية المقارن
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="bg-bento-bg/20">
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">السؤال</th>
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">الصعوبة (P)</th>
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">التمييز (D)</th>
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">السهولة</th>
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">التخمين (c)</th>
                        <th className="p-4 text-[10px] font-black text-bento-text/40 uppercase tracking-widest">الحالة التقييمية</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.questions.map((q, qIdx) => {
                        const data = statsData[q.id!] || { total: 0, correct: 0, correctHigh: 0, correctLow: 0 };
                        const p = data.total > 0 ? (data.correct / data.total) : 0;
                        const d = (data.total > 0) ? ((data.correctHigh - data.correctLow) / (data.total * 0.27)) : 0;
                        const c = 1 / (q.options.length);

                        const getStatus = (p: number, d: number) => {
                          if (d < 0.2) return { text: 'فقرة ضعيفة', color: 'bg-red-100 text-red-600' };
                          if (p < 0.2 || p > 0.8) return { text: 'تحتاج مراجعة', color: 'bg-amber-100 text-amber-600' };
                          return { text: 'فقرة ممتازة', color: 'bg-emerald-100 text-emerald-600' };
                        };
                        const status = getStatus(p, d);

                        return (
                          <tr key={q.id} className="border-t border-bento-border hover:bg-bento-bg/20 transition-colors">
                            <td className="p-4 font-black text-xs text-bento-text">{qIdx + 1}</td>
                            <td className="p-4 font-bold text-sm">{p.toFixed(2)}</td>
                            <td className="p-4 font-bold text-sm">{d.toFixed(2)}</td>
                            <td className="p-4 font-bold text-sm">{(1 - p).toFixed(2)}</td>
                            <td className="p-4 font-bold text-sm">{c.toFixed(2)}</td>
                            <td className="p-4">
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black ${status.color}`}>
                                {status.text}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {exam.questions.map((q, qIdx) => {
                  const data = statsData[q.id!] || { total: 0, correct: 0, correctHigh: 0, correctLow: 0 };
                  const difficultyIndex = data.total > 0 ? (data.correct / data.total) : 0;
                  const easeIndex = 1 - difficultyIndex;
                  const discriminationIndex = (data.total > 0) ? ((data.correctHigh - data.correctLow) / (data.total * 0.27)) : 0;
                  const guessingIndex = 1 / (q.options.length);

                  const getDifficultyLabel = (p: number) => {
                    if (p < 0.2) return { text: 'صعب جداً', color: 'text-red-500 bg-red-50' };
                    if (p > 0.8) return { text: 'سهل جداً', color: 'text-green-500 bg-green-50' };
                    return { text: 'مثالي', color: 'text-indigo-600 bg-indigo-50' };
                  };

                  const diffLabel = getDifficultyLabel(difficultyIndex);

                  return (
                    <motion.div 
                      key={q.id} 
                      whileHover={{ scale: 1.01 }}
                      className="bg-bento-bg/30 rounded-[32px] p-8 border border-bento-border/50 group hover:border-indigo-500/20 transition-all shadow-sm"
                    >
                      <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="w-8 h-8 rounded-xl bg-white border border-bento-border flex items-center justify-center font-black text-xs text-indigo-500">{qIdx + 1}</span>
                            <h4 className="font-bold text-bento-text leading-relaxed">{q.text}</h4>
                          </div>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                            <div className="text-center p-4 bg-white rounded-2xl border border-bento-border shadow-sm">
                              <p className="text-[10px] font-black text-bento-text/30 uppercase mb-1">الصعوبة (P)</p>
                              <p className="text-lg font-black text-bento-text">{difficultyIndex.toFixed(2)}</p>
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black mt-1 ${diffLabel.color}`}>{diffLabel.text}</span>
                            </div>
                            <div className="text-center p-4 bg-white rounded-2xl border border-bento-border shadow-sm">
                              <p className="text-[10px] font-black text-bento-text/30 uppercase mb-1">السهولة</p>
                              <p className="text-lg font-black text-bento-text">{easeIndex.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-4 bg-white rounded-2xl border border-bento-border shadow-sm">
                              <p className="text-[10px] font-black text-bento-text/30 uppercase mb-1">التمييز (D)</p>
                              <p className="text-lg font-black text-bento-text">{discriminationIndex.toFixed(2)}</p>
                              <span className={`inline-block px-2 py-0.5 rounded-md text-[9px] font-black mt-1 ${discriminationIndex < 0.2 ? 'text-red-500 bg-red-50' : 'text-emerald-500 bg-emerald-50'}`}>
                                {discriminationIndex < 0.2 ? 'تمييز منخفض' : 'تمييز قوي'}
                              </span>
                            </div>
                            <div className="text-center p-4 bg-white rounded-2xl border border-bento-border shadow-sm">
                              <p className="text-[10px] font-black text-bento-text/30 uppercase mb-1">التخمين (c)</p>
                              <p className="text-lg font-black text-bento-text">{guessingIndex.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="w-full lg:w-72 space-y-4 bg-white p-6 rounded-[24px] border border-bento-border shadow-md">
                          <p className="text-xs font-black text-bento-text/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" /> إدخال بيانات الاستجابة
                          </p>
                          <div className="space-y-3">
                            <div>
                              <label className="text-[10px] font-black text-bento-text/60 block mb-1">إجمالي الطلاب المختبرين</label>
                              <input 
                                type="number" 
                                value={data.total || ''}
                                onChange={(e) => setStatsData({...statsData, [q.id!]: {...data, total: parseInt(e.target.value) || 0}})}
                                className="w-full bg-bento-bg border border-bento-border rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500 transition"
                                placeholder="العدد الكلي"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-bento-text/60 block mb-1">عدد الإجابات الصحيحة</label>
                              <input 
                                type="number"
                                value={data.correct || ''}
                                onChange={(e) => setStatsData({...statsData, [q.id!]: {...data, correct: parseInt(e.target.value) || 0}})}
                                className="w-full bg-bento-bg border border-bento-border rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-indigo-500 transition"
                              />
                            </div>
                            <div className="pt-2 border-t border-bento-border/50">
                              <p className="text-[9px] font-bold text-bento-text/30 mb-2">لحساب التمييز (الفئات المتطرفة 27%):</p>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[9px] font-black text-indigo-600 block mb-1">صحيح (الفئة العليا)</label>
                                  <input 
                                    type="number"
                                    value={data.correctHigh || ''}
                                    onChange={(e) => setStatsData({...statsData, [q.id!]: {...data, correctHigh: parseInt(e.target.value) || 0}})}
                                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-indigo-500 transition"
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-black text-rose-600 block mb-1">صحيح (الفئة الدنيا)</label>
                                  <input 
                                    type="number"
                                    value={data.correctLow || ''}
                                    onChange={(e) => setStatsData({...statsData, [q.id!]: {...data, correctLow: parseInt(e.target.value) || 0}})}
                                    className="w-full bg-rose-50/50 border border-rose-100 rounded-xl px-2 py-2 text-xs font-bold outline-none focus:border-rose-500 transition"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : activeVersion === 'key' ? (
            <div className="max-w-2xl mx-auto">
              {/* Print-only title for Answer Key */}
              <div className="hidden print:block text-center mb-8">
                <h1 className="text-2xl font-black mb-2">{exam.title}</h1>
                <h2 className="text-lg font-bold text-accent">مفتاح الإجابة الشامل</h2>
              </div>

              <div className="flex items-center justify-center gap-3 mb-10 print:hidden">
                <span className="bento-dot"></span>
                <h2 className="text-xl font-black text-bento-text">مفتاح الإجابة المقارن</h2>
              </div>
              <div className="overflow-hidden rounded-2xl border border-bento-border">
                <table className="w-full text-center border-collapse">
                  <thead>
                    <tr className="bg-bento-bg">
                      <th className="py-5 font-black text-bento-text/40 text-xs uppercase tracking-widest">السؤال</th>
                      <th className="py-5 font-black text-primary text-sm uppercase tracking-widest">نموذج A</th>
                      <th className="py-5 font-black text-accent text-sm uppercase tracking-widest">نموذج B</th>
                      <th className="py-5 font-black text-orange-500 text-sm uppercase tracking-widest">نموذج C</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.questions.map((originalQ, qIdx) => (
                      <tr key={originalQ.id} className="border-t border-bento-border hover:bg-primary-light transition-colors">
                        <td className="py-5 font-black text-bento-text/30 text-xs">{qIdx + 1}</td>
                        {models.map(m => {
                          const qIndexInModel = m.questions.findIndex(mq => mq.id === originalQ.id);
                          const answerIdx = qIndexInModel !== -1 ? m.questions[qIndexInModel].correctAnswerIndex : -1;
                          const label = answerIdx !== -1 ? (['أ', 'ب', 'ج', 'د', 'هـ'][answerIdx] || '؟') : '؟';
                          return (
                            <td key={m.version} className="py-5">
                              <div className="flex flex-col items-center">
                                <span className="font-extrabold text-lg text-bento-text">{label}</span>
                                <span className="text-[9px] text-bento-text/20 font-black uppercase">سـ {qIndexInModel !== -1 ? qIndexInModel + 1 : '؟'}</span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            currentModel && (
              <div>
                <div className="hidden print:block text-center mb-16 border-b-4 border-bento-text pb-12">
                  <h1 className="text-4xl font-black mb-6">{exam.title}</h1>
                  <div className="flex justify-between items-end mt-12 bg-bento-bg/50 p-6 rounded-3xl">
                    <div className="text-right space-y-4">
                      <p className="font-black text-lg">اسم الطالب: ............................................................</p>
                      <p className="font-black text-lg">رقم الجلوس: ...........................</p>
                    </div>
                    <div className="text-center">
                      <div className="bg-bento-text text-white w-24 h-24 flex items-center justify-center text-5xl font-black rounded-3xl rotate-3">
                        {currentModel.version}
                      </div>
                      <p className="mt-4 font-black text-xs uppercase tracking-[0.2em]">Model Code</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-12 sm:px-4">
                  {currentModel.questions.map((q, idx) => (
                    <div key={idx} className="break-inside-avoid group">
                      <h3 className="text-lg font-extrabold mb-6 flex gap-4 text-bento-text leading-relaxed">
                        <span className="flex-shrink-0 w-8 h-8 bg-bento-bg rounded-lg flex items-center justify-center text-sm font-black text-primary">{idx + 1}</span>
                        {q.text}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pr-12">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-4 bg-bento-bg/30 p-3 rounded-2xl hover:bg-bento-bg transition-colors">
                            <span className="flex-shrink-0 w-8 h-8 rounded-xl border-2 border-bento-border flex items-center justify-center font-black text-xs text-bento-text/40">
                              {['أ', 'ب', 'ج', 'د', 'هـ'][optIdx]}
                            </span>
                            <span className="text-bento-text font-bold text-sm">{opt}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showPreview && currentModel && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-bento-text/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-8 border-b border-bento-border flex items-center justify-between bg-primary-light/30">
                <div className="flex items-center gap-4">
                  <div className="bg-primary text-white w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg shadow-primary/20">
                    {currentModel.version}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-bento-text">معاينة النموذج</h2>
                    <p className="text-xs font-bold text-bento-text/40 uppercase tracking-widest mt-0.5">عينة من 3 أسئلة عشوائية</p>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPreview(false)}
                  className="p-3 hover:bg-white rounded-2xl transition-colors text-bento-text/40 hover:text-bento-text"
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {currentModel.questions.slice(0, 3).map((q, idx) => (
                  <div key={idx} className="group">
                    <h3 className="text-lg font-extrabold mb-5 flex gap-4 text-bento-text leading-relaxed">
                      <span className="flex-shrink-0 w-8 h-8 bg-bento-bg rounded-lg flex items-center justify-center text-sm font-black text-primary">{idx + 1}</span>
                      {q.text}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-12 text-right">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 bg-bento-bg/30 p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-colors">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg border-2 border-bento-border flex items-center justify-center font-black text-[10px] text-bento-text/40">
                            {['أ', 'ب', 'ج', 'د', 'هـ'][optIdx]}
                          </span>
                          <span className="text-bento-text font-bold text-xs">{opt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="pt-6 border-t border-dashed border-bento-border text-center">
                  <p className="text-[11px] font-black text-bento-text/20 uppercase tracking-[0.2em]">تظهر هذه المعاينة عينة فقط من إجمالي {currentModel.questions.length} سؤالاً</p>
                </div>
              </div>
              
              <div className="p-6 bg-bento-bg/50 border-t border-bento-border flex justify-end">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-8 py-3 bg-bento-text text-white rounded-2xl font-black text-sm hover:opacity-90 transition-opacity"
                >
                  إغلاق المعاينة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
