/**
 * CAT Scraper
 * Automatically scrapes IIM CAT official website for exam dates, cutoffs, and subject weightage
 */

import * as cheerio from 'cheerio'

interface CatExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface CatCutoffData {
  year: number
  category: string
  percentile: number
}

interface CatSubjectWeightage {
  subject: string
  topic: string
  weightage: number
  year: number
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); } catch (e) {
      lastErr = e;
      if (i < attempts - 1) { console.log(`⏳ Retry ${i + 1}/${attempts}`); await new Promise(res => setTimeout(res, delayMs)); }
    }
  }
  throw lastErr;
}

export class CatScraper {
  private baseUrl = 'https://iimcat.ac.in'
  
  async fetchExamDates(): Promise<CatExamData> {
    try {
      console.log('🔍 Fetching CAT exam dates...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          return { examDate: this.parseDate($('span:contains("Exam")').text()), registrationStartDate: this.parseDate($('span:contains("Registration")').first().text()), registrationEndDate: this.parseDate($('span:contains("Registration")').last().text()), resultDate: this.parseDate($('span:contains("Result")').text()), examYear: new Date().getFullYear() + 1 };
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      console.log('✅ CAT exam dates fetched:', data)
      return data
    } catch (error) {
      console.error('❌ Error fetching CAT exam dates:', error)
      return this.getMockExamData()
    }
  }
  
  async fetchCutoffs(): Promise<CatCutoffData[]> {
    try {
      console.log('🔍 Fetching CAT cutoffs...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const cutoffs: CatCutoffData[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 2) cutoffs.push({ year, category: $(cells[0]).text().trim(), percentile: parseFloat($(cells[1]).text().trim()) || 0 });
          });
          return cutoffs;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ CAT cutoffs fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching CAT cutoffs:', error)
      return this.getMockCutoffData()
    }
  }
  
  async fetchSubjectWeightage(): Promise<CatSubjectWeightage[]> {
    try {
      console.log('🔍 Fetching CAT subject weightage...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const weightage: CatSubjectWeightage[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) weightage.push({ year, subject: $(cells[0]).text().trim(), topic: $(cells[1]).text().trim(), weightage: parseFloat($(cells[2]).text().trim()) || 0 });
          });
          return weightage;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ CAT subject weightage fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching CAT subject weightage:', error)
      return this.getMockSubjectWeightage()
    }
  }
  
  private parseDate(dateString: string): string | undefined {
    try {
      const cleanDate = dateString.replace(/(\d+)(st|nd|rd|th)/, '$1').replace(/January|February|March|April|May|June|July|August|September|October|November|December/gi, (match) => {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const idx = months.findIndex(m => m.toLowerCase() === match.toLowerCase());
        return idx >= 0 ? String(idx + 1).padStart(2, '0') : '01';
      }).replace(/\s+/g, '-').replace(/-$/, '');
      const date = new Date(cleanDate);
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : undefined;
    } catch { return undefined; }
  }
  
  private getMockExamData(): CatExamData {
    const year = new Date().getFullYear() + 1;
    return { examDate: `${year}-11-24`, registrationStartDate: `${year}-08-01`, registrationEndDate: `${year}-09-15`, resultDate: `${year}-01-05`, examYear: year };
  }
  
  private getMockCutoffData(): CatCutoffData[] {
    const year = new Date().getFullYear();
    return [{ year, category: 'General', percentile: 99 }, { year, category: 'OBC', percentile: 95 }, { year, category: 'SC', percentile: 85 }, { year, category: 'ST', percentile: 75 }];
  }
  
  private getMockSubjectWeightage(): CatSubjectWeightage[] {
    const year = new Date().getFullYear();
    return [{ year, subject: 'Quantitative Aptitude', topic: 'Arithmetic', weightage: 34 }, { year, subject: 'Verbal Ability', topic: 'Reading Comprehension', weightage: 34 }, { year, subject: 'Data Interpretation', topic: 'Charts', weightage: 16 }, { year, subject: 'Logical Reasoning', topic: 'Puzzles', weightage: 16 }];
  }
}

export const catScraper = new CatScraper()
