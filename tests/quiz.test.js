import test from 'node:test';
import assert from 'node:assert/strict';
import { questions, isCorrectAnswer, WRONG_ANSWER } from '../quiz.js';
test('questions are fixed to 2, 6, 15, and 17 in the requested order',()=> {
 assert.deepEqual(Object.keys(questions),['2','6','15','17']);
 assert.match(questions[2].text,/Dumnezeu/);
 assert.match(questions[6].text,/despartit/);
 assert.match(questions[15].text,/tortul/);
});
test('correct answers can be sentences, ignore case, and accept Romanian accents',()=> {
 for(const answer of ['ASPIRATOR','Un Aspirator!','aspiratorul','ROBOT','robotul nostru','un RoBoRoK bun']) assert.equal(isCorrectAnswer(2,answer),true);
 for(const answer of ['BENZINARIE','Benzinăria','la benzinărie','in benzinaria aceea']) assert.equal(isCorrectAnswer(6,answer),true);
 for(const answer of ['MERE','Tortul cu mere','cu MeRe!']) assert.equal(isCorrectAnswer(15,answer),true);
});
test('wrong answers never pass and attempts have no limit',()=> {
 for(const day of [2,6,15,17]) {
  for(let i=0;i<100;i++)assert.equal(isCorrectAnswer(day,'nu stiu'),false);
  assert.equal(isCorrectAnswer(day,''),false);
 }
 for(const answer of ['MASAJ','Un masaj bun','masajul']) assert.equal(isCorrectAnswer(17,answer),true);
 assert.equal(isCorrectAnswer(3,'mere aspirator benzinarie'),false);
 assert.equal(WRONG_ANSWER,'raspuns gresit, Mami. mai incearca.');
});

test('stored correct answers use only lowercase ASCII characters',()=> {
 for(const question of Object.values(questions)) for(const keyword of question.keywords) assert.match(keyword,/^[a-z]+$/);
});
