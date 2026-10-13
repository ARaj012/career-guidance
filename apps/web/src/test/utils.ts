import { render, RenderOptions } from '@testing-library/react'
import { ReactElement } from 'react'

// Custom render function with providers if needed
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, options)
}

// Mock data for tests (only used in test environment)
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
}

export const mockCareer = {
  id: '1',
  name: 'Software Engineer',
  description: 'Develop and maintain software applications',
  salary_range: '₹8-25 LPA',
  growth_rate: '22%',
  skills_required: ['Programming', 'Problem Solving', 'Communication'],
  education_required: 'B.Tech/B.E. in Computer Science',
  is_trending: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockCollege = {
  id: '1',
  name: 'IIT Bombay',
  city: 'Mumbai',
  state: 'Maharashtra',
  type: 'Government',
  established_year: 1958,
  nirf_rank: 3,
  fees: '₹2-3 Lakhs',
  courses_offered: ['B.Tech', 'M.Tech', 'PhD'],
  placement_percentage: 95,
  average_package: '₹18 LPA',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockExam = {
  id: '1',
  name: 'JEE Main',
  conducting_body: 'NTA',
  exam_date: '2024-04-01',
  last_date_to_apply: '2024-02-15',
  eligibility: '10+2 with PCM',
  exam_pattern: 'Computer Based Test',
  syllabus: 'Physics, Chemistry, Mathematics',
  is_popular: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}
