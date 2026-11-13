import {NextRequest,NextResponse} from 'next/server';
import {requireTeacher} from '@/lib/auth';
import prisma from '@/lib/prisma';
import {SEASONS_ITEMS,SEASONS_INSTRUMENT_VERSION,MISCONCEPTION_LABELS,scoreSeasons,type TierResponse} from '@/lib/seasonsDiagnostic';
import {randomBytes} from 'node:crypto';
export const dynamic='force-dynamic';
async function currentTeacher(){
 try{return await requireTeacher()}catch{return null}
}
export async function GET(request:NextRequest){
 const teacher=await currentTeacher();if(!teacher)return NextResponse.json({error:'Oturum açın.'},{status:401});
 const examId=request.nextUrl.searchParams.get('examId');
 if(!examId){
  const classrooms=await prisma.classroom.findMany({where:{teacherId:teacher.id},select:{id:true,name:true,grade:true,academicYear:true},orderBy:{name:'asc'}});
  const exams=await prisma.exam.findMany({where:{teacherId:teacher.id,topic:'Mevsimlerin Oluşumu',subject:'Fen Bilimleri',deletedAt:null},select:{id:true,title:true,status:true,shortCode:true,createdAt:true,classroom:{select:{name:true}},_count:{select:{attempts:true}}},orderBy:{createdAt:'desc'}});
  return NextResponse.json({classrooms,exams});
 }
 const exam=await prisma.exam.findFirst({where:{id:examId,teacherId:teacher.id,topic:'Mevsimlerin Oluşumu',deletedAt:null},select:{id:true,title:true,shortCode:true,classroom:{select:{name:true}},attempts:{where:{status:'SUBMITTED'},select:{id:true,submittedAt:true,studentRoster:{select:{firstName:true,lastName:true,schoolNumber:true}},responses:{select:{question:{select:{sourceInfo:true}},textResponse:{select:{content:true}}}}}}}});
 if(!exam)return NextResponse.json({error:'Sınav bulunamadı.'},{status:404});
 const students=exam.attempts.map(attempt=>{
  const responses:Record<string,TierResponse>={};
  attempt.responses.forEach(item=>{try{const content=JSON.parse(item.textResponse?.content||'{}');if(item.question.sourceInfo&&content.response)responses[item.question.sourceInfo]=content.response}catch{}});
  return {student:{...attempt.studentRoster},submittedAt:attempt.submittedAt,analysis:scoreSeasons(responses)};
 });
 const counts:Record<string,number>={};
 students.forEach(s=>Object.keys(s.analysis.misconceptionCounts).forEach(k=>counts[k]=(counts[k]||0)+1));
 return NextResponse.json({exam:{id:exam.id,title:exam.title,classroom:exam.classroom.name,shortCode:exam.shortCode},students,summary:{studentCount:students.length,averageScore:students.length?Math.round(students.reduce((n,s)=>n+s.analysis.score,0)/students.length):null,misconceptions:Object.entries(counts).map(([code,count])=>({code,label:MISCONCEPTION_LABELS[code]||code,count,percentage:students.length?Math.round(count/students.length*100):0})).sort((a,b)=>b.count-a.count)}},{headers:{'Cache-Control':'no-store'}});
}
export async function POST(request:NextRequest){
 const teacher=await currentTeacher();if(!teacher)return NextResponse.json({error:'Oturum açın.'},{status:401});
 try{
  const body=await request.json();
  const classroomId=String(body.classroomId||'');
  const classroom=await prisma.classroom.findFirst({where:{id:classroomId,teacherId:teacher.id},select:{id:true,name:true}});
  if(!classroom)return NextResponse.json({error:'Bu sınıfa erişim yetkiniz yok.'},{status:403});
  const shortCode='M'+randomBytes(5).toString('hex').toUpperCase();
  const exam=await prisma.exam.create({data:{
    teacherId:teacher.id,classroomId:classroom.id,title:'Mevsimlerin Oluşumu | 4 Aşamalı Kavramsal Tanılama',
    subject:'Fen Bilimleri',unit:'Mevsimler ve İklim',topic:'Mevsimlerin Oluşumu',
    description:'Düşünce İzi × EduAnalytics; araştırmalardan esinlenen ancak henüz psikometrik olarak doğrulanmamış 10 maddelik ölçme aracı.',
    instructions:'Her maddede cevap ve gerekçeyi işaretle; her ikisine ayrı ayrı 1–5 arası güven düzeyi ver.',
    status:'PUBLISHED',publishedAt:new Date(),shortCode,allowResume:false,allowMultipleSubmissions:false,
    questions:{create:SEASONS_ITEMS.map((q,i)=>({
       questionOrder:i+1,title:'Soru '+(i+1)+' – '+q.concept,questionText:q.prompt,
       sourceInfo:q.id,sourceDetails:'Four-tier v'+SEASONS_INSTRUMENT_VERSION,questionType:'FOUR_TIER',
       allowedResponseModes:['DIRECT_TEXT'],targetedSkills:['conceptualUnderstanding','causalReasoning'],
       maximumScore:10,correctAnswer:JSON.stringify({answer:q.correctAnswer,reason:q.correctReason}),
       multipleChoiceOpts:{choices:q.choices,reasons:q.reasons},
       learningOutcome:'F.8.1.1.1 Mevsimlerin oluşumuna yönelik tahminlerde bulunur.',
       expectedConcepts:{create:[{conceptName:q.concept,order:0,isEssential:true}]},
       misconceptions:{create:[...new Set([...q.choices,...q.reasons].map(x=>x.misconception).filter((x):x is string=>Boolean(x)))].map((code,i)=>({code,title:MISCONCEPTION_LABELS[code]||code,description:MISCONCEPTION_LABELS[code]||code,order:i}))}
    }))}
  },select:{id:true,shortCode:true,title:true}});
  return NextResponse.json({exam});
 }catch(err){console.error(err);return NextResponse.json({error:'Sınav oluşturulamadı.'},{status:500});}
}
