export const questions = {
  2: { text:'Care este cel mai mare semn primit de la Dumnezeu ca ei trebuie sa ramana impreuna?', keywords:['aspirator','robot','roborok'] },
  6: { text:'Unde s-a despartit mami de bebe si s-au impacat in acelasi loc?', keywords:['benzinarie','benzinaria'] },
  15: { text:'Care e tortul preferat a lui bebe facut de mami?', keywords:['mere'] },
  17: { text:'Ce ii place lui bebe sa ii faca mami cel mai mult?', keywords:['masaj'] }
};
export const WRONG_ANSWER = 'raspuns gresit, Mami. mai incearca.';
export function normalizeAnswer(answer) {
  return String(answer).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('ro-RO').trim();
}
export function isCorrectAnswer(day, answer) {
  const question=questions[day];
  if(!question)return false;
  const text=normalizeAnswer(answer);
  return question.keywords.some(keyword=>text.includes(keyword));
}
