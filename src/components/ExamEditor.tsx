import React, { useState } from 'react';
import { Exam, Question, Difficulty, BloomLevel } from '../types';
import { Save, Sparkles, Trash2, Plus, GripVertical, CheckCircle2, BarChart3, BrainCircuit, Info, X, AlertTriangle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'motion/react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
}

function Tooltip({ children, content }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 bottom-full right-0 mb-3 w-80 p-5 bg-white border border-bento-border text-bento-text rounded-[24px] shadow-2xl overflow-hidden"
          >
            <div className="relative z-10">
              {content}
            </div>
            <div className="absolute top-full right-6 -translate-y-1/2 w-4 h-4 bg-white border-r border-b border-bento-border rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExamEditorProps {
  exam: Exam;
  onSave: (exam: Partial<Exam>) => Promise<any>;
  onCancel: () => void;
  onGenerate: (exam: Exam) => void;
  onError: (msg: string) => void;
}

export function ExamEditor({ exam, onSave, onCancel, onGenerate, onError }: ExamEditorProps) {
  const [title, setTitle] = useState(exam.title);
  const [subject, setSubject] = useState(exam.subject || '');
  const generateId = () => {
    return `q-${Math.random().toString(36).substring(2, 11)}-${Date.now()}`;
  };

  const [questions, setQuestions] = useState<Question[]>(
    exam.questions.map((q, i) => q.id ? q : { ...q, id: generateId() })
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showTips, setShowTips] = useState(true);

  const addQuestion = () => {
    setHasChanges(true);
    const newQ: Question = {
      id: generateId(),
      text: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0
    };
    setQuestions([...questions, newQ]);
  };

  const removeQuestion = (id: string) => {
    setHasChanges(true);
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setHasChanges(true);
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const updateOption = (qId: string, optIdx: number, val: string) => {
    setHasChanges(true);
    setQuestions(questions.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ title, subject, questions });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (hasChanges) {
      setShowConfirmCancel(true);
    } else {
      onCancel();
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 px-2 gap-4">
        <div className="flex-1 w-full space-y-2">
          <input 
            value={title}
            onChange={(e) => { setTitle(e.target.value); setHasChanges(true); }}
            className="text-2xl font-extrabold bg-transparent border-b-2 border-transparent hover:border-bento-border focus:border-primary outline-none w-full py-1 transition text-bento-text"
            placeholder="عنوان الاختبار..."
          />
          <input 
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setHasChanges(true); }}
            className="text-sm font-bold bg-transparent border-b border-transparent hover:border-bento-border focus:border-primary outline-none w-full py-1 transition text-bento-text/50"
            placeholder="اسم المادة (اختياري)..."
          />
        </div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancelClick}
            className="text-bento-text/50 font-bold hover:text-bento-text px-3 py-2 rounded-xl transition text-sm"
          >
            إلغاء
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="bg-white border border-bento-border text-bento-text px-5 py-2 rounded-xl font-bold hover:bg-white hover:border-primary/50 transition flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            حفظ
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onGenerate({ ...exam, title, questions })}
            className="bento-btn-primary flex items-center gap-2 text-sm shadow-lg shadow-primary/20"
          >
            <Sparkles className="w-4 h-4" />
            توليد النماذج
          </motion.button>
        </div>
      </div>

      <div className="space-y-6">
        <motion.div 
          initial={false}
          animate={{ height: showTips ? 'auto' : '52px' }}
          className="bento-card overflow-hidden transition-all duration-300 border-primary/20 bg-primary/5"
        >
          <button 
            onClick={() => setShowTips(!showTips)}
            className="w-full flex items-center justify-between p-4 px-6 text-primary"
          >
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-5 h-5" />
              <span className="font-extrabold text-sm">نصائح ذهبية لصياغة أسئلة اختبار فعالة</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showTips ? 'rotate-180' : ''}`} />
          </button>
          
          <div className="px-6 pb-6 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-[13px] font-bold text-bento-text/70 leading-relaxed">
                <span className="text-primary">تجنب الصياغة السلبية:</span> استخدم "أي مما يلي يعد..." بدلاً من "أي مما يلي ليس...". النفي يربك الطلاب ويزيد من وقت القراءة.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-[13px] font-bold text-bento-text/70 leading-relaxed">
                <span className="text-primary">توازي بنية الخيارات:</span> اجعل جميع البدائل متقاربة في الطول والأسلوب النحوي (مثلاً: جميعها أفعال أو جميعها أسماء).
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-[13px] font-bold text-bento-text/70 leading-relaxed">
                <span className="text-primary">مشتتات منطقية:</span> اجعل الخيارات الخاطئة منطقية وجذابة للطالب الذي لم يدرس جيداً، ليكون الاختبار مقياساً حقيقياً للفهم.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              <p className="text-[13px] font-bold text-bento-text/70 leading-relaxed">
                <span className="text-primary">تجنب "كل ما سبق":</span> هذه الخيارات تقلل من جودة السؤال وتسهل التخمين. يفضل استبدالها بخيار رابع قوي ومنافس.
              </p>
            </div>
          </div>
        </motion.div>

        <Reorder.Group axis="y" values={questions} onReorder={setQuestions} className="space-y-4">
          {questions.map((q, idx) => (
            <Reorder.Item 
              key={q.id} 
              value={q}
              className="bento-card group"
            >
              <div className="flex items-start gap-4">
                <div className="pt-2 cursor-grab active:cursor-grabbing text-bento-border group-hover:text-primary/30">
                  <GripVertical className="w-5 h-5" />
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                      <span className="bento-dot"></span>
                      <span className="text-[11px] font-black text-bento-text/40 uppercase tracking-widest">السؤال {idx + 1}</span>
                      
                      <Tooltip content={
                        <div className="space-y-4 text-right">
                          <div className="flex items-center gap-2 text-primary">
                            <Info className="w-4 h-4" />
                            <h4 className="font-black text-sm">نصائح لصياغة الأسئلة</h4>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold text-bento-text/40 leading-relaxed">تؤثر جودة الصياغة بشكل مباشر على دقة تفاوت النماذج (A, B, C) الناتجة.</p>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                              <p className="text-[10px] font-black text-green-700 mb-1">✅ صياغة جيدة:</p>
                              <p className="text-[11px] font-bold text-green-800 leading-snug">"ما هي العاصمة الإدارية لجمهورية مصر العربية؟"</p>
                              <p className="text-[9px] text-green-600/60 mt-1">مباشرة، واضحة، ولها إجابة واحدة محددة.</p>
                            </div>
                            
                            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                              <p className="text-[10px] font-black text-red-700 mb-1">❌ صياغة ضعيفة:</p>
                              <p className="text-[11px] font-bold text-red-800 leading-snug">"أي من المدن التالية ليست العاصمة الإدارية؟"</p>
                              <p className="text-[9px] text-red-600/60 mt-1">النفي يشتت الطالب ويزيد من تعقيد التحويلات.</p>
                            </div>
                          </div>

                          <ul className="text-[10px] font-bold text-bento-text/60 space-y-1 pr-2">
                            <li>• تجنب استخدام "كل ما سبق" أو "لاشيء مما سبق".</li>
                            <li>• حافظ على توازن أطوال الخيارات قدر الإمكان.</li>
                          </ul>
                        </div>
                      }>
                        <motion.button 
                          whileHover={{ scale: 1.2, color: 'var(--color-primary)' }}
                          whileTap={{ scale: 0.8 }}
                          className="text-bento-text/20 hover:text-primary transition-colors"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </motion.button>
                      </Tooltip>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.2, color: '#ef4444' }}
                      whileTap={{ scale: 0.8 }}
                      onClick={() => removeQuestion(q.id)}
                      className="text-bento-text/20 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                  
                  <div className="relative mb-6 group">
                    <div className="flex items-center gap-2 mb-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                      <div className="flex bg-bento-bg border border-bento-border rounded-lg p-1 gap-1">
                        <button 
                          onClick={() => {
                            const el = document.getElementById(`textarea-${q.id}`) as HTMLTextAreaElement;
                            if (el) {
                              const start = el.selectionStart;
                              const end = el.selectionEnd;
                              const text = el.value;
                              const before = text.substring(0, start);
                              const selection = text.substring(start, end);
                              const after = text.substring(end);
                              updateQuestion(q.id, { text: `${before}**${selection}**${after}` });
                            }
                          }}
                          className="p-1 px-2 hover:bg-white rounded text-[10px] font-black uppercase tracking-widest text-bento-text/60 hover:text-primary transition"
                          title="عريض (Bold)"
                        >
                          B
                        </button>
                        <button 
                          onClick={() => {
                            const el = document.getElementById(`textarea-${q.id}`) as HTMLTextAreaElement;
                            if (el) {
                              const start = el.selectionStart;
                              const end = el.selectionEnd;
                              const text = el.value;
                              const before = text.substring(0, start);
                              const selection = text.substring(start, end);
                              const after = text.substring(end);
                              updateQuestion(q.id, { text: `${before}_${selection}_${after}` });
                            }
                          }}
                          className="p-1 px-2 hover:bg-white rounded text-[10px] italic font-black uppercase tracking-widest text-bento-text/60 hover:text-primary transition"
                          title="مائل (Italic)"
                        >
                          I
                        </button>
                        <div className="w-px h-3 bg-bento-border mx-1 self-center" />
                        <button 
                          onClick={() => updateQuestion(q.id, { text: q.text + ' θ' })}
                          className="p-1 px-2 hover:bg-white rounded text-[10px] font-black text-bento-text/60 hover:text-primary transition"
                        >
                          θ
                        </button>
                        <button 
                          onClick={() => updateQuestion(q.id, { text: q.text + ' π' })}
                          className="p-1 px-2 hover:bg-white rounded text-[10px] font-black text-bento-text/60 hover:text-primary transition"
                        >
                          π
                        </button>
                        <button 
                          onClick={() => updateQuestion(q.id, { text: q.text + ' ∑' })}
                          className="p-1 px-2 hover:bg-white rounded text-[10px] font-black text-bento-text/60 hover:text-primary transition"
                        >
                          ∑
                        </button>
                      </div>
                    </div>
                    <textarea 
                      id={`textarea-${q.id}`}
                      value={q.text}
                      onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                      className="w-full text-lg font-extrabold bg-white border border-transparent focus:border-primary/20 focus:bg-white rounded-2xl p-4 outline-none resize-none transition-all text-bento-text placeholder:text-bento-text/20 leading-relaxed shadow-sm hover:shadow-md"
                      placeholder="اكتب السؤال هنا..."
                      rows={2}
                    />
                  </div>

                  {/* Advanced Options */}
                  <div className="flex flex-wrap gap-4 mb-8">
                    <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 bg-bento-bg/50 px-3 py-1.5 rounded-xl border border-bento-border">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <select 
                        value={q.difficulty || 'medium'}
                        onChange={(e) => updateQuestion(q.id, { difficulty: e.target.value as Difficulty })}
                        className="bg-transparent text-bento-text text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      >
                        <option value="easy">سهل (Easy)</option>
                        <option value="medium">متوسط (Medium)</option>
                        <option value="hard">صعب (Hard)</option>
                      </select>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-2 bg-bento-bg/50 px-3 py-1.5 rounded-xl border border-bento-border">
                      <BrainCircuit className="w-4 h-4 text-accent" />
                      <select 
                        value={q.bloomLevel || 'remembering'}
                        onChange={(e) => updateQuestion(q.id, { bloomLevel: e.target.value as BloomLevel })}
                        className="bg-transparent text-bento-text text-[11px] font-black uppercase tracking-widest outline-none cursor-pointer"
                      >
                        <option value="remembering">تذكر (Rem)</option>
                        <option value="understanding">فهم (Und)</option>
                        <option value="applying">تطبيق (App)</option>
                        <option value="analyzing">تحليل (Ana)</option>
                        <option value="evaluating">تقييم (Eva)</option>
                        <option value="creating">ابتكار (Cre)</option>
                      </select>
                    </motion.div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-bento-text/30 uppercase tracking-[0.2em] mb-4 pr-1">قائمة البدائل المقترحة</p>
                    <Reorder.Group 
                      axis="y" 
                      values={q.options} 
                      onReorder={(newOptions) => {
                        const correctVal = q.options[q.correctAnswerIndex];
                        const newCorrectIdx = newOptions.indexOf(correctVal);
                        updateQuestion(q.id, { options: newOptions, correctAnswerIndex: newCorrectIdx });
                      }}
                      className="space-y-3"
                    >
                      {q.options.map((opt, optIdx) => (
                        <Reorder.Item 
                          key={optIdx}
                          value={opt}
                          className="relative"
                        >
                          <motion.div 
                            whileHover={{ x: -4 }}
                            className={`flex items-center gap-4 p-1.5 rounded-[20px] border-2 transition-all duration-300 ${q.correctAnswerIndex === optIdx ? 'bg-primary/5 border-primary shadow-lg shadow-primary/5' : 'bg-white border-bento-border/50 hover:border-primary/20'}`}
                          >
                            <div className="flex items-center gap-3 flex-1 pl-4">
                              <motion.button 
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => updateQuestion(q.id, { correctAnswerIndex: optIdx })}
                                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm ${q.correctAnswerIndex === optIdx ? 'bg-primary text-white scale-110' : 'bg-bento-bg text-bento-text/20 hover:text-primary/40'}`}
                              >
                                {q.correctAnswerIndex === optIdx ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                              </motion.button>
                              
                              <div className="w-px h-6 bg-bento-border/40" />
                              
                              <input 
                                value={opt}
                                onChange={(e) => updateOption(q.id, optIdx, e.target.value)}
                                className={`bg-transparent outline-none flex-1 text-sm font-bold py-2 ${q.correctAnswerIndex === optIdx ? 'text-primary placeholder:text-primary/30' : 'text-bento-text/70 placeholder:text-bento-text/20'}`}
                                placeholder={`أدخل البديل ${['أ', 'ب', 'ج', 'د', 'هـ'][optIdx] || optIdx + 1}...`}
                              />
                            </div>

                            <motion.div 
                              className="p-3 cursor-grab active:cursor-grabbing text-bento-text/10 hover:text-primary/30 transition-colors"
                            >
                              <GripVertical className="w-4 h-4" />
                            </motion.div>
                          </motion.div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </div>
              </div>
            </Reorder.Item>
            ))}
          </Reorder.Group>

        <motion.button 
          whileHover={{ scale: 1.01, borderColor: 'var(--color-primary)', backgroundColor: 'white' }}
          whileTap={{ scale: 0.99 }}
          onClick={addQuestion}
          className="w-full py-6 border-2 border-dashed border-bento-border rounded-[20px] text-bento-text/40 font-extrabold hover:bg-white hover:border-primary/30 transition-all flex items-center justify-center gap-2 bg-transparent"
        >
          <Plus className="w-5 h-5" />
          إضافة سؤال جديد للقائمة
        </motion.button>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <AnimatePresence>
        {showConfirmCancel && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bento-text/20 backdrop-blur-sm"
              onClick={() => setShowConfirmCancel(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bento-card w-full max-w-sm p-8 text-center shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <h3 className="text-xl font-black text-bento-text mb-2">تغييرات غير محفوظة</h3>
              <p className="text-bento-text/50 text-sm font-bold leading-relaxed mb-10 px-4">
                لديك تعديلات لم يتم حفظها بعد. هل أنت متأكد من رغبتك في المغادرة وفقدان هذه التغييرات؟
              </p>
              <div className="flex flex-col gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  className="w-full py-4 bg-bento-text text-white rounded-2xl font-black text-lg hover:opacity-90 transition shadow-lg shadow-bento-text/20"
                >
                  نعم، تجاهل التغييرات
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowConfirmCancel(false)}
                  className="w-full py-4 bg-white border border-bento-border text-bento-text/60 font-bold rounded-2xl hover:border-primary/30 transition shadow-sm"
                >
                  البقاء والمتابعة
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
