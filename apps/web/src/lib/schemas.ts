import { z } from 'zod'

// Profile validation schema
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  state: z.string().min(2, 'State must be at least 2 characters'),
  class10_state: z.string().min(2, 'State must be at least 2 characters').optional(),
  class12_state: z.string().min(2, 'State must be at least 2 characters').optional(),
  belonging_state: z.string().min(2, 'State must be at least 2 characters'),
  stream: z.string().optional(),
  current_education: z.string().optional(),
  class_level: z.enum(['10', '12', 'graduate', 'postgraduate'], {
    message: 'Invalid class level',
  }),
  annual_income: z.string().optional(),
  caste_category: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    message: 'Invalid gender',
  }).optional(),
})

// Career validation schema
export const careerSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title must be less than 200 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(200, 'Slug must be less than 200 characters'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description must be less than 2000 characters'),
  avg_salary_min: z.number().min(0, 'Minimum salary must be positive').optional(),
  avg_salary_max: z.number().min(0, 'Maximum salary must be positive').optional(),
  growth_level: z.enum(['Very High', 'High', 'Medium', 'Low'], {
    message: 'Invalid growth level',
  }).optional(),
  competition_level: z.enum(['Low', 'Medium', 'High', 'Very High'], {
    message: 'Invalid competition level',
  }).optional(),
  demand_score: z.number().min(0).max(100).optional(),
  is_trending: z.boolean().optional(),
})

// College validation schema
export const collegeSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  type: z.enum(['Government', 'Private', 'Deemed', 'Autonomous'], {
    message: 'Invalid college type',
  }),
  established_year: z.number().min(1800).max(new Date().getFullYear()).optional(),
  nirf_rank: z.number().min(1).max(200).optional(),
  fees: z.string().optional(),
  courses_offered: z.array(z.string()).optional(),
  placement_percentage: z.number().min(0).max(100).optional(),
  average_package: z.string().optional(),
})

// Exam validation schema
export const examSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  slug: z.string().min(3, 'Slug must be at least 3 characters').max(200),
  conducting_body: z.string().min(2, 'Conducting body is required'),
  exam_date: z.string().optional(),
  last_date_to_apply: z.string().optional(),
  eligibility: z.string().min(10, 'Eligibility must be at least 10 characters').max(1000),
  exam_pattern: z.string().optional(),
  syllabus: z.string().optional(),
  is_popular: z.boolean().optional(),
})

// Scholarship validation schema
export const scholarshipSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(200),
  provider: z.string().min(2, 'Provider is required'),
  category: z.string().optional(),
  level: z.string().optional(),
  field_of_study: z.string().optional(),
  amount_type: z.enum(['fixed', 'range', 'variable'], {
    message: 'Invalid amount type',
  }).optional(),
  amount_min: z.number().min(0).optional(),
  amount_max: z.number().min(0).optional(),
  application_deadline: z.string().optional(),
  application_url: z.string().url('Invalid URL').optional(),
  eligibility_criteria: z.string().min(10).max(2000).optional(),
  scholarship_state: z.string().optional(),
  is_active: z.boolean().optional(),
})

// Login form validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

// Recommendation form validation
export const recommendationSchema = z.object({
  subjects: z.array(z.object({
    subject_id: z.string(),
    score: z.number().min(0).max(100),
    interest: z.number().min(0).max(100),
  })).min(1, 'At least one subject is required'),
  class_level: z.enum(['10', '12', 'graduate', 'postgraduate']),
  stream: z.string().optional(),
})

// Type helpers
export type ProfileInput = z.infer<typeof profileSchema>
export type CareerInput = z.infer<typeof careerSchema>
export type CollegeInput = z.infer<typeof collegeSchema>
export type ExamInput = z.infer<typeof examSchema>
export type ScholarshipInput = z.infer<typeof scholarshipSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RecommendationInput = z.infer<typeof recommendationSchema>
