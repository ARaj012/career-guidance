export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'url' | 'date'

export type FieldDef = {
  key: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  hint?: string
}

export type ResourceKey = 'careers' | 'colleges' | 'exams' | 'skills' | 'subjects' | 'roadmaps' | 'scholarships' | 'blog'

export type NestedTable = {
  table: string
  label: string
  foreignKey: string
  fields: FieldDef[]
  orderBy?: { column: string; ascending: boolean }
}

export type ResourceDef = {
  key: ResourceKey
  table: string
  label: string
  singular: string
  searchColumns: string[]
  listColumns: { key: string; label: string }[]
  fields: FieldDef[]
  nested?: NestedTable[]
}

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  careers: {
    key: 'careers',
    table: 'careers',
    label: 'Careers',
    singular: 'Career',
    searchColumns: ['title', 'slug', 'category'],
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'demand_score', label: 'Demand' },
      { key: 'growth_level', label: 'Growth' },
      { key: 'is_trending', label: 'Trending' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true, hint: 'URL path, e.g. software-engineer' },
      { key: 'description', label: 'Description', type: 'textarea' },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          'Technology', 'Medical', 'Engineering', 'Finance', 'Law', 'Government',
          'Education', 'Research', 'Design', 'Media', 'Management', 'Agriculture', 'Defence',
        ],
      },
      { key: 'avg_salary_min', label: 'Salary min (₹/year)', type: 'number' },
      { key: 'avg_salary_max', label: 'Salary max (₹/year)', type: 'number' },
      { key: 'salary_currency', label: 'Currency', type: 'text', hint: 'Usually INR' },
      { key: 'growth_level', label: 'Growth', type: 'select', options: ['Very High', 'High', 'Medium', 'Low'] },
      { key: 'competition_level', label: 'Competition', type: 'select', options: ['Very High', 'High', 'Medium', 'Low'] },
      { key: 'demand_score', label: 'Demand score (1–10)', type: 'number' },
      { key: 'work_life_balance', label: 'Work-life balance (1–10)', type: 'number' },
      { key: 'is_trending', label: 'Trending', type: 'boolean' },
    ],
  },
  colleges: {
    key: 'colleges',
    table: 'colleges',
    label: 'Colleges',
    singular: 'College',
    searchColumns: ['name', 'slug', 'city', 'state'],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'city', label: 'City' },
      { key: 'type', label: 'Type' },
      { key: 'nirf_rank', label: 'NIRF' },
      { key: 'is_featured', label: 'Featured' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'about', label: 'About', type: 'textarea' },
      { key: 'type', label: 'Type', type: 'select', options: ['Government', 'Private', 'Deemed'] },
      { key: 'city', label: 'City', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'nirf_rank', label: 'NIRF rank', type: 'number' },
      { key: 'qs_rank', label: 'QS rank', type: 'number' },
      { key: 'naac_grade', label: 'NAAC grade', type: 'select', options: ['A++', 'A+', 'A', 'B+', 'B', 'C'] },
      { key: 'established_year', label: 'Established year', type: 'number' },
      { key: 'website_url', label: 'Website', type: 'url' },
      { key: 'total_students', label: 'Total students', type: 'number' },
      { key: 'annual_fees_min', label: 'Fees min (₹/year)', type: 'number' },
      { key: 'annual_fees_max', label: 'Fees max (₹/year)', type: 'number' },
      { key: 'fee_note', label: 'Fee note', type: 'text' },
      { key: 'is_featured', label: 'Featured', type: 'boolean' },
    ],
    nested: [
      {
        table: 'college_courses',
        label: 'Courses',
        foreignKey: 'college_id',
        fields: [
          { key: 'course_name', label: 'Course name', type: 'text', required: true },
          { key: 'degree_type', label: 'Degree type', type: 'select', options: ['Undergraduate', 'Postgraduate', 'Doctoral', 'Diploma'] },
          { key: 'duration_years', label: 'Duration (years)', type: 'number' },
          { key: 'total_seats', label: 'Seats', type: 'number' },
          { key: 'annual_fees', label: 'Annual fees (₹)', type: 'number' },
        ],
      },
      {
        table: 'college_exam_cutoffs',
        label: 'Admission cutoffs',
        foreignKey: 'college_id',
        orderBy: { column: 'year', ascending: false },
        fields: [
          { key: 'exam_id', label: 'Exam ID', type: 'text', required: true, hint: 'UUID from the exam you are editing in Exams' },
          { key: 'year', label: 'Year', type: 'number', required: true },
          { key: 'category', label: 'Category', type: 'text', hint: 'e.g. General, OBC, SC, ST, EWS' },
          { key: 'cutoff_score', label: 'Cutoff score', type: 'number' },
          { key: 'cutoff_rank', label: 'Cutoff rank', type: 'number' },
        ],
      },
      {
        table: 'college_placements',
        label: 'Placements',
        foreignKey: 'college_id',
        orderBy: { column: 'year', ascending: false },
        fields: [
          { key: 'year', label: 'Year', type: 'number', required: true },
          { key: 'placement_rate', label: 'Placement rate %', type: 'number' },
          { key: 'average_package', label: 'Average package (₹)', type: 'number' },
          { key: 'median_package', label: 'Median package (₹)', type: 'number' },
          { key: 'highest_package', label: 'Highest package (₹)', type: 'number' },
          { key: 'top_recruiters', label: 'Top recruiters', type: 'textarea' },
          { key: 'source_url', label: 'Source URL', type: 'url' },
        ],
      },
    ],
  },
  exams: {
    key: 'exams',
    table: 'exams',
    label: 'Exams',
    singular: 'Exam',
    searchColumns: ['name', 'slug', 'conducting_body'],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'conducting_body', label: 'Body' },
      { key: 'exam_level', label: 'Level' },
      { key: 'mode', label: 'Mode' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'conducting_body', label: 'Conducting body', type: 'text' },
      { key: 'exam_level', label: 'Level', type: 'select', options: ['National', 'State', 'International', 'University'] },
      { key: 'exam_type', label: 'Exam type', type: 'text', hint: 'e.g. Entrance, Recruitment' },
      { key: 'mode', label: 'Mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'] },
      { key: 'frequency', label: 'Frequency', type: 'text', hint: 'e.g. Once a year, Twice a year' },
      { key: 'official_url', label: 'Official URL', type: 'url' },
    ],
    nested: [
      {
        table: 'exam_schedules',
        label: 'Schedules',
        foreignKey: 'exam_id',
        orderBy: { column: 'year', ascending: false },
        fields: [
          { key: 'year', label: 'Year', type: 'number', required: true },
          { key: 'registration_start', label: 'Registration start', type: 'date' },
          { key: 'registration_end', label: 'Registration end', type: 'date' },
          { key: 'exam_date_start', label: 'Exam date', type: 'date' },
          { key: 'result_date', label: 'Result date', type: 'date' },
          { key: 'total_applicants', label: 'Applicants', type: 'number' },
          { key: 'total_selected', label: 'Selected', type: 'number' },
        ],
      },
      {
        table: 'exam_eligibility',
        label: 'Eligibility',
        foreignKey: 'exam_id',
        fields: [
          { key: 'class_required', label: 'Class required', type: 'text' },
          { key: 'stream_required', label: 'Stream required', type: 'text' },
          { key: 'min_percentage', label: 'Min %', type: 'number' },
          { key: 'age_min', label: 'Age min', type: 'number' },
          { key: 'age_max', label: 'Age max', type: 'number' },
        ],
      },
      {
        table: 'exam_pattern',
        label: 'Pattern / stages',
        foreignKey: 'exam_id',
        orderBy: { column: 'stage_order', ascending: true },
        fields: [
          { key: 'stage', label: 'Stage', type: 'text', hint: 'e.g. Prelims, Mains' },
          { key: 'stage_order', label: 'Stage order', type: 'number' },
          { key: 'mode', label: 'Mode', type: 'text' },
          { key: 'duration_minutes', label: 'Duration (minutes)', type: 'number' },
          { key: 'total_questions', label: 'Total questions', type: 'number' },
          { key: 'total_marks', label: 'Total marks', type: 'number' },
          { key: 'question_type', label: 'Question type', type: 'text' },
          { key: 'marks_per_correct', label: 'Marks per correct', type: 'number' },
          { key: 'negative_marking', label: 'Negative marking', type: 'number' },
          { key: 'languages', label: 'Languages', type: 'text' },
          { key: 'qualifying_note', label: 'Qualifying note', type: 'textarea' },
          { key: 'attempts_note', label: 'Attempts note', type: 'textarea' },
          { key: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
      {
        table: 'exam_syllabus',
        label: 'Syllabus topics',
        foreignKey: 'exam_id',
        fields: [
          { key: 'stage', label: 'Stage', type: 'text' },
          { key: 'subject', label: 'Subject', type: 'text', required: true },
          { key: 'topic', label: 'Topic', type: 'text' },
          { key: 'weightage', label: 'Weightage', type: 'number' },
        ],
      },
    ],
  },
  skills: {
    key: 'skills',
    table: 'skills',
    label: 'Skills',
    singular: 'Skill',
    searchColumns: ['name', 'category'],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'category', label: 'Category' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  subjects: {
    key: 'subjects',
    table: 'subjects',
    label: 'Subjects',
    singular: 'Subject',
    searchColumns: ['name', 'stream'],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'stream', label: 'Stream' },
      { key: 'class_level', label: 'Class Level' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'stream', label: 'Stream', type: 'select', options: ['Science', 'Commerce', 'Arts', 'Vocational', 'All'] },
      { key: 'class_level', label: 'Class Level', type: 'text', hint: 'e.g. Class 10, Class 12' },
      { key: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  roadmaps: {
    key: 'roadmaps',
    table: 'roadmaps',
    label: 'Roadmaps',
    singular: 'Roadmap',
    searchColumns: ['title', 'description'],
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'career_id', label: 'Career ID' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'career_id', label: 'Career ID', type: 'text', required: true, hint: 'UUID from careers table' },
    ],
    nested: [
      {
        table: 'roadmap_nodes',
        label: 'Roadmap Nodes',
        foreignKey: 'roadmap_id',
        orderBy: { column: 'phase_number', ascending: true },
        fields: [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'description', label: 'Description', type: 'textarea' },
          { key: 'phase_number', label: 'Phase Number', type: 'number', required: true },
          { key: 'duration_months', label: 'Duration (months)', type: 'number' },
          { key: 'skills_required', label: 'Skills Required', type: 'textarea' },
          { key: 'resources', label: 'Resources', type: 'textarea' },
        ],
      },
    ],
  },
  scholarships: {
    key: 'scholarships',
    table: 'scholarships',
    label: 'Scholarships',
    singular: 'Scholarship',
    searchColumns: ['name', 'provider', 'category'],
    listColumns: [
      { key: 'name', label: 'Name' },
      { key: 'provider', label: 'Provider' },
      { key: 'category', label: 'Category' },
      { key: 'level', label: 'Level' },
      { key: 'is_active', label: 'Active' },
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'provider', label: 'Provider', type: 'text', required: true },
      { key: 'amount_min', label: 'Amount min (₹)', type: 'number' },
      { key: 'amount_max', label: 'Amount max (₹)', type: 'number' },
      { key: 'amount_type', label: 'Amount type', type: 'select', options: ['fixed', 'range', 'full_tuition', 'partial_tuition', 'stipend'] },
      { key: 'eligibility_criteria', label: 'Eligibility criteria', type: 'textarea' },
      { key: 'required_documents', label: 'Required documents', type: 'textarea', hint: 'Comma-separated list (e.g., 10th marksheet, 12th marksheet, Aadhar card)' },
      { key: 'application_deadline', label: 'Application deadline', type: 'date' },
      { key: 'application_url', label: 'Application URL', type: 'url' },
      { key: 'category', label: 'Category', type: 'select', options: ['merit', 'need_based', 'sports', 'arts', 'minority', 'women', 'general'] },
      { key: 'level', label: 'Level', type: 'select', options: ['school', 'undergraduate', 'postgraduate', 'phd'] },
      { key: 'field_of_study', label: 'Field of study', type: 'textarea', hint: 'Comma-separated list (e.g., Engineering, Medical, Arts)' },
      { key: 'country', label: 'Country', type: 'text' },
      { key: 'state', label: 'State', type: 'text' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
  blog: {
    key: 'blog',
    table: 'blog_posts',
    label: 'Blog Posts',
    singular: 'Blog Post',
    searchColumns: ['title', 'author', 'category'],
    listColumns: [
      { key: 'title', label: 'Title' },
      { key: 'author', label: 'Author' },
      { key: 'category', label: 'Category' },
      { key: 'is_published', label: 'Published' },
    ],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'slug', label: 'Slug', type: 'text', required: true },
      { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
      { key: 'content', label: 'Content', type: 'textarea', required: true, hint: 'HTML content' },
      { key: 'author', label: 'Author', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['career_tips', 'exam_prep', 'industry_news', 'success_stories', 'study_tips'] },
      { key: 'cover_image', label: 'Cover image URL', type: 'url' },
      { key: 'tags', label: 'Tags', type: 'textarea', hint: 'Comma-separated list (e.g., career, exam, tips)' },
      { key: 'is_published', label: 'Published', type: 'boolean' },
      { key: 'published_at', label: 'Published at', type: 'date' },
    ],
  },
}

export const NESTED_TABLES = new Set(
  Object.values(RESOURCES).flatMap((r) => r.nested?.map((n) => n.table) ?? [])
)

export const WRITABLE_TABLES = new Set<string>([
  ...Object.values(RESOURCES).map((r) => r.table),
  ...NESTED_TABLES,
  'admin_reviews',
  'user_accounts',
  'admin_audit_logs',
  'admin_notifications',
  'user_scholarship_applications',
])

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
