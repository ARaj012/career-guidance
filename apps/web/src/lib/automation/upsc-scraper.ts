/**
 * UPSC/CSE Scraper
 * Automatically scrapes UPSC official website for exam dates, cutoffs, and subject weightage
 */

import * as cheerio from 'cheerio'

interface UpscExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface UpscCutoffData {
  year: number
  stage: string
  category: string
  cutoffMarks: number
}

interface UpscSubjectWeightage {
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

export class UpscScraper {
  private baseUrl = 'https://upsc.gov.in'
  
  async fetchExamDates(): Promise<UpscExamData> {
    try {
      console.log('🔍 Fetching UPSC exam dates...')
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
      console.log('✅ UPSC exam dates fetched:', data)
      return data
    } catch (error) {
      console.error('❌ Error fetching UPSC exam dates:', error)
      return this.getMockExamData()
    }
  }
  
  async fetchCutoffs(): Promise<UpscCutoffData[]> {
    try {
      console.log('🔍 Fetching UPSC cutoffs...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const cutoffs: UpscCutoffData[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) cutoffs.push({ year, stage: $(cells[0]).text().trim(), category: $(cells[1]).text().trim(), cutoffMarks: parseFloat($(cells[2]).text().trim()) || 0 });
          });
          return cutoffs;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ UPSC cutoffs fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching UPSC cutoffs:', error)
      return this.getMockCutoffData()
    }
  }
  
  async fetchSubjectWeightage(): Promise<UpscSubjectWeightage[]> {
    try {
      console.log('🔍 Fetching UPSC subject weightage...')
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        try {
          const res = await fetch(`${this.baseUrl}/`, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const html = await res.text();
          const $ = cheerio.load(html);
          const weightage: UpscSubjectWeightage[] = [];
          const year = new Date().getFullYear();
          $('table tr').slice(1).each((_, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) weightage.push({ year, subject: $(cells[0]).text().trim(), topic: $(cells[1]).text().trim(), weightage: parseFloat($(cells[2]).text().trim()) || 0 });
          });
          return weightage;
        } finally { clearTimeout(timeout); }
      }, 3, 2000);
      if (!Array.isArray(data)) return [];
      console.log('✅ UPSC subject weightage fetched:', data.length, 'records')
      return data
    } catch (error) {
      console.error('❌ Error fetching UPSC subject weightage:', error)
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
  
  private getMockExamData(): UpscExamData {
    const year = new Date().getFullYear() + 1;
    return { examDate: `${year}-05-26`, registrationStartDate: `${year}-02-01`, registrationEndDate: `${year}-02-21`, resultDate: `${year}-06-15`, examYear: year };
  }
  
  private getMockCutoffData(): UpscCutoffData[] {
    const year = new Date().getFullYear();
    return [{ year, stage: 'Prelims', category: 'General', cutoffMarks: 125 }, { year, stage: 'Prelims', category: 'OBC', cutoffMarks: 115 }, { year, stage: 'Prelims', category: 'SC', cutoffMarks: 105 }, { year, stage: 'Prelims', category: 'ST', cutoffMarks: 95 }];
  }
  
  private getMockSubjectWeightage(): UpscSubjectWeightage[] {
    const year = new Date().getFullYear();
    return [{ year, subject: 'Current Affairs', topic: 'National', weightage: 40 }, { year, subject: 'History', topic: 'Ancient', weightage: 15 }, { year, subject: 'Geography', topic: 'Physical', weightage: 20 }, { year, subject: 'Polity', topic: 'Constitution', weightage: 15 }, { year, subject: 'Economy', topic: 'Macroeconomics', weightage: 10 }];
  }
}

export const upscScraper = new UpscScraper()
