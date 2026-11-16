import { describe, it, expect } from 'vitest'
import { FAQ_ITEMS } from './faq'

describe('FAQ_ITEMS', () => {
  it('It has between 5 and 7 questions', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5)
    expect(FAQ_ITEMS.length).toBeLessThanOrEqual(7)
  })

  it.each([
    'What is Git Rewind?',
    'Is Git Rewind a GitHub Wrapped alternative?',
    'What permissions does Git Rewind need?',
    'Do you store my data?',
    'Does it include my private repositories?',
    'Is Git Rewind free?',
    'How do I revoke access?',
  ])('It includes the question "%s"', (question) => {
    expect(FAQ_ITEMS.map((item) => item.question)).toContain(question)
  })

  it('It gives every question a non-empty plain-text answer', () => {
    const answers = FAQ_ITEMS.map((item) => item.answer.trim())
    expect(answers.every((answer) => answer.length > 0 && !answer.includes('<'))).toBe(true)
  })

  it('It uses unique questions', () => {
    const questions = FAQ_ITEMS.map((item) => item.question)
    expect(new Set(questions).size).toBe(questions.length)
  })
})
