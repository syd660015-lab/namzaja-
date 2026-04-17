import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { handleFirestoreError, OperationType } from './lib/firestoreErrorHandler';
import { Exam, GeneratedModel } from './types';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { UploadView } from './components/UploadView';
import { ExamEditor } from './components/ExamEditor';
import { ResultViewer } from './components/ResultViewer';
import { Footer } from './components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'dashboard' | 'upload' | 'edit' | 'results'>('dashboard');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setExams([]);
        setView('dashboard');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'exams'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Exam));
      setExams(examList);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'exams');
    });

    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      setError("فشل تسجيل الدخول");
    }
  };

  const logout = () => firebaseSignOut(auth);

  const saveExam = async (examData: Partial<Exam>, silent = false) => {
    if (!user) return;
    try {
      if (examData.id || currentExam?.id) {
        const id = examData.id || currentExam?.id;
        const { id: _, ...dataWithoutId } = examData;
        await updateDoc(doc(db, 'exams', id!), {
          ...dataWithoutId,
          userId: user.uid,
          updatedAt: serverTimestamp(),
        });
        if (!silent) setView('dashboard');
        return id;
      } else {
        const docRef = await addDoc(collection(db, 'exams'), {
          ...examData,
          userId: user.uid,
          createdAt: serverTimestamp(),
        });
        if (!silent) setView('dashboard');
        return docRef.id;
      }
    } catch (err: any) {
      console.error(err);
      setError("حدث خطأ أثناء حفظ الاختبار. يرجى التحقق من الصلاحيات.");
      handleFirestoreError(err, OperationType.WRITE, 'exams');
    }
  };

  const saveGeneratedModels = async (examId: string, models: GeneratedModel[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      for (const model of models) {
        const modelRef = doc(collection(db, 'generated_models'));
        batch.set(modelRef, {
          ...model,
          userId: user.uid,
          examId: examId,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
    } catch (err: any) {
      console.error(err);
      setError("فشل حفظ النماذج المولدة في قاعدة البيانات.");
      handleFirestoreError(err, OperationType.WRITE, 'generated_models');
    }
  };

  const deleteExam = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'exams', id));
    } catch (err: any) {
      console.error(err);
      setError("فشل حذف الاختبار من قاعدة البيانات.");
      handleFirestoreError(err, OperationType.DELETE, `exams/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" dir="rtl">
      <Navbar user={user} login={login} logout={logout} onHome={() => setView('dashboard')} />
      
      <main className="max-w-5xl mx-auto px-4 pt-8">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div 
              key="auth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-32"
            >
              <h1 className="text-6xl font-black text-primary mb-8 tracking-tighter">نمذجة</h1>
              <p className="text-xl text-bento-text/60 mb-12 max-w-2xl mx-auto leading-relaxed font-bold">
                حوّل اختباراتك إلى نسخ متعددة (A، B، C) بضغطة زر. نضمن لك النزاهة الأكاديمية وسهولة التصحيح عبر تقنيات الذكاء الاصطناعي المتطورة.
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                onClick={login}
                className="bento-btn-primary px-10 py-5 text-xl shadow-2xl shadow-primary/20"
              >
                ابدأ رحلة التميز الآن
              </motion.button>
            </motion.div>
          ) : (
            <div key="content">
              {view === 'dashboard' && (
                <Dashboard 
                  exams={exams} 
                  onNew={() => setView('upload')} 
                  onView={(exam) => { setCurrentExam(exam); setView('edit'); }}
                  onResults={(exam) => { setCurrentExam(exam); setView('results'); }}
                  onDelete={deleteExam}
                />
              )}
      {view === 'upload' && (
                <UploadView 
                  onParsed={(data) => {
                    setCurrentExam({
                      userId: user.uid,
                      title: data.title,
                      subject: data.subject,
                      questions: data.questions.map((q: any, i: number) => ({ ...q, id: `q-${Date.now()}-${i}` })),
                      createdAt: new Date()
                    });
                    setView('edit');
                  }}
                  onCancel={() => setView('dashboard')}
                  onError={(msg) => setError(msg)}
                />
              )}
              {view === 'edit' && currentExam && (
                <ExamEditor 
                  exam={currentExam} 
                  onSave={saveExam}
                  onCancel={() => setView('dashboard')}
                  onGenerate={(exam) => {
                    setCurrentExam(exam);
                    setView('results');
                  }}
                  onError={(msg) => setError(msg)}
                />
              )}
              {view === 'results' && currentExam && (
                <ResultViewer 
                  exam={currentExam} 
                  onBack={() => setView('dashboard')}
                  onUpdate={(id, updates) => saveExam({ id, ...updates }, true).then(() => {})}
                  onSaveModels={saveGeneratedModels}
                  onError={(msg) => setError(msg)}
                />
              )}
            </div>
          )}
        </AnimatePresence>

        {error && (
          <div className="fixed bottom-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="font-bold">&times;</button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
