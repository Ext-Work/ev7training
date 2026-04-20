import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  // Simulate what happens at submit time
  const questions = await prisma.question.findMany({
    take: 5,
  })

  // Simulate user answering ALL correctly based on correct_answer
  const userAnswers: Record<string, number> = {}
  questions.forEach(q => {
    userAnswers[q.id] = q.correct_answer  // user picks the correct answer
  })

  console.log('=== Simulating quiz submit ===')
  console.log('User answers:', JSON.stringify(userAnswers))

  // This is exactly what the submit route does
  const questionIds = Object.keys(userAnswers)
  const fetchedQuestions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
  })

  let correct = 0
  const detailedAnswers = fetchedQuestions.map(q => {
    const selected = userAnswers[q.id]
    const isCorrect = selected === q.correct_answer
    if (isCorrect) correct++
    
    console.log(`\nQ: ${q.question_text.substring(0, 50)}`)
    console.log(`  selected: ${selected} (type: ${typeof selected})`)
    console.log(`  correct_answer: ${q.correct_answer} (type: ${typeof q.correct_answer})`)
    console.log(`  === comparison: ${selected} === ${q.correct_answer} => ${isCorrect}`)
    console.log(`  strict equal: ${selected === q.correct_answer}`)
    console.log(`  loose equal: ${selected == q.correct_answer}`)
    
    return {
      question_id: q.id,
      selected,
      correct: q.correct_answer,
      is_correct: isCorrect,
    }
  })

  const score = fetchedQuestions.length > 0 ? (correct / fetchedQuestions.length) * 100 : 0
  console.log(`\n=== Result: ${correct}/${fetchedQuestions.length} = ${score}% ===`)

  // Now simulate what ACTUALLY happens: user sends number from frontend
  // but the frontend sends it as JSON which could cause type issues
  console.log('\n\n=== Test with string index (simulating JSON body parsing) ===')
  const stringAnswers: Record<string, any> = {}
  questions.forEach(q => {
    stringAnswers[q.id] = q.correct_answer  // this should be number
  })
  
  // Simulate JSON round-trip
  const bodyString = JSON.stringify({ answers: stringAnswers })
  const parsedBody = JSON.parse(bodyString)
  
  console.log('After JSON round-trip, answer types:')
  fetchedQuestions.forEach(q => {
    const sel = parsedBody.answers[q.id]
    console.log(`  selected: ${sel} (type: ${typeof sel}) === correct: ${q.correct_answer} (type: ${typeof q.correct_answer}) => ${sel === q.correct_answer}`)
  })
}

main().catch(console.error).finally(() => { pool.end() })
