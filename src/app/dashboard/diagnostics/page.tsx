'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
type Classroom={id:string;name:string;grade:string;academicYear:string};
type Exam={id:string;title:string;status:string;shortCode:string;createdAt:string;classroom:{name:string};_count:{attempts:number}};
export default function SeasonsTeacherPage(){
 const [classes,setClasses]=useState<Classroom[]>([]);
 const [exams,setExams]=useState<Exam[]>([]);
 const [classroomId,setClassroomId]=useState('');
 const [loading,setLoading]=useState(true);const [creating,setCreating]=useState(false);const [error,setError]=useState('');
 async function reload(){try{const res=await fetch('/api/diagnostics/seasons/teacher',{cache:'no-store'});const data=await res.json();if(!res.ok)throw Error(data.error||'Yüklenemedi.');setClasses(data.classrooms);setExams(data.exams);if(!classroomId&&data.classrooms.length)setClassroomId(data.classrooms[0].id)}catch(e){setError(e instanceof Error?e.message:'Hata')}finally{setLoading(false)}}
 useEffect(()=>{void reload()},[]);
 async function create(){setCreating(true);setError('');try{const res=await fetch('/api/diagnostics/seasons/teacher',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({classroomId})});const data=await res.json();if(!res.ok)throw Error(data.error||'Sınav oluşturulamadı.');await reload()}catch(e){setError(e instanceof Error?e.message:'Hata')}finally{setCreating(false)}}
 return <main className="max-w-5xl mx-auto p-5 md:p-9 space-y-7">
 <header className="space-y-2"><Link href="/dashboard" className="text-sm text-cyan-700">← Panele dön</Link><h1 className="text-3xl font-bold">Mevsimler | Kavramsal Tanılama</h1><p className="text-slate-600">Düşünce İzi sınav altyapısı + EduAnalytics kavram ve yanılgı raporları. Dört aşamalı, çift eminlikli değerlendirme.</p></header>
 {error&&<div role="alert" className="p-4 bg-red-50 text-red-700 rounded-xl">{error}</div>}
 <section className="bg-white border rounded-2xl p-6 space-y-4">
  <h2 className="text-xl font-bold">Yeni sınıf sınavı oluştur</h2>
  <p className="text-sm text-slate-600">Soru bankası: 10 bağlam temelli madde. Aynı öğrenci bu sınava yalnızca bir kez yanıt verebilir. Sınıf listesi önceden kayıtlı olmalıdır.</p>
  <label className="block text-sm font-semibold">Sınıf seç
   <select className="w-full mt-2 rounded-xl border p-3" value={classroomId} onChange={e=>setClassroomId(e.target.value)}>{classes.map(c=><option value={c.id} key={c.id}>{c.name} · {c.academicYear}</option>)}</select>
  </label>
  <button disabled={!classroomId||creating} onClick={create} className="bg-cyan-800 text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-40">{creating?'Oluşturuluyor…':'Sınavı oluştur ve öğrenci bağlantısını hazırla'}</button>
 </section>
 <section className="bg-white border rounded-2xl p-6 space-y-4"><h2 className="text-xl font-bold">Sınıflara açılan sınavlar</h2>
 {loading?<p>Yükleniyor…</p>:!exams.length?<p className="text-slate-600">Henüz bu konuda sınav oluşturulmadı.</p>:exams.map(exam=><div key={exam.id} className="border rounded-xl p-4 space-y-3"><div className="flex justify-between items-start gap-3 flex-wrap"><div><h3 className="font-bold">{exam.classroom.name}</h3><p className="text-xs text-slate-500">{new Date(exam.createdAt).toLocaleDateString('tr-TR')} · {exam._count.attempts} katılım</p></div><Link className="text-cyan-800 underline font-bold" href={'/dashboard/diagnostics/'+exam.id}>Öğrenci analizlerini gör</Link></div><div className="text-sm break-all bg-slate-50 p-3 rounded-lg">Öğrenci bağlantısı: <a className="text-cyan-800 underline" href={'/diagnostic/'+exam.shortCode} target="_blank">{typeof window!=='undefined'?window.location.origin:''}/diagnostic/{exam.shortCode}</a></div><button className="text-sm px-4 py-2 rounded-lg border font-semibold" onClick={()=>navigator.clipboard.writeText(window.location.origin+'/diagnostic/'+exam.shortCode)}>Bağlantıyı kopyala</button></div>)}
 </section>
 <section className="border rounded-2xl p-5 text-sm text-slate-600 space-y-2"><h2 className="font-bold text-slate-900">Ölçme yöntemi</h2><p>Öğrenci her madde için sonucu (1), buna duyduğu güveni (2), gerekçeyi (3) ve gerekçeye duyduğu güveni (4) belirtir. Her iki cevap doğruysa 10 puan verilir. İkisi doğru ve iki güven puanı en az 4 ise bilimsel kavrama göstergesi olarak ayrıca sayılır. Yanlış seçilen bir yanılgı gerekçesi yüksek güvenle savunuluyorsa yanılgı şüphesi oluşur.</p><p>Bu araç araştırmalardan esinlenen özgün bir öğretmen testi olup pilot çalışma olmadan standartlaştırılmış veya psikometrik olarak doğrulanmış kabul edilmez.</p></section>
 </main>;
}
