import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { publicSeasonsItems, scoreSeasons, SEASONS_INSTRUMENT_VERSION, SEASONS_ITEMS, type TierResponse } from '@/lib/seasonsDiagnostic';

export const dynamic='force-dynamic';
const denied = () => NextResponse.json({error:'Sınav bulunamadı veya kapalı.'},{status:404});
function normalize(s:string){return s.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g,' ');}
async function publicExam(code:string){
 return prisma.exam.findFirst({
  where:{shortCode:code,status:'PUBLISHED',deletedAt:null,topic:'Mevsimlerin Oluşumu',subject:'Fen Bilimleri'},
  select:{id:true,title:true,shortCode:true,classroomId:true,allowMultipleSubmissions:true}
 });
}
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code')||'';
 const exam=code?await publicExam(code):null; if(!exam)return denied();
 return NextResponse.json({exam:{title:exam.title,shortCode:exam.shortCode},version:SEASONS_INSTRUMENT_VERSION,questions:publicSeasonsItems()},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:NextRequest){
 try{
  const payload=await request.json();
  const code=String(payload.code||'').trim();
  const schoolNumber=String(payload.schoolNumber||'').trim();
  const firstName=String(payload.firstName||'').trim();
  const lastName=String(payload.lastName||'').trim();
  if(!code||!schoolNumber||!firstName||!lastName||schoolNumber.length>30||firstName.length>80||lastName.length>80)
   return NextResponse.json({error:'Öğrenci bilgilerini kontrol edin.'},{status:400});
  const exam=await publicExam(code);if(!exam)return denied();
  const student=await prisma.studentRoster.findFirst({
   where:{classroomId:exam.classroomId,schoolNumber},
   select:{id:true,firstName:true,lastName:true}
  });
  if(!student||normalize(student.firstName)!==normalize(firstName)||normalize(student.lastName)!==normalize(lastName))
   return NextResponse.json({error:'Öğrenci bilgileri sınıf listesinde eşleşmedi.'},{status:403});
  const raw=payload.responses;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return NextResponse.json({error:'Yanıtlar geçersiz.'},{status:400});
  const responses:Record<string,TierResponse>={};
  for(const q of SEASONS_ITEMS){
   const r=raw[q.id];
   if(!r || !q.choices.some(c=>c.id===r.answer)||!q.reasons.some(c=>c.id===r.reason) ||
      !Number.isInteger(r.answerConfidence)||r.answerConfidence<1||r.answerConfidence>5||
      !Number.isInteger(r.reasonConfidence)||r.reasonConfidence<1||r.reasonConfidence>5)
    return NextResponse.json({error:q.id+' sorusunun tüm aşamalarını yanıtlayın.'},{status:400});
   responses[q.id]={answer:r.answer,answerConfidence:r.answerConfidence,reason:r.reason,reasonConfidence:r.reasonConfidence};
  }
  const questionIds=await prisma.question.findMany({where:{examId:exam.id,questionType:'FOUR_TIER'},select:{id:true,sourceInfo:true}});
  if(questionIds.length!==SEASONS_ITEMS.length)return NextResponse.json({error:'Sınav soru kurulumu tamamlanmamış.'},{status:409});
  const scores=scoreSeasons(responses);
  await prisma.$transaction(async tx=>{
   const previous=await tx.examAttempt.findUnique({where:{examId_studentRosterId:{examId:exam.id,studentRosterId:student.id}}});
   if(previous){throw new Error('ALREADY_SUBMITTED');}
   const attempt=await tx.examAttempt.create({data:{examId:exam.id,studentRosterId:student.id,status:'SUBMITTED',submittedAt:new Date()}});
   for(const q of questionIds){
    const id=q.sourceInfo||'';
    if(!responses[id])throw new Error('QUESTION_MISMATCH');
    await tx.studentResponse.create({data:{
     attemptId:attempt.id,questionId:q.id,
     textResponse:{create:{content:JSON.stringify({version:SEASONS_INSTRUMENT_VERSION,response:responses[id],itemScore:scores.items.find(x=>x.id===id)}),charCount:0}}
    }});
   }
  });
  return NextResponse.json({ok:true,message:'Yanıtların kaydedildi. Teşekkürler.'});
 }catch(e){
  if(e instanceof Error && e.message==='ALREADY_SUBMITTED')return NextResponse.json({error:'Bu sınava daha önce yanıt verilmiş.'},{status:409});
  console.error('seasons diagnostic submit failed',e);
  return NextResponse.json({error:'Kayıt sırasında sorun oluştu. Tekrar deneyin.'},{status:500});
 }
}
