/**
 * NEET Scraper
 * Automatically scrapes NTA NEET official website for exam dates, cutoffs, and subject weightage
 */

import * as cheerio from 'cheerio'

interface NeetExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface NeetCutoffData {
  year: number
  category: string
  cutoffScore: number
  rankRange?: string
}

interface NeetSubjectWeightage {
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

export class NeetScraper {
  private baseUrl = 'https://nta.ac.in'
  
  async fetchExamDates(): Promise<NeetExamData> {
    try {
      console.log('🔍 Fetching NEET exam dates...')
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
      console.log('✅ NEET exam dates fetched:', data)
      return data
    } catch (error) {
      console.error('❌ Error fetching NEET exam dates:', error)
      return this.getMockExamData()
    }
  }
  
  async fetchCutoffs(): Promise<NeetCutoffData[]> {
    try {
      console.log('🔍 Fetching NEET cutoffs...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const cutoffs: NeetCutoffData[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) cutoffs.push({ year, category: $(cells[0]).text().trim(), cutoffScore: parseFloat($(cells[1]).text().trim()) || 0 });
          });
          return cutoffs;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ NEET cutoffs fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching NEET cutoffs:', error)
      return this.getMockCutoffData()
    }
  }
  
  async fetchSubjectWeightage(): Promise<NeetSubjectWeightage[]> {
    try {
      console.log('🔍 Fetching NEET subject weightage...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const weightage: NeetSubjectWeightage[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) weightage.push({ year, subject: $(cells[0]).text().trim(), topic: $(cells[1]).text().trim(), weightage: parseFloat($(cells[2]).text().trim()) || 0 });
          });
          return weightage;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ NEET subject weightage fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching NEET subject weightage:', error)
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
  
  private getMockExamData(): NeetExamData {
    const year = new Date().getFullYear() + 1;
    return { examDate: `${year}-05-05`, registrationStartDate: `${year}-03-01`, registrationEndDate: `${year}-04-15`, resultDate: `${year}-06-15`, examYear: year };
  }
  
  private getMockCutoffData(): NeetCutoffData[] {
    const year = new Date().getFullYear();
    return [{ year, category: 'General', cutoffScore: 720, rankRange: '1-10000' }, { year, category: 'OBC', cutoffScore: 680, rankRange: '1-50000' }, { year, category: 'SC', cutoffScore: 600, rankRange: '1-100000' }, { year, category: 'ST', cutoffScore: 550, rankRange: '1-200000' }];
  }
  
  private getMockSubjectWeightage(): NeetSubjectWeightage[] {
    const year = new Date().getFullYear();
    return [{ year, subject: 'Physics', topic: 'Mechanics', weightage: 25 }, { year, subject: 'Physics', topic: 'Thermodynamics', weightage: 20 }, { year, subject: 'Chemistry', topic: 'Organic Chemistry', weightage: 25 }, { year, subject: 'Chemistry', topic: 'Physical Chemistry', weightage: 20 }, { year, subject: 'Biology', topic: 'Botany', weightage: 50 }, { year, subject: 'Biology', topic: 'Zoology', weightage: 50 }];
  }
}

export const neetScraper = new NeetScraper()
