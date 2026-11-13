'use client';
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
type Item={id:string;concept:string;prompt:string;choices:{id:string;text:string}[];reasons:{id:string;text:string}[]};
type Response={answer:string;answerConfidence:number;reason:string;reasonConfidence:number};
const empty=():Response=>({answer:'',answerConfidence:0,reason:'',reasonConfidence:0});
export default function SeasonsStudentPage(){
 const params=useParams();const code=String(params.code||'');
 const [items,setItems]=useState<Item[]>([]);const [title,setTitle]=useState('');
 const [loading,setLoading]=useState(true);const [error,setError]=useState('');
 const [responses,setResponses]=useState<Record<string,Response>>({});
 const [index,setIndex]=useState(0);const [identity,setIdentity]=useState({schoolNumber:'',firstName:'',lastName:''});
 const [stage,setStage]=useState<'identity'|'exam'|'review'|'done'>('identity');
 const [sending,setSending]=useState(false);
 useEffect(()=>{fetch('/api/diagnostics/seasons?code='+encodeURIComponent(code),{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error(data.error||'Sınav yüklenemedi.');setItems(data.questions);setTitle(data.exam.title)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[code]);
 const q=items[index];const r=q?(responses[q.id]||empty()):empty();
 function change(patch:Partial<Response>){if(!q)return;setResponses(prev=>({...prev,[q.id]:{...(prev[q.id]||empty()),...patch}}))}
 const complete=(item:Item)=>{const x=responses[item.id];return Boolean(x?.answer&&x?.reason&&x?.answerConfidence>=1&&x?.reasonConfidence>=1)};
 const count=items.filter(complete).length;
 async function submit(){
  setSending(true);setError('');
  try{
   const response=await fetch('/api/diagnostics/seasons',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,...identity,responses})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Kayıt yapılamadı.');
   setStage('done');
  }catch(e){setError(e instanceof Error?e.message:'Beklenmedik hata.')}finally{setSending(false)}
 }
 if(loading)return <main className="min-h-screen bg-slate-50 p-8 text-center text-slate-600">Sınav yükleniyor…</main>;
 if(stage==='done')return <main className="min-h-screen bg-slate-50 flex items-center justify-center p-5"><section className="max-w-md bg-white rounded-3xl p-9 shadow-sm border text-center"><div className="text-5xl mb-4">✓</div><h1 className="text-2xl font-bold">Yanıtların kaydedildi!</h1><p className="text-slate-600 mt-3">Kavramsal analizini öğretmenin görebilecek. Katıldığın için teşekkürler.</p></section></main>;
 return <main className="min-h-screen bg-slate-50 text-slate-900 py-6 px-4"><div className="max-w-2xl mx-auto space-y-5">
 <header className="rounded-3xl bg-gradient-to-r from-cyan-900 to-blue-800 text-white p-7 shadow-sm"><p className="text-cyan-100 text-sm font-semibold">DÜŞÜNCE İZİ × EDUANALYTICS</p><h1 className="text-2xl md:text-3xl font-bold mt-2">{title||'Mevsimlerin Oluşumu'}</h1><p className="text-blue-100 mt-2 text-sm">10 soruluk kavramsal tanılama • Her soruda cevabına ve gerekçene ayrı ayrı güven düzeyi ver.</p></header>
 {error&&<div role="alert" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>}
 {stage==='identity'&&<section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
  <h2 className="text-xl font-bold">Öğrenci bilgilerin</h2><p className="text-sm text-slate-600">Bilgilerini öğretmeninin sınıf listesinde yazdığı biçimde gir. Telefon veya e-posta istenmez.</p>
  {([['schoolNumber','Okul numarası'],['firstName','Adın'],['lastName','Soyadın']] as const).map(([key,label])=><label key={key} className="block text-sm font-medium">{label}<input autoComplete="off" maxLength={key==='schoolNumber'?30:80} value={identity[key]} onChange={e=>setIdentity(prev=>({...prev,[key]:e.target.value}))} className="mt-2 w-full p-3.5 rounded-xl border border-slate-300 text-base focus:ring-2 focus:ring-cyan-600 outline-none"/></label>)}
  <button disabled={!identity.schoolNumber.trim()||!identity.firstName.trim()||!identity.lastName.trim()||!items.length} className="w-full py-4 bg-cyan-800 text-white rounded-xl font-semibold disabled:opacity-40" onClick={()=>setStage('exam')}>Teste başla</button>
 </section>}
 {stage==='exam'&&q&&<section className="bg-white rounded-3xl border border-slate-200 p-5 md:p-7 space-y-6">
  <div className="flex justify-between text-sm font-semibold text-slate-600"><span>Soru {index+1} / {items.length}</span><span>{count} tamamlandı</span></div>
  <div className="rounded-full h-2 bg-slate-100 overflow-hidden"><div className="h-2 bg-cyan-600" style={{width:(count/items.length*100)+'%'}}/></div>
  <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">{q.concept}</p>
  <h2 className="text-lg md:text-xl font-semibold leading-relaxed">{q.prompt}</h2>
  <fieldset className="space-y-2"><legend className="font-bold mb-3">1. Aşama — Olayı yorumla</legend>{q.choices.map(opt=><label key={opt.id} className={'flex gap-3 p-3.5 rounded-xl cursor-pointer border '+(r.answer===opt.id?'border-cyan-700 bg-cyan-50':'border-slate-200 hover:border-cyan-300')}><input type="radio" name={'answer-'+q.id} className="accent-cyan-700 mt-1" checked={r.answer===opt.id} onChange={()=>change({answer:opt.id})}/><span><strong>{opt.id})</strong> {opt.text}</span></label>)}</fieldset>
  <fieldset className="space-y-2"><legend className="font-bold">1. Aşama eminliği</legend><p className="text-sm text-slate-600 mb-2">İşaretlediğin sonucun doğruluğundan ne kadar eminsin?</p><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(v=><button type="button" key={v} aria-label={'Cevap eminliği '+v} onClick={()=>change({answerConfidence:v})} className={'py-3 rounded-xl border font-bold '+(r.answerConfidence===v?'bg-cyan-800 text-white':'bg-white')}>{v}</button>)}</div><div className="flex justify-between text-xs text-slate-500"><span>Hiç emin değilim</span><span>Çok eminim</span></div></fieldset>
  <div className="border-t border-slate-200"/>
  <fieldset className="space-y-2"><legend className="font-bold mb-3">2. Aşama — Nedenini belirle</legend>{q.reasons.map(opt=><label key={opt.id} className={'flex gap-3 p-3.5 rounded-xl cursor-pointer border '+(r.reason===opt.id?'border-cyan-700 bg-cyan-50':'border-slate-200 hover:border-cyan-300')}><input type="radio" name={'reason-'+q.id} className="accent-cyan-700 mt-1" checked={r.reason===opt.id} onChange={()=>change({reason:opt.id})}/><span><strong>{opt.id})</strong> {opt.text}</span></label>)}</fieldset>
  <fieldset className="space-y-2"><legend className="font-bold">2. Aşama eminliği</legend><p className="text-sm text-slate-600 mb-2">Seçtiğin gerekçenin doğruluğundan ne kadar eminsin?</p><div className="grid grid-cols-5 gap-2">{[1,2,3,4,5].map(v=><button type="button" key={v} aria-label={'Gerekçe eminliği '+v} onClick={()=>change({reasonConfidence:v})} className={'py-3 rounded-xl border font-bold '+(r.reasonConfidence===v?'bg-cyan-800 text-white':'bg-white')}>{v}</button>)}</div><div className="flex justify-between text-xs text-slate-500"><span>Hiç emin değilim</span><span>Çok eminim</span></div></fieldset>
  <div className="flex gap-3 pt-3"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)} className="rounded-xl border px-5 py-3 font-semibold disabled:opacity-30">Önceki</button><button onClick={()=>index===items.length-1?setStage('review'):setIndex(i=>i+1)} className="flex-1 rounded-xl bg-cyan-800 text-white font-bold p-3">{index===items.length-1?'Kontrol et':'Sonraki soru'}</button></div>
 </section>}
 {stage==='review'&&<section className="bg-white rounded-3xl border border-slate-200 p-7 space-y-5"><h2 className="text-xl font-bold">Yanıtlarını kontrol et</h2><p>{count} / {items.length} soru tamamlandı. Göndermeden önce tüm soruların iki cevabını ve iki eminlik düzeyini seçmiş olmalısın.</p><div className="grid grid-cols-5 gap-2">{items.map((item,i)=><button key={item.id} onClick={()=>{setIndex(i);setStage('exam')}} className={'p-3 rounded-xl font-bold border '+(complete(item)?'bg-emerald-50 border-emerald-400':'bg-amber-50 border-amber-400')}>{i+1}</button>)}</div><button onClick={submit} disabled={sending||count!==items.length} className="w-full bg-cyan-800 text-white rounded-xl py-4 font-bold disabled:opacity-40">{sending?'Kaydediliyor…':'Yanıtlarımı öğretmenime gönder'}</button><button className="w-full text-cyan-800 font-semibold" onClick={()=>setStage('exam')}>Sorulara geri dön</button></section>}
 <footer className="text-xs text-center text-slate-500 pb-7">Sonuçlar öğretmenine iletilir; doğru cevaplar test sırasında gösterilmez.</footer>
 </div></main>;
}
