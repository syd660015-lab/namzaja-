import React from 'react';
import { User } from 'firebase/auth';
import { Layout, LogOut, PlusCircle, GraduationCap } from 'lucide-react';

import { motion } from 'motion/react';

interface NavbarProps {
  user: User | null;
  login: () => void;
  logout: () => void;
  onHome: () => void;
}

export function Navbar({ user, login, logout, onHome }: NavbarProps) {
  return (
    <nav className="bg-transparent border-none py-6">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-col cursor-pointer" 
          onClick={onHome}
        >
          <h1 className="text-3xl font-black text-primary leading-tight tracking-tighter">نمذجة</h1>
          <p className="text-[13px] text-bento-text/70 font-medium">التحويل الذكي لنماذج الاختبارات</p>
        </motion.div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-bento-text">{user.displayName}</span>
                <span className="text-[11px] text-bento-text/60">أكاديمي متخصص</span>
              </div>
              <motion.img 
                whileHover={{ scale: 1.1, rotate: 5 }}
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                className="w-10 h-10 rounded-xl border border-bento-border shadow-sm shadow-primary/5"
                alt="Profile"
                referrerPolicy="no-referrer"
              />
              <motion.button 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.05)', color: '#ef4444' }}
                whileTap={{ scale: 0.9 }}
                onClick={logout}
                className="p-2 text-bento-text/50 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={login}
              className="bento-btn-primary"
            >
              تسجيل الدخول
            </motion.button>
          )}
        </div>
      </div>
    </nav>
  );
}
