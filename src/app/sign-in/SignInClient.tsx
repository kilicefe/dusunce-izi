'use client';
import { signIn } from 'next-auth/react';
import { School } from 'lucide-react';
export default function SignInClient(){
 return <main className="min-h-screen flex items-center justify-center bg-slate-900 px-5 py-12">
  <section className="max-w-md w-full rounded-3xl bg-slate-800 border border-slate-700 text-white p-9 text-center shadow-2xl">
   <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5"><School size={32}/></div>
   <h1 className="text-3xl font-extrabold">DÜŞÜNCE İZİ</h1>
   <p className="text-slate-300 text-sm mt-3">EduAnalytics öğretmen ve yönetici paneli</p>
   <p className="text-slate-400 text-sm mt-5">Güvenli giriş için yalnızca önceden yetkilendirilmiş Google hesabınızı kullanın.</p>
   <button onClick={()=>signIn('google',{callbackUrl:'/dashboard'})} className="mt-7 w-full rounded-xl bg-white text-slate-900 font-bold px-6 py-4 hover:bg-slate-100">Google hesabımla giriş yap</button>
   <p className="mt-4 text-xs text-slate-400">Hesabınız yetkilendirilmemişse okul yöneticinizden erişim isteyin.</p>
  </section>
 </main>;
}