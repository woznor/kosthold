import fs from 'node:fs'
import path from 'node:path'
import { buildNutritionAuditReport } from '../src/services/nutritionAudit.js'

const rootDir = path.resolve(process.cwd())
const meals = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/meals.json'), 'utf8'))
const foods = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/matvaretabellen.json'), 'utf8')).foods || []
const matching = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/ingredient-matching.json'), 'utf8'))
const report = buildNutritionAuditReport(meals, foods, matching)
const topMeals = report.mealResults
  .filter((meal) => meal.matchedCount > 0)
  .sort((a, b) => b.coverage - a.coverage || b.matchedCount - a.matchedCount)
  .slice(0, 12)
console.log(JSON.stringify({ summary: report.summary, topMeals, unresolved: report.unresolved }, null, 2))
