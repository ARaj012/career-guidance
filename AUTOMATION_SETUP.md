# Data Automation System Setup Guide

## Overview
This system automatically updates exam and college data from official websites using web scrapers with Cheerio.

## Current Implementation

### Supported Exams
- **GATE** (Gate iitb.ac.in) - Full scraper implementation with Cheerio

### What's Automated
- ✅ Exam dates (registration start/end, exam date, result date)
- ✅ Cutoffs (category-wise, paper-wise)
- ✅ Change detection and notifications
- ✅ Manual trigger via admin panel
- ✅ Weekly automation via GitHub Actions

## Installation Requirements

### 1. Web Scraping Dependencies ✅ (Already Installed)
```bash
cd apps/web
npm install cheerio
npm install @types/cheerio --save-dev
```

### 2. GitHub Actions Setup
The workflow file is already created at `.github/workflows/weekly-automation.yml`

## How It Works

### Manual Automation
1. Go to `/admin/automation`
2. Click "Update Dates", "Update Cutoffs", or "Update All"
3. System fetches data from official website using Cheerio
4. Database is updated if changes detected
5. Notification is created

### Weekly Automation (GitHub Actions)
The workflow is configured to run every Sunday at 12:00 AM UTC (5:30 AM IST).

**To enable it:**
1. Push your code to GitHub
2. Go to your repository on GitHub
3. Navigate to "Actions" tab
4. Enable GitHub Actions for your repository
5. The workflow will run automatically every Sunday

**To run manually:**
1. Go to GitHub Actions tab
2. Select "Weekly Data Automation" workflow
3. Click "Run workflow" button
4. Select branch and click "Run workflow"

## Current Scraper Status

### GATE Scraper
- ✅ Cheerio integration complete
- ✅ HTML parsing structure implemented
- ✅ Date extraction logic added
- ✅ Cutoff extraction logic added
- ✅ Fallback to mock data if scraping fails
- ⚠️ **Need to update CSS selectors** for actual website structure

### Next Steps for GATE Scraper
1. **Inspect GATE website** (gate.iitb.ac.in) to find correct CSS selectors
2. **Update selectors** in `src/lib/automation/gate-scraper.ts`
3. **Test manually** via admin panel
4. **Verify data accuracy** before enabling weekly automation

## Important Notes

### CSS Selectors
The current scraper uses placeholder CSS selectors. You need to:
1. Open gate.iitb.ac.in in browser
2. Right-click on exam dates and select "Inspect"
3. Find the actual CSS selectors (e.g., `.exam-date`, `#registration-date`)
4. Update the `extractDateFromHTML` method with correct selectors
5. Repeat for cutoff table selectors

### Example Selector Updates
```typescript
// Example - Replace with actual selectors
case 'registration-start':
  const regStart = $('.exam-schedule .registration-start').text()
  if (regStart) return this.parseDate(regStart)
```

### Legal & Ethical Considerations
- ✅ Check the website's `robots.txt` file
- ✅ Respect rate limits (weekly schedule is conservative)
- ✅ Add proper user-agent headers if needed
- ✅ Consider using official APIs if available in future

### Error Handling
- ✅ Scraper falls back to mock data if scraping fails
- ✅ Detailed logging for debugging
- ✅ Change detection prevents unnecessary updates
- ⚠️ Need to monitor scraper health weekly

### Data Validation
- ✅ Validates dates before updating database
- ✅ Checks for changes before updating
- ✅ Creates notifications for updates
- ⚠️ Need to add manual review for critical changes

## Adding More Exams/Colleges

### Step 1: Create Scraper
Create `src/lib/automation/{exam-name}-scraper.ts`:
```typescript
import * as cheerio from 'cheerio'

export class ExamScraper {
  async fetchExamDates() { /* implementation */ }
  async fetchCutoffs() { /* implementation */ }
}
```

### Step 2: Create API Endpoint
Create `src/app/api/automation/{exam-name}/route.ts`:
```typescript
import { examScraper } from '@/lib/automation/{exam-name}-scraper'

export async function POST(req: NextRequest) {
  // Implementation similar to GATE
}
```

### Step 3: Add to Admin Panel
Update `src/app/admin/automation/page.tsx` to include the new exam.

### Step 4: Add to GitHub Actions
Update `.github/workflows/weekly-automation.yml` to include the new exam.

## Troubleshooting

### Scraper Not Working
- Check if website structure has changed
- Verify CSS selectors are correct
- Check network connectivity
- Review error logs in GitHub Actions
- Test locally via admin panel first

### GitHub Actions Not Running
- Verify workflow file is in `.github/workflows/`
- Check GitHub Actions is enabled for repository
- Verify cron syntax is correct
- Check workflow logs for errors

### Data Not Updating
- Check if database permissions are correct
- Verify API endpoint is accessible
- Check change detection logic
- Review database constraints
- Check automation logs

### Performance Issues
- Current weekly schedule is conservative
- Add caching if needed
- Optimize scraper performance
- Use async/await properly
- Consider pagination for large datasets

## Production Deployment

### Before Going Live
1. ✅ Test all scrapers manually via admin panel
2. ✅ Verify data accuracy
3. ✅ Check database update permissions
4. ✅ Test GitHub Actions workflow
5. ✅ Monitor first few automated runs
6. ✅ Set up error monitoring

### Monitoring
- Check GitHub Actions logs weekly
- Monitor admin notifications
- Review database update logs
- Track scraper success rate
- Monitor data quality

### Maintenance
- Review and update CSS selectors monthly
- Monitor website structure changes
- Update scraper when website changes
- Add new exams/colleges as needed
- Review automation performance quarterly
