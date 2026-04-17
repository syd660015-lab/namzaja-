import React from 'react';

export function Footer() {
  return (
    <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-bento-border/40 text-center">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm font-black text-bento-text/30 uppercase tracking-[0.2em] mb-2">Designed & Developed by</p>
        <div className="bento-card py-3 px-8 text-lg font-black text-primary shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all">
          دكتور. أحمد حمدي عاشور الغول
        </div>
        <p className="mt-6 text-[11px] text-bento-text/30 font-bold uppercase tracking-widest">
          حقوق الطبع والنشر © {new Date().getFullYear()} نمذجة | جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
