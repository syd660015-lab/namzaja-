import React, { useState } from 'react';
import { Exam } from '../types';
import { Plus, FileText, Trash2, ChevronRight, Clock, AlertTriangle, GraduationCap, BarChart as ChartIcon } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  exams: Exam[];
  onNew: () => void;
  onView: (exam: Exam) => void;
  onResults: (exam: Exam) => void;
  onDelete: (id: string) => void;
}

export function Dashboard({ exams, onNew, onView, onResults, onDelete }: DashboardProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  const confirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const subjects = ['all', ...Array.from(new Set(exams.map(e => e.subject).filter(Boolean)))];
  const filteredExams = selectedSubject === 'all' 
    ? exams 
    : exams.filter(e => e.subject === selectedSubject);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 px-2 print:hidden">
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className="bento-card p-6 flex items-center gap-5 border-l-4 border-l-primary"
        >
          <div className="w-12 h-12 bg-primary-light rounded-2xl flex items-center justify-center text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-bento-text/30 uppercase tracking-widest">إجمالي الاختبارات</p>
            <h4 className="text-2xl font-black text-bento-text">{exams.length}</h4>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className="bento-card p-6 flex items-center gap-5 border-l-4 border-l-accent"
        >
          <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-bento-text/30 uppercase tracking-widest">عدد المواد</p>
            <h4 className="text-2xl font-black text-bento-text">{subjects.filter(s => s !== 'all').length}</h4>
          </div>
        </motion.div>
        <motion.div 
          whileHover={{ y: -5, scale: 1.02 }}
          className="bento-card p-6 flex items-center gap-5 border-l-4 border-l-orange-500"
        >
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-bento-text/30 uppercase tracking-widest">إجمالي الأسئلة</p>
            <h4 className="text-2xl font-black text-bento-text">{exams.reduce((acc, curr) => acc + curr.questions.length, 0)}</h4>
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 px-2 gap-6">
        <div>
          <h2 className="text-2xl font-black text-bento-text">اختباراتي المحفوظة</h2>
          <p className="text-[13px] font-bold text-bento-text/50 mt-1">إدارة {exams.length} اختبارات نشطة</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          {subjects.length > 1 && (
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-bento-border rounded-xl px-4 py-2.5 text-sm font-bold text-bento-text outline-none focus:border-primary transition shadow-sm"
            >
              <option value="all">كل المواد</option>
              {subjects.filter(s => s !== 'all').map(subject => (
                <option key={subject} value={subject!}>{subject}</option>
              ))}
            </select>
          )}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNew}
            className="bento-btn-primary flex items-center gap-2 flex-1 md:flex-none shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            نموذج جديد
          </motion.button>
        </div>
      </div>

      {exams.length === 0 ? (
        <div className="bento-card py-24 text-center border-dashed border-2 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-primary-light rounded-[32px] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-primary opacity-40" />
          </div>
          <h3 className="text-xl font-black text-bento-text mb-2">لا توجد اختبارات بعد</h3>
          <p className="text-sm font-bold text-bento-text/40 mb-10 max-w-sm mx-auto">ابدأ برفع النسخة الأصلية للاختبار لإنشاء نماذج متعددة بلمسة واحدة</p>
          <motion.button 
            whileHover={{ scale: 1.05, borderColor: 'var(--color-primary)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onNew}
            className="px-8 py-3 bg-white border border-bento-border rounded-2xl font-black text-primary hover:border-primary/30 transition shadow-sm"
          >
            اضغط هنا لرفع أول اختبار
          </motion.button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredExams.map((exam, i) => (
              <motion.div 
                key={exam.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bento-card group cursor-pointer hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
                onClick={() => onView(exam)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center bg-primary-light text-primary px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full ml-2"></span>
                      {exam.questions.length} سؤال
                    </div>
                    {exam.subject && (
                      <div className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {exam.subject}
                      </div>
                    )}
                    {exam.hasGenerated && (
                      <div className="bg-accent/10 text-accent px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm shadow-accent/5">
                        <ChartIcon className="w-3 h-3" />
                        النتائج جاهزة
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {exam.hasGenerated && (
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onResults(exam); 
                        }}
                        className="p-2 text-accent hover:bg-accent/5 rounded-xl transition"
                        title="مشاهدة النتائج"
                      >
                        <ChartIcon className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button 
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.8 }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setDeleteId(exam.id!); 
                      }}
                      className="p-2 text-bento-text/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-bento-text mb-4 line-clamp-2 leading-relaxed group-hover:text-primary transition-colors min-h-[3.5rem]">
                  {exam.title}
                </h3>
                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-bento-border/50 text-[11px] font-black text-bento-text/30 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatDate(exam.createdAt)}</span>
                  </div>
                  <div className="mr-auto flex items-center text-primary group-hover:translate-x-[-4px] transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-bento-text/20 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bento-card w-full max-w-sm p-8 text-center shadow-2xl bg-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-black text-bento-text mb-2">تأكيد الحذف</h3>
              <p className="text-bento-text/50 text-sm font-bold leading-relaxed mb-10 px-4">
                هل أنت متأكد من رغبتك في حذف هذا النموذج؟ لا يمكن التراجع عن هذا الإجراء بعد التنفيذ.
              </p>
              <div className="flex flex-col gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-lg hover:bg-red-600 transition shadow-lg shadow-red-500/20"
                >
                  نعم، احذف النموذج
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 text-bento-text/40 font-bold hover:text-bento-text transition"
                >
                  تراجع عن القرار
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
