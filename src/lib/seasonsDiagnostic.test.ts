import {describe,it,expect} from 'vitest';
import {SEASONS_ITEMS,scoreSeasons,publicSeasonsItems,type TierResponse} from './seasonsDiagnostic';
function answers(overrides:Record<string,Partial<TierResponse>>={}){
 const out:Record<string,TierResponse>={};
 for(const q of SEASONS_ITEMS)out[q.id]={answer:q.correctAnswer,reason:q.correctReason,answerConfidence:5,reasonConfidence:5,...(overrides[q.id]||{})};
 return out;
}
describe('Mevsimler four-tier diagnostic',()=>{
 it('correct keys are not exposed to student payload',()=>{
  const publicItems=publicSeasonsItems();
  expect(publicItems).toHaveLength(10);
  for(const item of publicItems){
   expect(JSON.stringify(item)).not.toContain('correctAnswer');
   expect(JSON.stringify(item)).not.toContain('misconception');
   expect(item.reasons.length).toBeGreaterThanOrEqual(6);
  }
 });
 it('all correct and confident is 100/100 and 10 scientific',()=>{
  const result=scoreSeasons(answers());
  expect(result.score).toBe(100);expect(result.scientific).toBe(10);
  expect(result.answerCorrect).toBe(10);expect(result.reasonCorrect).toBe(10);
 });
 it('correct but unsure is correct score without confident scientific conception',()=>{
  const result=scoreSeasons(answers({S01:{answerConfidence:2,reasonConfidence:5}}));
  expect(result.score).toBe(100);expect(result.scientific).toBe(9);
  expect(result.items[0].status).toBe('tentative');
 });
 it('confident misconception is not considered mastered',()=>{
  const result=scoreSeasons(answers({S01:{answer:'B',reason:'B',answerConfidence:5,reasonConfidence:5}}));
  expect(result.score).toBe(90);expect(result.scientific).toBe(9);
  expect(result.items[0].status).toBe('misconception_suspected');
  expect(result.misconceptionCounts.DISTANCE).toBe(1);
 });
 it('wrong reasoning for correct content does not pass joint score',()=>{
  const result=scoreSeasons(answers({S03:{reason:'B'}}));
  expect(result.score).toBe(90);expect(result.reasonCorrect).toBe(9);
  expect(result.items[2].status).toBe('false_positive');
 });
 it('repeated misconception is distinguished from one-off suspicion',()=>{
  const result=scoreSeasons(answers({S01:{answer:'B',reason:'B'},S09:{answer:'B',reason:'E'}}));
  expect(result.recurringMisconceptions).toContain('DISTANCE');
 });
});
