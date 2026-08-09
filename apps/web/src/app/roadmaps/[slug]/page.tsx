/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type Step = { title: string; description?: string; duration?: string }

// ────────────────────────────────────────────────────────────────
// Per-category guidance used to make the auto-generated roadmap
// feel specific and detailed, even without hand-written data.
// Every category has 5 phases worth of granular steps, each with
// a short "why/how" description — not just a title.
// ────────────────────────────────────────────────────────────────
const CATEGORY_GUIDANCE: Record<
  string,
  {
    stream: string
    foundation: Step[]
    degree: Step[]
    certifications: Step[]
    entry: Step[]
    growth: Step[]
    resources: string[]
  }
> = {
  Technology: {
    stream: 'Science with Maths (PCM) — Computer Science as a subject helps but is not mandatory',
    foundation: [
      { title: 'Build logical & mathematical thinking', description: 'Focus on algebra, coordinate geometry, and basic discrete math — these underpin most CS concepts.', duration: 'Class 11-12' },
      { title: 'Learn basic programming (Python)', description: 'Start with Python for its simple syntax; build small scripts and automate simple tasks.', duration: '3-6 months' },
      { title: 'Join coding clubs or online judges', description: 'Practice on platforms like HackerRank or Codeforces to build problem-solving speed.', duration: 'Ongoing' },
      { title: 'Explore a beginner project', description: 'Build something small end-to-end — a to-do app, a simple website — to see how pieces fit together.', duration: '1-2 months' },
    ],
    degree: [
      { title: 'Pursue B.Tech/B.E. in CS, IT, or a related branch', description: 'Alternatively, a BCA/B.Sc in Computer Science is a valid, cheaper path into tech roles.', duration: '4 years' },
      { title: 'Master data structures & algorithms', description: 'This is the single biggest factor in cracking tech interviews — start by year 2.', duration: '1 year' },
      { title: 'Build 3-4 real projects', description: 'Pick projects with a database, an API, and a frontend — not just tutorials copied line-by-line.', duration: '1 year' },
      { title: 'Do at least one internship before final year', description: 'Even unpaid or startup internships teach you real-world codebases and collaboration.', duration: '2-6 months' },
      { title: 'Contribute to open-source or hackathons', description: 'Great for building a public portfolio recruiters can actually check.', duration: 'Ongoing' },
    ],
    certifications: [
      { title: 'AWS/Azure/GCP cloud fundamentals', description: 'Cloud certifications are increasingly expected even for fresher SDE roles.', duration: '2-3 months' },
      { title: 'A specialisation certificate (ML, Web, or DevOps)', description: 'Pick one based on your interest — depth beats breadth for interviews.', duration: '3-4 months' },
    ],
    entry: [
      { title: 'Apply for SDE/analyst internships in 3rd year', description: 'Most product companies convert strong interns into full-time offers.', duration: '3-6 months' },
      { title: 'Prepare systematically for interviews', description: 'DSA rounds, one system-design round, and behavioral questions — practice all three.', duration: '3-6 months' },
      { title: 'Build a strong LinkedIn + portfolio site', description: 'Recruiters check both — keep projects, and a short bio on what you build.', duration: '2 weeks' },
    ],
    growth: [
      { title: 'Move from IC to specialist or lead track', description: 'After 2-3 years, choose between deepening technical expertise or people management.', duration: '2-3 years in' },
      { title: 'Keep shipping visible, high-impact work', description: 'Promotions in tech are driven by scope and impact, not just tenure.', duration: 'Ongoing' },
      { title: 'Consider higher studies (MS) or switching to product/founder roles', description: 'Optional paths once you have 3-5 years of experience.', duration: '3-5 years in' },
    ],
    resources: ['NCERT Maths/CS textbooks', 'freeCodeCamp / CS50 (free online courses)', 'LeetCode / Codeforces for practice', 'College placement cell resources'],
  },
  Medical: {
    stream: 'Science with Biology (PCB)',
    foundation: [
      { title: 'Prioritise Biology, Chemistry, and Physics', description: 'NEET weights Biology heavily (50% of marks) — give it proportionate time.', duration: 'Class 11-12' },
      { title: 'Build a strong NCERT-first habit', description: 'The vast majority of NEET questions are directly NCERT-based — master it before external material.', duration: 'Ongoing' },
      { title: 'Start NEET-oriented practice early', description: 'Begin topic-wise MCQ practice from Class 11 rather than waiting till Class 12.', duration: '2 years' },
      { title: 'Take regular mock tests', description: 'Simulated exam conditions build speed and accuracy under pressure.', duration: 'Last 6 months before NEET' },
    ],
    degree: [
      { title: 'Clear NEET-UG', description: 'A single national exam determines admission to all MBBS/BDS seats in India.', duration: '1 attempt cycle' },
      { title: 'Complete MBBS coursework', description: 'Pre-clinical, para-clinical, and clinical phases across 4.5 years.', duration: '4.5 years' },
      { title: 'Complete mandatory rotating internship', description: 'Hands-on clinical exposure across departments before you can practice independently.', duration: '1 year' },
      { title: 'Register with the National Medical Commission', description: 'Required to legally practice medicine in India after internship.', duration: '1 month' },
    ],
    certifications: [
      { title: 'Clear NEET-PG for specialisation', description: 'Required to pursue MD/MS in a specific specialty.', duration: '1 year prep' },
      { title: 'BLS/ACLS certifications', description: 'Basic and advanced life support certifications are valued and sometimes required by hospitals.', duration: '1-2 weeks' },
    ],
    entry: [
      { title: 'Apply for junior resident / house surgeon roles', description: 'Common entry points at government or private hospitals post-internship.', duration: '3-6 months' },
      { title: 'Consider government postings (PHC/rural service)', description: 'Some states mandate a rural posting bond; check state-specific rules.', duration: '1-2 years' },
      { title: 'Explore MD/MS or DNB after NEET-PG', description: 'Specialisation significantly increases both scope and earning potential.', duration: '3 years' },
    ],
    growth: [
      { title: 'Build a specialty practice or hospital attachment', description: 'Reputation and referrals matter heavily in growing a medical career.', duration: '3-5 years in' },
      { title: 'Consider super-specialisation (DM/MCh)', description: 'For further depth in fields like cardiology, neurology, etc.', duration: '3 years' },
      { title: 'Explore private practice, academia, or research', description: 'Career paths diverge significantly after specialisation — pick based on interest.', duration: 'Ongoing' },
    ],
    resources: ['NCERT Biology/Chemistry/Physics textbooks', 'NEET coaching material (Aakash, Allen)', 'National Medical Commission guidelines', 'Standard clinical textbooks during MBBS'],
  },
  Engineering: {
    stream: 'Science with Maths (PCM)',
    foundation: [
      { title: 'Build strong Physics & Maths fundamentals', description: 'Mechanics, calculus, and vectors form the base for every engineering branch.', duration: 'Class 11-12' },
      { title: 'Develop spatial and hands-on problem solving', description: 'Try model-building, basic circuits, or robotics kits to build intuition.', duration: 'Ongoing' },
      { title: 'Explore branches before choosing one', description: 'Read about Mechanical, Civil, Electrical, CS etc. to make an informed JEE branch choice.', duration: '3-6 months' },
    ],
    degree: [
      { title: 'Clear JEE Main/Advanced or a state CET', description: 'Determines which college and branch you get into.', duration: '1-2 years prep' },
      { title: 'Complete B.Tech/B.E. in your branch', description: 'Core courses plus electives relevant to your specialisation.', duration: '4 years' },
      { title: 'Learn industry-standard tools for your branch', description: 'E.g. AutoCAD/STAAD Pro for Civil, MATLAB for Electrical, SolidWorks for Mechanical.', duration: '6-12 months' },
      { title: 'Do practical internships or site/lab work', description: 'Classroom theory only goes so far — real exposure matters to recruiters.', duration: '2-6 months' },
    ],
    certifications: [
      { title: 'Branch-specific professional certification', description: 'E.g. Chartered Engineer status, Six Sigma, or software certifications depending on branch.', duration: '3-6 months' },
    ],
    entry: [
      { title: 'Apply to core companies in your branch', description: 'L&T, Tata, Siemens, and similar depending on specialisation.', duration: '3-6 months' },
      { title: 'Consider GATE for PSU jobs or M.Tech', description: 'A strong GATE score opens PSU recruitment and postgraduate options.', duration: '1 year prep' },
      { title: 'Build a portfolio of practical projects', description: 'Design projects, site reports, or working prototypes strengthen your resume.', duration: 'Ongoing' },
    ],
    growth: [
      { title: 'Specialise into design, project management, or R&D', description: 'Career paths diverge after 2-3 years of core experience.', duration: '2-3 years in' },
      { title: 'Pursue an M.Tech or MBA for leadership roles', description: 'Common route into senior technical or managerial positions.', duration: '2 years' },
      { title: 'Consider PSU or government technical roles', description: 'Offer strong stability and structured career progression.', duration: 'Ongoing' },
    ],
    resources: ['NCERT Physics/Maths textbooks', 'JEE coaching material', 'Branch-specific NPTEL courses', 'College placement cell'],
  },
  Finance: {
    stream: 'Commerce (with or without Maths)',
    foundation: [
      { title: 'Build strong numerical and analytical skills', description: 'Comfort with percentages, ratios, and basic statistics is essential.', duration: 'Class 11-12' },
      { title: 'Learn basic accounting and economics concepts', description: 'Understand balance sheets, P&L statements, and macroeconomic basics.', duration: 'Ongoing' },
      { title: 'Follow business news and markets', description: 'Read financial newspapers regularly to build market awareness.', duration: 'Ongoing' },
    ],
    degree: [
      { title: 'Pursue B.Com/BBA, or start CA/CFA directly', description: 'CA can be started right after Class 12 via the Foundation route.', duration: '3-4 years' },
      { title: 'Clear relevant professional exams', description: 'CA (ICAI), CFA (institute), or CS depending on your target role.', duration: '2-4 years' },
      { title: 'Complete articleship/internship', description: 'CA articleship gives 3 years of hands-on practical training — mandatory for qualification.', duration: '3 years (CA) / 2-6 months (others)' },
    ],
    certifications: [
      { title: 'CFA Level 1-3', description: 'Globally recognised for investment/finance analyst roles.', duration: '2-3 years' },
      { title: 'NISM/SEBI certifications', description: 'Required for specific roles in trading, research, or advisory.', duration: '1-2 months each' },
    ],
    entry: [
      { title: 'Apply to audit firms, banks, or corporate finance teams', description: 'Big 4 firms, banks, and NBFCs are common entry points.', duration: '3-6 months' },
      { title: 'Build expertise in Excel & financial modelling', description: 'A practical skill tested in almost every finance interview.', duration: '2-3 months' },
      { title: 'Consider an MBA in Finance', description: 'Useful for moving into strategic or leadership finance roles later.', duration: '2 years' },
    ],
    growth: [
      { title: 'Move from execution to advisory/strategy roles', description: 'Senior finance roles focus more on judgement than processing.', duration: '3-5 years in' },
      { title: 'Specialise into IB, PE/VC, or corporate finance', description: 'Each path has different entry routes and required credentials.', duration: 'Ongoing' },
      { title: 'Build a professional network in the industry', description: 'Finance careers grow heavily through referrals and reputation.', duration: 'Ongoing' },
    ],
    resources: ['ICAI/ICFAI study material', 'CFA Institute curriculum', 'Business newspapers (Economic Times, Mint)', 'Excel/financial modelling courses'],
  },
  Law: {
    stream: 'Any stream (Humanities is common, but not mandatory)',
    foundation: [
      { title: 'Build reading comprehension and reasoning skills', description: 'CLAT tests these heavily — start practicing passage-based questions early.', duration: 'Class 11-12' },
      { title: 'Stay updated on current affairs and legal news', description: 'Especially important for CLAT GK and later for legal practice.', duration: 'Ongoing' },
      { title: 'Practice argumentation via debate/MUNs', description: 'Builds the structured-argument skills central to legal reasoning.', duration: 'Ongoing' },
    ],
    degree: [
      { title: 'Clear CLAT or other law entrance exams', description: 'Determines admission to National Law Universities and top private colleges.', duration: '1 year prep' },
      { title: 'Pursue 5-year integrated LLB or 3-year LLB', description: '5-year route starts after Class 12; 3-year route requires a prior bachelor’s degree.', duration: '3-5 years' },
      { title: 'Intern with law firms, chambers, or NGOs', description: 'Most law colleges require multiple internships during the course — start early.', duration: '2-3 months per internship' },
      { title: 'Participate in moot courts', description: 'Highly valued by litigation and corporate law recruiters alike.', duration: 'Ongoing' },
    ],
    certifications: [
      { title: 'Register with the Bar Council of India', description: 'Mandatory to practice law after graduation — includes clearing the AIBE.', duration: '3-6 months' },
    ],
    entry: [
      { title: 'Join a law firm, litigation practice, or in-house legal team', description: 'Corporate firms, litigation chambers, and companies all hire fresh law graduates.', duration: '3-6 months' },
      { title: 'Build a specialisation area', description: 'E.g. corporate law, IP, criminal law, or tax law — specialising helps long-term growth.', duration: '1-2 years in' },
    ],
    growth: [
      { title: 'Move from associate to senior associate/partner track', description: 'Typical progression in law firms over 5-8 years.', duration: '5-8 years in' },
      { title: 'Consider LLM or judiciary exams', description: 'Alternate paths into academia, specialised practice, or the judiciary.', duration: '1-2 years' },
      { title: 'Build an independent practice', description: 'Common long-term path for litigators after gaining sufficient experience.', duration: 'Ongoing' },
    ],
    resources: ['CLAT prep material', 'Bare Acts & standard legal textbooks', 'Legal news sites (Bar & Bench, LiveLaw)', 'Moot court guides'],
  },
  Government: {
    stream: 'Any stream (Arts/Humanities is common for UPSC)',
    foundation: [
      { title: 'Build broad general knowledge', description: 'History, geography, polity, and economy form the base of the UPSC syllabus.', duration: 'Ongoing' },
      { title: 'Develop strong reading and writing skills', description: 'Mains requires structured long-form answers — practice writing regularly.', duration: 'Ongoing' },
      { title: 'Start NCERT-based foundational reading early', description: 'NCERTs (Class 6-12) are the standard starting point for UPSC prep.', duration: '1 year' },
    ],
    degree: [
      { title: 'Complete any bachelor’s degree', description: 'Stream does not matter for UPSC eligibility — pick based on genuine interest.', duration: '3-4 years' },
      { title: 'Start Prelims + Mains preparation systematically', description: 'Typically needs 1-2 years of dedicated preparation alongside or after graduation.', duration: '1-2 years' },
      { title: 'Choose and study an optional subject', description: 'A key scoring component of the UPSC Mains exam.', duration: '6-12 months' },
      { title: 'Join test series and attempt mocks', description: 'Simulated practice is critical for time management under exam conditions.', duration: 'Final 6 months' },
    ],
    certifications: [],
    entry: [
      { title: 'Clear Prelims, Mains, and Interview', description: 'The three-stage UPSC Civil Services Examination process.', duration: '1 year cycle' },
      { title: 'Complete Foundation training at the relevant academy', description: 'E.g. LBSNAA for IAS, SVPNPA for IPS.', duration: '1-2 years' },
      { title: 'Get posted for field/administrative training', description: 'On-the-job training under senior officers before independent postings.', duration: '1-2 years' },
    ],
    growth: [
      { title: 'Progress through the seniority-based cadre system', description: 'Promotions follow a structured timeline based on service and performance.', duration: 'Ongoing' },
      { title: 'Take on progressively senior administrative roles', description: 'From sub-divisional postings to district and state-level leadership over a career.', duration: '10+ years' },
      { title: 'Consider central deputation opportunities', description: 'Officers can serve in central ministries at various points in their career.', duration: 'Ongoing' },
    ],
    resources: ['NCERT textbooks (Class 6-12)', 'Standard UPSC reference books', 'PIB / The Hindu for current affairs', 'UPSC-recognised test series'],
  },
  Education: {
    stream: 'Any stream, based on the subject you want to teach',
    foundation: [
      { title: 'Develop strong communication skills', description: 'Practice explaining concepts clearly — tutor juniors or peers to build this early.', duration: 'Ongoing' },
      { title: 'Build deep subject-matter expertise', description: 'Choose a subject you can go deep into, since you will teach it for years.', duration: 'Class 11-12' },
      { title: 'Get comfortable with basic teaching tools', description: 'Presentation software, whiteboards, and increasingly ed-tech platforms.', duration: '1-2 months' },
    ],
    degree: [
      { title: 'Complete a bachelor’s degree in your subject', description: 'Subject depth matters more than the specific college for teaching roles.', duration: '3 years' },
      { title: 'Complete a B.Ed', description: 'Required for most school teaching positions in India.', duration: '2 years' },
      { title: 'Gain classroom experience', description: 'Through internships, tutoring, or teaching assistantships during your degree.', duration: 'Ongoing' },
    ],
    certifications: [
      { title: 'Clear CTET/state TET', description: 'Mandatory certification for most government and many private school teaching jobs.', duration: '3-6 months prep' },
    ],
    entry: [
      { title: 'Apply to schools, coaching institutes, or ed-tech platforms', description: 'Entry points vary widely in pay and structure — compare based on your goals.', duration: '3-6 months' },
      { title: 'Consider NET/PhD for college-level teaching', description: 'Required path if you want to teach at the undergraduate/postgraduate level.', duration: '2-5 years' },
    ],
    growth: [
      { title: 'Move into senior teacher, coordinator, or HOD roles', description: 'Typical progression within a school over several years.', duration: '5+ years in' },
      { title: 'Build a personal teaching brand or content library', description: 'Increasingly valuable given the growth of ed-tech platforms.', duration: 'Ongoing' },
      { title: 'Consider administrative roles (principal, academic director)', description: 'A common long-term path for experienced educators.', duration: '10+ years in' },
    ],
    resources: ['NCERT/subject textbooks', 'CTET/TET prep material', 'B.Ed coursework resources', 'Ed-tech platforms for content creation'],
  },
  Research: {
    stream: 'Science stream aligned to your research interest',
    foundation: [
      { title: 'Build strong conceptual depth', description: 'Research rewards deep understanding over rote learning — focus on "why", not just "what".', duration: 'Class 11-12' },
      { title: 'Develop curiosity through projects and olympiads', description: 'Science fairs and olympiads are a good early signal of research aptitude.', duration: 'Ongoing' },
      { title: 'Learn to read academic papers', description: 'Start with review articles in your area of interest to get comfortable with the format.', duration: '6 months' },
    ],
    degree: [
      { title: 'Pursue a B.Sc/B.Tech in your area', description: 'Choose a specialisation aligned with your long-term research interest.', duration: '3-4 years' },
      { title: 'Pursue an M.Sc or integrated masters', description: 'Deepens subject expertise and typically includes a research project/thesis.', duration: '2 years' },
      { title: 'Qualify CSIR-NET/GATE', description: 'Required for research fellowships and PhD admissions in India.', duration: '1 year prep' },
    ],
    certifications: [],
    entry: [
      { title: 'Pursue a PhD with an aligned research group', description: 'Choosing the right advisor and lab matters more than the institute name alone.', duration: '4-6 years' },
      { title: 'Publish papers and present at conferences', description: 'Builds your research profile and is essential for future positions.', duration: 'Throughout PhD' },
      { title: 'Apply for postdoctoral positions', description: 'Typical next step after a PhD before permanent academic/industry roles.', duration: '2-4 years' },
    ],
    growth: [
      { title: 'Move into academia, national labs, or industry R&D', description: 'Each path has different expectations around publishing vs. applied output.', duration: 'Post-postdoc' },
      { title: 'Build an independent research program', description: 'For academic tracks — involves grant writing and mentoring students.', duration: 'Ongoing' },
      { title: 'Consider applied/industry research roles', description: 'Often better compensated with a faster path to real-world impact.', duration: 'Ongoing' },
    ],
    resources: ['NPTEL / MOOC courses', 'Google Scholar for papers', 'CSIR-NET/GATE prep material', 'Departmental seminars & journal clubs'],
  },
  Design: {
    stream: 'Any stream, though Arts/Science both work well',
    foundation: [
      { title: 'Build a sketching & observation habit', description: 'Daily sketching, even rough, sharpens visual thinking fast.', duration: 'Ongoing' },
      { title: 'Explore design tools early', description: 'Figma is free and browser-based — a good first tool to learn.', duration: '2-3 months' },
      { title: 'Build a small personal portfolio', description: 'Even a handful of practice projects help at the application stage.', duration: '6 months' },
    ],
    degree: [
      { title: 'Clear NID/UCEED or relevant design entrance exams', description: 'The primary gateway to India’s top design schools.', duration: '1 year prep' },
      { title: 'Pursue a B.Des in your specialisation', description: 'E.g. Product, Communication, UX, Fashion, or Industrial Design.', duration: '4 years' },
      { title: 'Build a strong portfolio through projects', description: 'This matters more than grades for design job applications.', duration: 'Ongoing' },
      { title: 'Do design internships', description: 'Agency or in-house internships teach real client/stakeholder workflows.', duration: '3-6 months' },
    ],
    certifications: [
      { title: 'Specialised tool certifications (Adobe, Figma)', description: 'Useful but secondary to a strong portfolio.', duration: '1-2 months' },
    ],
    entry: [
      { title: 'Apply for design internships at product/agency companies', description: 'A common and effective entry point into the industry.', duration: '3-6 months' },
      { title: 'Publish and refine your portfolio', description: 'Keep it updated on Behance/Dribbble as you do more work.', duration: 'Ongoing' },
    ],
    growth: [
      { title: 'Specialise into UI/UX, product, or industrial design', description: 'Most designers narrow focus after 1-2 years of generalist experience.', duration: '1-2 years in' },
      { title: 'Move into design lead or design manager roles', description: 'Typical senior progression after 4-6 years.', duration: '4-6 years in' },
      { title: 'Consider freelancing or founding a studio', description: 'A viable path for designers with a strong network and portfolio.', duration: 'Ongoing' },
    ],
    resources: ['NID/UCEED prep material', 'Behance/Dribbble for inspiration', 'Figma/Adobe tutorials', 'Design case study write-ups'],
  },
  Media: {
    stream: 'Any stream, Humanities is common but not required',
    foundation: [
      { title: 'Build strong writing and storytelling skills', description: 'Start a blog, journal, or short-video practice to build a habit.', duration: 'Ongoing' },
      { title: 'Create content as practice', description: 'Photography, video, or writing — any consistent output builds skill fast.', duration: 'Ongoing' },
      { title: 'Stay updated with current affairs and media trends', description: 'Especially important for journalism-focused paths.', duration: 'Ongoing' },
    ],
    degree: [
      { title: 'Pursue a degree/diploma in Journalism, Mass Comm, or Film', description: 'Reputed institutes include IIMC, Xavier Institute of Communication, FTII.', duration: '2-3 years' },
      { title: 'Intern with media houses or production houses', description: 'Real newsroom or set experience is invaluable and often required.', duration: '2-3 months per internship' },
      { title: 'Build a portfolio of published or produced work', description: 'Bylines, edited reels, or a produced short film all count.', duration: 'Ongoing' },
    ],
    certifications: [],
    entry: [
      { title: 'Apply to media houses, OTT platforms, or agencies', description: 'Entry-level reporter, editor, or production assistant roles are common starting points.', duration: '3-6 months' },
      { title: 'Keep building an independent audience/portfolio', description: 'A personal brand can open opportunities that formal applications don’t.', duration: 'Ongoing' },
    ],
    growth: [
      { title: 'Specialise into reporting, production, direction, or editing', description: 'Career paths diverge significantly based on your chosen craft.', duration: '1-2 years in' },
      { title: 'Move into senior editorial or creative lead roles', description: 'Typical progression with 4-6 years of consistent, visible work.', duration: '4-6 years in' },
      { title: 'Consider independent/freelance work', description: 'Common and often lucrative path for experienced media professionals.', duration: 'Ongoing' },
    ],
    resources: ['Journalism/mass comm textbooks', 'Industry publications (exchange4media, etc.)', 'Editing/production software tutorials', 'Portfolio platforms (Vimeo, personal site)'],
  },
  Management: {
    stream: 'Any stream, Commerce is common but not mandatory',
    foundation: [
      { title: 'Build analytical and leadership skills', description: 'Take on leadership roles in school/college clubs to build early experience.', duration: 'Ongoing' },
      { title: 'Participate in case competitions', description: 'Great practice for the structured problem-solving MBAs demand.', duration: 'Ongoing' },
      { title: 'Follow business news and case studies', description: 'Builds business intuition useful for both CAT prep and interviews.', duration: 'Ongoing' },
    ],
    degree: [
      { title: 'Complete a bachelor’s degree in any discipline', description: 'A strong academic record helps but isn’t the only factor for MBA admits.', duration: '3-4 years' },
      { title: 'Gain 2-3 years of work experience', description: 'Recommended, and sometimes required, for top MBA programs.', duration: '2-3 years' },
      { title: 'Clear CAT/other entrance exams', description: 'CAT, XAT, GMAT depending on target schools.', duration: '1 year prep' },
      { title: 'Pursue an MBA/PGDM', description: 'Core coursework plus a summer internship that often converts to a full-time offer.', duration: '2 years' },
    ],
    certifications: [],
    entry: [
      { title: 'Apply for placements (campus or lateral)', description: 'Top B-schools have structured placement processes across consulting, finance, and product roles.', duration: '3-6 months' },
      { title: 'Join management trainee or consulting programs', description: 'Common structured entry points into corporate leadership tracks.', duration: '3-6 months' },
    ],
    growth: [
      { title: 'Grow into people/product/business leadership roles', description: 'Progression depends heavily on demonstrated ownership and results.', duration: '3-5 years in' },
      { title: 'Consider a general management or P&L-owning role', description: 'A typical marker of mid-to-senior management progression.', duration: '5-8 years in' },
      { title: 'Explore executive education or a second specialisation', description: 'Useful for pivoting into a new function or industry.', duration: 'Ongoing' },
    ],
    resources: ['CAT/GMAT prep material', 'Business case study databases (HBR)', 'Business newspapers', 'B-school alumni networks'],
  },
  Agriculture: {
    stream: 'Science (PCB/PCM) or Agriculture stream if available',
    foundation: [
      { title: 'Build strong Biology and Chemistry basics', description: 'Core to understanding soil science, crop biology, and agri-chemistry later.', duration: 'Class 11-12' },
      { title: 'Get exposure to farming practices', description: 'Visit farms, agri-fairs, or participate in agriculture-related school projects.', duration: 'Ongoing' },
      { title: 'Follow agri-tech and sustainability developments', description: 'The field is evolving fast with tech — staying current helps long term.', duration: 'Ongoing' },
    ],
    degree: [
      { title: 'Clear relevant agriculture entrance exams', description: 'E.g. ICAR AIEEA for admission to top agricultural universities.', duration: '1 year prep' },
      { title: 'Pursue B.Sc Agriculture or a related specialisation', description: 'Options include Horticulture, Agri-Business, or Agricultural Engineering.', duration: '4 years' },
      { title: 'Do fieldwork and internships', description: 'With agri-businesses, research institutions (ICAR), or NGOs.', duration: '3-6 months' },
    ],
    certifications: [],
    entry: [
      { title: 'Apply to agri-businesses or government departments', description: 'Roles span extension work, agri-business management, and research support.', duration: '3-6 months' },
      { title: 'Consider higher studies (M.Sc/PhD)', description: 'For research-focused roles at agricultural universities or ICAR institutes.', duration: '2-5 years' },
    ],
    growth: [
      { title: 'Move into research, policy, or agri-business leadership', description: 'Career paths diverge based on interest in field, lab, or business roles.', duration: '3-5 years in' },
      { title: 'Explore entrepreneurship in agri-tech', description: 'A growing space combining traditional agriculture with technology.', duration: 'Ongoing' },
      { title: 'Consider international opportunities', description: 'Agricultural research and agribusiness both have strong global demand.', duration: 'Ongoing' },
    ],
    resources: ['ICAR study material', 'State agricultural university resources', 'Agri-tech industry reports', 'Extension program guides'],
  },
  Defence: {
    stream: 'Science (PCM preferred for technical entries), any stream for others',
    foundation: [
      { title: 'Build physical fitness alongside academics', description: 'Physical standards are strictly tested — start training early.', duration: 'Ongoing' },
      { title: 'Develop discipline and leadership', description: 'Through NCC, sports, or structured extracurriculars.', duration: 'Ongoing' },
      { title: 'Understand entrance exam patterns early', description: 'NDA (after Class 12) or CDS (after graduation) have distinct syllabi.', duration: '1 year prep' },
    ],
    degree: [
      { title: 'Clear NDA or CDS', description: 'NDA is for Class 12 pass-outs; CDS is for graduates.', duration: '1 year prep' },
      { title: 'Clear SSB interview', description: 'A multi-day psychological and physical assessment after the written exam.', duration: '5 days' },
      { title: 'Complete training at the respective academy', description: 'E.g. NDA Khadakwasla, IMA Dehradun, depending on entry route.', duration: '3-4 years' },
    ],
    certifications: [],
    entry: [
      { title: 'Get commissioned as an officer', description: 'After successful completion of academy training.', duration: 'On completion' },
      { title: 'Serve in your assigned unit/branch', description: 'Specific postings depend on your chosen wing (Army/Navy/Air Force) and branch.', duration: 'Ongoing' },
    ],
    growth: [
      { title: 'Progress through structured rank promotions', description: 'Defence careers follow a well-defined seniority and merit-based promotion system.', duration: 'Ongoing' },
      { title: 'Attend staff college and command courses', description: 'Required milestones for reaching senior command positions.', duration: 'Periodic' },
      { title: 'Consider post-retirement second careers', description: 'Many officers move into corporate security, consulting, or civil services after service.', duration: 'Post-retirement' },
    ],
    resources: ['NDA/CDS prep material', 'NCC training resources', 'SSB interview guides', 'Physical fitness training plans'],
  },
}

const DEFAULT_GUIDANCE = {
  stream: 'A stream aligned with your interests and strengths',
  foundation: [
    { title: 'Identify subjects and skills relevant to this field', duration: 'Class 11-12' },
    { title: 'Explore the field through internships, projects, or shadowing', duration: 'Ongoing' },
    { title: 'Build foundational knowledge through school and self-study', duration: 'Ongoing' },
  ] as Step[],
  degree: [
    { title: 'Pursue a relevant bachelor’s degree or diploma', duration: '3-4 years' },
    { title: 'Gain practical exposure through internships', duration: '3-6 months' },
    { title: 'Build a portfolio or track record in the field', duration: 'Ongoing' },
  ] as Step[],
  certifications: [] as Step[],
  entry: [
    { title: 'Apply for entry-level roles or opportunities', duration: '3-6 months' },
    { title: 'Keep building relevant skills and certifications', duration: 'Ongoing' },
    { title: 'Network with professionals already in this field', duration: 'Ongoing' },
  ] as Step[],
  growth: [
    { title: 'Take on more responsibility and visible work', duration: '2-3 years in' },
    { title: 'Specialise into a niche within the field', duration: 'Ongoing' },
    { title: 'Consider leadership or advanced qualifications', duration: '5+ years in' },
  ] as Step[],
  resources: ['School/college resources', 'Field-relevant online courses', 'Professional networking (LinkedIn)', 'Industry publications'],
}

// ────────────────────────────────────────────────────────────────
// Common real-world challenges people face while building this
// career, and practical ways to work through them. Deliberately
// evergreen, general advice — not specific facts that can go stale.
// ────────────────────────────────────────────────────────────────
type Challenge = { problem: string; solution: string }

const CHALLENGES_BY_CATEGORY: Record<string, Challenge[]> = {
  Technology: [
    { problem: 'Interview rejections despite strong grades', solution: 'Tech interviews test problem-solving and system design, not GPA. Dedicate 3-6 months specifically to structured interview prep (DSA patterns, mock interviews) separate from coursework.' },
    { problem: 'Getting stuck without any real work experience', solution: 'Build 2-3 substantial personal projects (ideally with real users) and contribute to open source — this substitutes for missing experience in early interviews.' },
    { problem: 'Rapid skill obsolescence as tools change fast', solution: 'Invest most of your time in fundamentals (data structures, systems, networking) which age far better than any single framework or library.' },
    { problem: 'Burnout from constant pressure to keep upskilling', solution: 'Pace your learning intentionally — mastering fewer things deeply beats shallow exposure to everything, and avoid comparing your timeline to others online.' },
  ],
  Medical: [
    { problem: 'Not clearing NEET on the first attempt', solution: 'This is common — many practicing doctors needed a second attempt. Take a structured, monitored gap year rather than open-ended repetition of the same approach.' },
    { problem: 'High financial burden of private medical college fees', solution: 'Explore state quota seats, government colleges, and education loans designed for medical students, several of which offer collateral-free borrowing up to a limit.' },
    { problem: 'Burnout during MBBS or internship due to long hours', solution: 'Build a peer support network early and use available counselling services — the training is intense everywhere, and seeking support is normal, not a weakness.' },
    { problem: 'Uncertainty about which specialisation to choose', solution: 'Rotate genuinely through different departments during internship before committing to a NEET-PG specialisation, rather than deciding based on rumour or prestige alone.' },
  ],
  Engineering: [
    { problem: 'Placement pressure and dissatisfaction with your branch', solution: 'Skills matter more than the branch label for most engineering jobs — many engineers build careers outside their exact branch by developing relevant project skills.' },
    { problem: 'Coursework feels disconnected from real industry work', solution: 'Supplement classes with practical certifications and personal projects that directly demonstrate applied skills recruiters actually look for.' },
    { problem: 'Difficulty landing a core-branch job in a tough market', solution: 'Consider GATE for PSU or postgraduate routes, or deliberately upskill into adjacent, higher-demand areas that value engineering problem-solving.' },
  ],
  Finance: [
    { problem: 'High drop-out and failure rates in CA/CFA exams', solution: 'Break the syllabus into smaller milestones and study alongside a group — most people who eventually qualify failed at least one paper along the way.' },
    { problem: 'Long articleship hours for relatively low stipend', solution: 'Treat articleship as an investment rather than a job — the practical exposure gained is exactly what differentiates CAs in better-paid roles later.' },
    { problem: 'Finance hiring is sensitive to market cycles', solution: 'Build broad capability (accounting + modelling + one specialisation) so you stay resilient across different finance sub-sectors\u2019 hiring ups and downs.' },
  ],
  Law: [
    { problem: 'Intense competition for top law firm placements', solution: 'Build a clear specialisation area and a strong internship record early — recruiters respond to demonstrated interest far more than generic applications.' },
    { problem: 'Lower starting pay in litigation versus corporate law', solution: 'Litigation compensation tends to grow significantly with reputation and years of practice — weigh long-term trajectory, not just the starting number.' },
    { problem: 'Struggling to balance moots, internships, and academics', solution: 'Prioritise one or two high-quality internships or moots a year over trying to do everything — depth reads better on a CV than sheer volume.' },
  ],
  Government: [
    { problem: 'Low success rate in UPSC despite years of preparation', solution: 'Set yourself a personal attempt limit and a backup plan in advance — this reduces anxiety and keeps preparation from becoming all-or-nothing.' },
    { problem: 'Long, uncertain preparation timelines affecting mental health', solution: 'Build a sustainable daily routine with real breaks — treat this as a structured, long-term effort rather than a single all-consuming sprint.' },
    { problem: 'Balancing optional-subject depth with general studies breadth', solution: 'Choose your optional subject based on genuine interest or academic background rather than trends — it makes the sustained study far more manageable.' },
  ],
  Education: [
    { problem: 'Low starting salaries in school teaching roles', solution: 'Pair a strong CTET/TET score with a specialisation or ed-tech content skills to access better-paying schools and platforms from the start.' },
    { problem: 'Keeping students engaged with traditional teaching methods', solution: 'Invest time in modern pedagogical tools and interactive techniques — schools increasingly value and pay for this skill set.' },
  ],
  Research: [
    { problem: 'Long, uncertain PhD timelines on a modest stipend', solution: 'Choose your advisor and lab as carefully as your institute — a supportive lab environment matters more for timely completion than institutional prestige alone.' },
    { problem: 'Pressure to publish in high-impact journals early on', solution: 'Focus on solid, reproducible work and a support network of peers and mentors rather than chasing venue prestige before you\u2019re ready.' },
    { problem: 'Uncertain academic job market after the PhD or postdoc', solution: 'Build transferable skills — data analysis, technical writing, grant writing — that also open industry R&D roles as a genuine backup path.' },
  ],
  Design: [
    { problem: 'Difficulty breaking in without an established portfolio', solution: 'Do self-initiated redesign projects and write-ups before your first job — recruiters weigh portfolio quality heavily over where you studied.' },
    { problem: 'Client or stakeholder pushback on design decisions', solution: 'Learn to present your rationale backed by user research or data — this builds credibility beyond personal aesthetic preference.' },
    { problem: 'Tools and visual trends change very quickly', solution: 'Focus on core design thinking and problem-solving, which transfers across tools, rather than chasing every new trend as it appears.' },
  ],
  Media: [
    { problem: 'Unstable income, especially early or freelance work', solution: 'Build more than one income stream — a stable base role alongside freelance work — rather than relying on a single source early on.' },
    { problem: 'High competition for bylines or on-air roles', solution: 'Develop a specific beat or niche — generalist content is oversaturated, but focused expertise stands out to editors and audiences alike.' },
  ],
  Management: [
    { problem: 'High MBA fees with uncertain returns outside top schools', solution: 'Research placement reports and alumni outcomes carefully before committing — an MBA\u2019s value depends heavily on that specific program\u2019s network.' },
    { problem: 'Generalist MBA graduates struggling to stand out', solution: 'Develop a clear functional specialisation — product, finance, or operations — during the program instead of staying broad.' },
  ],
  Agriculture: [
    { problem: 'Perception of lower prestige or pay versus other sciences', solution: 'Agri-business, agri-tech, and government agricultural services all offer strong, growing paths — the field has expanded well beyond traditional farming roles.' },
    { problem: 'Limited exposure to modern agri-tech in traditional coursework', solution: 'Seek internships specifically with agri-tech startups or research institutions to build modern, in-demand skills alongside your degree.' },
  ],
  Defence: [
    { problem: 'High SSB rejection rate even after clearing written exams', solution: 'SSB assesses personality and leadership built over years, not weeks — start building real leadership experience (NCC, sports, teamwork) well in advance.' },
    { problem: 'Needing repeated attempts to clear NDA or CDS', solution: 'Treat each attempt as feedback — analyse your specific weak areas rather than repeating the exact same preparation approach.' },
  ],
}

const DEFAULT_CHALLENGES: Challenge[] = [
  { problem: 'Not knowing where to start', solution: 'Break the path into small, concrete milestones (like the phases above) rather than trying to plan the entire journey at once.' },
  { problem: 'Comparing your progress to others', solution: 'Everyone\u2019s starting point and circumstances differ — focus on whether you\u2019re improving relative to your own timeline, not someone else\u2019s.' },
  { problem: 'Losing motivation during long preparation phases', solution: 'Connect with others pursuing the same path — a study group, mentor, or online community makes the harder stretches much more sustainable.' },
]

// ── Static fallback roadmaps for careers without DB or generic data ──
const STATIC_ROADMAPS: Record<string, any> = {
  'civil-engineer': {
    title: 'Civil Engineer Roadmap',
    description: 'Complete guide to becoming a Civil Engineer in India — from school to building your career in infrastructure.',
    phases: [
      { phase_number: 1, title: 'Build Your Foundation', description: 'Strong basics in Maths and Physics during Class 11-12', nodes: [
        { title: 'Focus on Physics & Maths (PCM stream)', duration: '2 years' },
        { title: 'Understand basic mechanics and structural concepts', duration: '1 year' },
        { title: 'Explore hands-on projects (model-building, robotics)', duration: 'Ongoing' },
      ]},
      { phase_number: 2, title: 'Crack Entrance Exams', description: 'Clear JEE Main/Advanced or state CETs for a good engineering college', nodes: [
        { title: 'Prepare for JEE Main', duration: '1 year', resource_url: 'https://jeemain.nta.nic.in' },
        { title: 'Consider State CETs as backup options', duration: '6 months', is_optional: true },
      ]},
      { phase_number: 3, title: 'Complete Your Engineering Degree', description: 'B.Tech/B.E. in Civil Engineering — 4 years', nodes: [
        { title: 'Learn Structural Analysis & Design', duration: '1 year' },
        { title: 'Learn AutoCAD, STAAD Pro & industry software', duration: '6 months' },
        { title: 'Do site internships during summer breaks', duration: '6 months' },
        { title: 'Complete a final-year infrastructure project', duration: '6 months' },
      ]},
      { phase_number: 4, title: 'Get Certified', description: 'Professional certifications that strengthen your profile', nodes: [
        { title: 'Chartered Engineer certification', duration: '1 year', is_optional: true },
        { title: 'PMP for project management roles', duration: '3 months', is_optional: true },
      ]},
      { phase_number: 5, title: 'Land Your First Job', description: 'Apply for Civil Engineer roles at construction & infra firms', nodes: [
        { title: 'Apply to firms like L&T, Shapoorji Pallonji, DLF', duration: '3 months' },
        { title: 'Consider GATE for PSU jobs (NHAI, DMRC, etc.)', duration: '1 year', is_optional: true },
      ]},
      { phase_number: 6, title: 'Grow & Specialise', description: 'Move into structural design, project management, or higher studies', nodes: [
        { title: 'Pursue M.Tech in Structural/Transportation Engineering', duration: '2 years', is_optional: true },
        { title: 'Move into project management or site leadership', duration: '3-5 years in' },
      ]},
    ],
  },
  cybersecurity: {
    title: 'Cybersecurity Specialist Roadmap',
    description: 'Complete guide to becoming a Cybersecurity professional — protecting systems, networks, and data.',
    phases: [
      { phase_number: 1, title: 'Build Your Foundation', description: 'Basics of computers, networking, and programming', nodes: [
        { title: 'Learn networking basics (TCP/IP, DNS, HTTP)', duration: '3 months' },
        { title: 'Learn Linux & command line fundamentals', duration: '2 months' },
        { title: 'Learn a programming language (Python)', duration: '3 months' },
      ]},
      { phase_number: 2, title: 'Complete Your Degree', description: 'B.Tech in CS/IT, or a specialised cybersecurity program', nodes: [
        { title: 'Study cryptography fundamentals', duration: '3 months' },
        { title: 'Take security-focused electives if available', duration: '6 months' },
      ]},
      { phase_number: 3, title: 'Get Certified', description: 'Industry certifications matter a lot in this field', nodes: [
        { title: 'CompTIA Security+', duration: '3 months' },
        { title: 'Certified Ethical Hacker (CEH)', duration: '3 months', is_optional: true },
      ]},
      { phase_number: 4, title: 'Build Practical Skills', description: 'Hands-on practice is essential in security', nodes: [
        { title: 'Practice on TryHackMe / HackTheBox', duration: '6 months', resource_url: 'https://tryhackme.com' },
        { title: 'Participate in CTF competitions', duration: 'Ongoing', is_optional: true },
      ]},
      { phase_number: 5, title: 'Land a Security Role', description: 'Apply for SOC Analyst, Pentester, or Security Engineer roles', nodes: [
        { title: 'Apply to security teams at tech companies', duration: '3 months' },
        { title: 'Consider OSCP for advanced offensive roles', duration: '1 year', is_optional: true },
      ]},
      { phase_number: 6, title: 'Grow Your Career', description: 'Move into senior or specialised security roles', nodes: [
        { title: 'Specialise into red team, blue team, or GRC', duration: '2-3 years in' },
        { title: 'Pursue CISSP for leadership/architecture roles', duration: '1 year', is_optional: true },
      ]},
    ],
  },
  devops: {
    title: 'DevOps Engineer Roadmap',
    description: 'Complete guide to becoming a DevOps Engineer — bridging development and operations.',
    phases: [
      { phase_number: 1, title: 'Build Your Foundation', description: 'Basics of programming and Linux', nodes: [
        { title: 'Learn Linux fundamentals', duration: '2 months' },
        { title: 'Learn a scripting language (Python/Bash)', duration: '2 months' },
      ]},
      { phase_number: 2, title: 'Complete Your Degree', description: 'B.Tech in CS/IT or equivalent', nodes: [
        { title: 'Learn networking & OS concepts', duration: '6 months' },
        { title: 'Learn Git & version control', duration: '1 month' },
      ]},
      { phase_number: 3, title: 'Master DevOps Tools', description: 'Learn the core toolchain used in the industry', nodes: [
        { title: 'Learn Docker & Kubernetes', duration: '4 months' },
        { title: 'Learn CI/CD (Jenkins, GitHub Actions)', duration: '3 months' },
        { title: 'Learn Cloud platforms (AWS/Azure/GCP)', duration: '4 months' },
      ]},
      { phase_number: 4, title: 'Get Certified', description: 'Certifications that strengthen your DevOps profile', nodes: [
        { title: 'AWS/Azure DevOps certification', duration: '3-4 months' },
        { title: 'Certified Kubernetes Administrator (CKA)', duration: '2 months', is_optional: true },
      ]},
      { phase_number: 5, title: 'Build Real Projects', description: 'Set up real pipelines and infrastructure as code', nodes: [
        { title: 'Build a full CI/CD pipeline project', duration: '2 months' },
        { title: 'Learn Terraform / Infrastructure as Code', duration: '2 months', is_optional: true },
      ]},
      { phase_number: 6, title: 'Land a DevOps Role', description: 'Apply for DevOps/SRE/Cloud Engineer roles', nodes: [
        { title: 'Apply to product & cloud-native companies', duration: '3 months' },
        { title: 'Grow into SRE or platform engineering roles', duration: '2-3 years in' },
      ]},
    ],
  },
}

const PHASE_COLORS = [
  { badge: 'bg-indigo-600', line: 'bg-indigo-200', chip: 'bg-indigo-50 text-indigo-700' },
  { badge: 'bg-blue-600', line: 'bg-blue-200', chip: 'bg-blue-50 text-blue-700' },
  { badge: 'bg-emerald-600', line: 'bg-emerald-200', chip: 'bg-emerald-50 text-emerald-700' },
  { badge: 'bg-amber-600', line: 'bg-amber-200', chip: 'bg-amber-50 text-amber-700' },
  { badge: 'bg-purple-600', line: 'bg-purple-200', chip: 'bg-purple-50 text-purple-700' },
  { badge: 'bg-rose-600', line: 'bg-rose-200', chip: 'bg-rose-50 text-rose-700' },
]

function formatCurrency(amount: number, currency: string | null) {
  const symbol = currency === 'INR' || !currency ? '₹' : currency
  if (amount >= 100000) return `${symbol}${(amount / 100000).toFixed(1)} L`
  return `${symbol}${amount.toLocaleString('en-IN')}`
}

// Finds the best-matched college for an exam (preferring colleges already
// recommended for this career) and returns its last-5-years cutoff trend.
async function getCutoffPreview(supabase: any, examId: string, preferredCollegeIds: string[]) {
  const { data } = await supabase
    .from('college_exam_cutoffs')
    .select('year, category, cutoff_score, cutoff_rank, college_id, colleges ( name, slug, nirf_rank )')
    .eq('exam_id', examId)
    .order('year', { ascending: false })
    .limit(150)

  if (!data || data.length === 0) return null

  const preferredSet = new Set(preferredCollegeIds)
  const grouped = new Map<string, any[]>()
  for (const row of data as any[]) {
    if (!grouped.has(row.college_id)) grouped.set(row.college_id, [])
    grouped.get(row.college_id)!.push(row)
  }

  const candidates = Array.from(grouped.entries()).map(([collegeId, rows]) => ({
    collegeId,
    rows,
    college: rows[0].colleges,
    isPreferred: preferredSet.has(collegeId),
  }))

  candidates.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
    return (a.college?.nirf_rank ?? 9999) - (b.college?.nirf_rank ?? 9999)
  })

  const best = candidates[0]
  if (!best) return null

  const seenYears = new Set<number>()
  const trend: any[] = []
  for (const row of best.rows.sort((a: any, b: any) => b.year - a.year)) {
    if (!seenYears.has(row.year)) {
      seenYears.add(row.year)
      trend.push(row)
    }
    if (trend.length >= 5) break
  }

  return {
    collegeName: best.college?.name,
    collegeSlug: best.college?.slug,
    trend,
    yearsAvailableTotal: new Set((data as any[]).map((r) => r.year)).size,
  }
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: career } = await supabase.from('careers').select('*').eq('slug', slug).maybeSingle()

  let roadmapTitle = ''
  let roadmapDescription = ''
  let phases: any[] = []
  let source: 'db' | 'static' | 'generated' | null = null
  let resources: string[] = []

  // 1. Hand-seeded roadmap from the database
  if (career) {
    const { data: roadmap } = await supabase
      .from('roadmaps')
      .select('id, title, description')
      .eq('career_id', career.id)
      .maybeSingle()

    if (roadmap) {
      const { data: nodes } = await supabase
        .from('roadmap_nodes')
        .select('*')
        .eq('roadmap_id', roadmap.id)
        .order('phase_number', { ascending: true })
        .order('order_index', { ascending: true })

      if (nodes && nodes.length > 0) {
        roadmapTitle = roadmap.title
        roadmapDescription = roadmap.description ?? ''
        const phaseMap = new Map<number, any>()
        for (const n of nodes as any[]) {
          if (n.node_type === 'phase') {
            phaseMap.set(n.phase_number, { phase_number: n.phase_number, title: n.title, description: n.description, nodes: [] })
          }
        }
        for (const n of nodes as any[]) {
          if (n.node_type !== 'phase') {
            const phase = phaseMap.get(n.phase_number)
            if (phase) phase.nodes.push(n)
          }
        }
        phases = Array.from(phaseMap.values()).sort((a, b) => a.phase_number - b.phase_number)
        source = 'db'
      }
    }
  }

  // 2. Hand-written static roadmaps
  if (phases.length === 0) {
    const staticData = STATIC_ROADMAPS[slug]
    if (staticData) {
      roadmapTitle = staticData.title
      roadmapDescription = staticData.description
      phases = staticData.phases
      source = 'static'
    }
  }

  // 3. Auto-generate a detailed roadmap from the career's own data + category guidance
  let exams: any[] = []
  let skills: any[] = []
  if (phases.length === 0 && career) {
    const [{ data: examLinks }, { data: skillLinks }] = await Promise.all([
      supabase
        .from('career_exams')
        .select('importance, exams ( name, exam_level, conducting_body, official_url )')
        .eq('career_id', career.id)
        .order('importance', { ascending: false })
        .limit(4),
      supabase
        .from('career_skills')
        .select('importance, skills ( name, category )')
        .eq('career_id', career.id)
        .order('importance', { ascending: false })
        .limit(6),
    ])

    exams = (examLinks ?? []).map((e: any) => e.exams).filter(Boolean)
    skills = (skillLinks ?? []).map((s: any) => s.skills).filter(Boolean)

    const guidance = CATEGORY_GUIDANCE[career.category] ?? DEFAULT_GUIDANCE
    resources = guidance.resources

    roadmapTitle = `${career.title} Roadmap`
    roadmapDescription = career.description
      ? `A complete, detailed step-by-step guide to becoming a ${career.title}. ${career.description}`
      : `A complete, detailed step-by-step guide to becoming a ${career.title}.`

    let phaseNum = 1
    phases = []

    phases.push({
      phase_number: phaseNum++,
      title: 'Build Your Foundation (School)',
      description: `Recommended stream: ${guidance.stream}`,
      nodes: guidance.foundation,
    })

    if (exams.length > 0) {
      phases.push({
        phase_number: phaseNum++,
        title: 'Clear Key Entrance Exams',
        description: 'These exams are commonly required to enter this field',
        nodes: exams.map((ex: any) => ({
          title: `Prepare for & clear ${ex.name}`,
          description: [ex.exam_level, ex.conducting_body].filter(Boolean).join(' • ') || undefined,
          duration: '1 year',
          resource_url: ex.official_url ?? undefined,
        })),
      })
    }

    phases.push({
      phase_number: phaseNum++,
      title: 'Complete Your Degree / Qualification',
      description: `The core educational path for becoming a ${career.title}`,
      nodes: guidance.degree,
    })

    if (skills.length > 0) {
      phases.push({
        phase_number: phaseNum++,
        title: 'Build Core Skills',
        description: 'These skills matter most for succeeding in this career',
        nodes: skills.map((sk: any) => ({
          title: `Develop ${sk.name}`,
          description: sk.category ?? undefined,
          duration: '3-6 months',
        })),
      })
    }

    if (guidance.certifications.length > 0) {
      phases.push({
        phase_number: phaseNum++,
        title: 'Certifications & Specialisations',
        description: 'Credentials that strengthen your profile for this career',
        nodes: guidance.certifications,
      })
    }

    phases.push({
      phase_number: phaseNum++,
      title: 'Start Your Career',
      description:
        career.avg_salary_min && career.avg_salary_max
          ? `Entry-level salaries typically range from ${formatCurrency(career.avg_salary_min, career.salary_currency)} to ${formatCurrency(career.avg_salary_max, career.salary_currency)} per year`
          : 'Apply for entry-level roles and build real-world experience',
      nodes: guidance.entry,
    })

    phases.push({
      phase_number: phaseNum++,
      title: 'Grow Your Career',
      description: 'What progression typically looks like a few years in',
      nodes: guidance.growth,
    })

    source = 'generated'
  }

  if (phases.length === 0) {
    notFound()
  }

  // Estimated total duration (rough, for the summary strip)
  const totalPhases = phases.length

  // Common challenges for this career's category — shown regardless of
  // whether the roadmap itself came from DB/static/generated.
  const challenges: Challenge[] = career
    ? CHALLENGES_BY_CATEGORY[career.category] ?? DEFAULT_CHALLENGES
    : DEFAULT_CHALLENGES

  // Recommended colleges for this career
  let colleges: any[] = []
  if (career) {
    const { data: courseLinks } = await supabase
      .from('college_courses')
      .select('degree_type, duration_years, annual_fees_min, annual_fees_max, colleges ( id, name, slug, city, state, nirf_rank, type )')
      .eq('career_id', career.id)
      .limit(30)

    const seen = new Set<string>()
    for (const row of (courseLinks ?? []) as any[]) {
      const c = row.colleges
      if (c && !seen.has(c.id)) {
        seen.add(c.id)
        colleges.push({ ...c, degree_type: row.degree_type, fees_min: row.annual_fees_min, fees_max: row.annual_fees_max })
      }
    }
    colleges.sort((a, b) => (a.nirf_rank ?? 9999) - (b.nirf_rank ?? 9999))
    colleges = colleges.slice(0, 8)
  }

  // Entrance exams required for this career, each with a live cutoff trend —
  // shown regardless of whether the roadmap itself came from DB/static/generated.
  let examDetails: any[] = []
  if (career) {
    const { data: careerExams } = await supabase
      .from('career_exams')
      .select(
        `
        importance,
        exams (
          id, name, slug, exam_level, conducting_body, frequency, mode, official_url,
          exam_schedules ( registration_start, registration_end, exam_date_start, result_date, year ),
          exam_eligibility ( min_percentage, class_required, stream_required, age_min, age_max )
        )
        `
      )
      .eq('career_id', career.id)
      .order('importance', { ascending: false })
      .limit(6)

    const collegeIds = colleges.map((c: any) => c.id)

    examDetails = await Promise.all(
      ((careerExams ?? []) as any[])
        .filter((ce) => ce.exams)
        .map(async (ce) => {
          const cutoffPreview = await getCutoffPreview(supabase, ce.exams.id, collegeIds)
          const schedules = (ce.exams.exam_schedules ?? []) as any[]
          const latestSchedule = [...schedules].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0] ?? null
          const eligibility = (ce.exams.exam_eligibility ?? [])[0] ?? null
          return { ...ce.exams, importance: ce.importance, cutoffPreview, latestSchedule, eligibility }
        })
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-14">
          <Link href={career ? `/careers/${career.slug}` : '/careers'} className="text-indigo-200 hover:text-white text-sm">
            ← Back to career details
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold mt-4">{roadmapTitle}</h1>
          {roadmapDescription && <p className="text-indigo-100 mt-3 text-lg max-w-2xl">{roadmapDescription}</p>}
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">🗺️ {totalPhases}-phase roadmap</span>
            {career?.avg_salary_min && career?.avg_salary_max && (
              <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">
                💰 {formatCurrency(career.avg_salary_min, career.salary_currency)} – {formatCurrency(career.avg_salary_max, career.salary_currency)} / yr
              </span>
            )}
            {career?.growth_level && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">📈 {career.growth_level} growth</span>}
            {career?.category && <span className="bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm">🏷️ {career.category}</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Phase overview strip */}
        <div className="flex flex-wrap gap-2 mb-10">
          {phases.map((p, i) => (
            <span key={p.phase_number} className={`text-xs font-medium px-3 py-1.5 rounded-full ${PHASE_COLORS[i % PHASE_COLORS.length].chip}`}>
              {p.phase_number}. {p.title}
            </span>
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {phases.map((phase, i) => {
            const color = PHASE_COLORS[i % PHASE_COLORS.length]
            const isLast = i === phases.length - 1
            return (
              <div key={phase.phase_number} className="relative flex gap-5 pb-10">
                {!isLast && <div className={`absolute left-[19px] top-10 bottom-0 w-0.5 ${color.line}`} />}
                <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-white font-semibold shrink-0 ${color.badge}`}>
                  {phase.phase_number}
                </div>

                <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900">{phase.title}</h2>
                  {phase.description && <p className="text-gray-500 mt-1">{phase.description}</p>}

                  <div className="mt-5 space-y-3">
                    {phase.nodes.map((node: any, idx: number) => (
                      <div key={node.id ?? idx} className="flex items-start gap-3 bg-gray-50 rounded-xl border border-gray-100 p-4">
                        <span className="mt-0.5 text-indigo-500">✓</span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {node.title}
                            {node.is_optional && <span className="ml-2 text-xs text-gray-400 font-normal">(optional)</span>}
                          </p>
                          {node.description && <p className="text-sm text-gray-500 mt-1">{node.description}</p>}
                          <div className="flex items-center gap-3 mt-2">
                            {node.duration && <span className={`text-xs px-2 py-0.5 rounded-full ${color.chip}`}>⏱ {node.duration}</span>}
                            {node.resource_url && (
                              <a href={node.resource_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">
                                Official link →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Common challenges & how to overcome them */}
        {challenges.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Common Challenges &amp; How to Overcome Them</h2>
            <p className="text-gray-500 mb-6">Real obstacles people face on this path, and practical ways through them</p>
            <div className="space-y-4">
              {challenges.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  <div className="flex items-start gap-3 px-6 py-4 bg-red-50/60 border-b border-gray-100">
                    <span className="text-red-500 mt-0.5">⚠️</span>
                    <p className="font-medium text-gray-900">{c.problem}</p>
                  </div>
                  <div className="flex items-start gap-3 px-6 py-4">
                    <span className="text-emerald-500 mt-0.5">💡</span>
                    <p className="text-sm text-gray-600">{c.solution}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Entrance exams & cutoffs */}
        {examDetails.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Entrance Exams You&apos;ll Need</h2>
            <p className="text-gray-500 mb-6">Exams commonly required for this career, with recent cutoff trends</p>
            <div className="space-y-5">
              {examDetails.map((exam: any) => (
                <div key={exam.id} className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exam.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {exam.exam_level && (
                          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">{exam.exam_level}</span>
                        )}
                        {exam.conducting_body && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exam.conducting_body}</span>
                        )}
                        {exam.frequency && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exam.frequency}</span>
                        )}
                      </div>
                    </div>
                    {exam.official_url && (
                      <a
                        href={exam.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline whitespace-nowrap"
                      >
                        Official site →
                      </a>
                    )}
                  </div>

                  {exam.latestSchedule && (
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                      <span>📝 Registration: {exam.latestSchedule.registration_start ? new Date(exam.latestSchedule.registration_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'} – {exam.latestSchedule.registration_end ? new Date(exam.latestSchedule.registration_end).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'TBA'}</span>
                      <span>📅 Exam: {exam.latestSchedule.exam_date_start ? new Date(exam.latestSchedule.exam_date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'TBA'}</span>
                    </div>
                  )}

                  {exam.eligibility && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {exam.eligibility.class_required && (
                        <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">{exam.eligibility.class_required}</span>
                      )}
                      {exam.eligibility.stream_required && (
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{exam.eligibility.stream_required}</span>
                      )}
                      {exam.eligibility.min_percentage && (
                        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Min {exam.eligibility.min_percentage}%</span>
                      )}
                    </div>
                  )}

                  {exam.cutoffPreview ? (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Cutoff trend — {exam.cutoffPreview.collegeName}
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-gray-100">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-left text-gray-500">
                              <th className="px-3 py-2 font-medium">Year</th>
                              <th className="px-3 py-2 font-medium">Category</th>
                              <th className="px-3 py-2 font-medium">Score</th>
                              <th className="px-3 py-2 font-medium">Rank</th>
                            </tr>
                          </thead>
                          <tbody>
                            {exam.cutoffPreview.trend.map((row: any) => (
                              <tr key={row.year} className="border-t border-gray-100">
                                <td className="px-3 py-2 text-gray-900">{row.year}</td>
                                <td className="px-3 py-2 text-gray-600">{row.category ?? '—'}</td>
                                <td className="px-3 py-2 text-gray-600">{row.cutoff_score ?? '—'}</td>
                                <td className="px-3 py-2 text-gray-600">{row.cutoff_rank ? `#${row.cutoff_rank}` : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <Link href={`/exams/${exam.slug}`} className="inline-block text-sm text-indigo-600 hover:underline mt-3">
                        See full {exam.cutoffPreview.yearsAvailableTotal > 5 ? `${exam.cutoffPreview.yearsAvailableTotal}-year` : 'complete'} cutoff history, all colleges →
                      </Link>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-3">
                      Cutoff data isn&apos;t available for this exam yet.{' '}
                      <Link href={`/exams/${exam.slug}`} className="text-indigo-600 hover:underline">
                        View exam details →
                      </Link>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended resources */}
        {resources.length > 0 && (
          <div className="mb-10 bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">📚 Where to Prepare</h2>
            <div className="flex flex-wrap gap-2">
              {resources.map((r) => (
                <span key={r} className="text-sm bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full">
                  {r}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended colleges */}
        {colleges.length > 0 && (
          <div className="mt-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Recommended Colleges</h2>
            <p className="text-gray-500 mb-6">Top institutions offering courses for this career</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {colleges.map((c) => (
                <Link key={c.id} href={`/colleges/${c.slug}`} className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-indigo-300 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-gray-900">{c.name}</p>
                    {c.nirf_rank && <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full shrink-0">NIRF #{c.nirf_rank}</span>}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {[c.city, c.state].filter(Boolean).join(', ')}
                    {c.degree_type ? ` • ${c.degree_type}` : ''}
                  </p>
                  {(c.fees_min || c.fees_max) && (
                    <p className="text-sm text-gray-600 mt-2">
                      {c.fees_min === 0 && c.fees_max === 0 ? 'Free / Govt Subsidized' : `${formatCurrency(c.fees_min ?? 0, 'INR')} – ${formatCurrency(c.fees_max ?? 0, 'INR')} / yr`}
                    </p>
                  )}
                </Link>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/colleges" className="text-indigo-600 text-sm hover:underline">
                See all colleges →
              </Link>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-indigo-600 rounded-2xl p-8 text-center">
          <h3 className="text-white text-xl font-semibold">Ready to start your journey?</h3>
          <p className="text-indigo-100 mt-2">Save this career and track your progress from your dashboard.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            <Link href="/dashboard" className="inline-block bg-white text-indigo-600 font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-50 transition">
              Go to Dashboard
            </Link>
            {career && (
              <Link href={`/careers/${career.slug}`} className="inline-block bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-indigo-400 transition">
                View Career Details
              </Link>
            )}
          </div>
        </div>

        {source === 'generated' && (
          <p className="text-center text-xs text-gray-400 mt-6">
            This roadmap was auto-generated from career data and category best-practices. A hand-curated version may be added later.
          </p>
        )}
      </div>
    </div>
  )
}
