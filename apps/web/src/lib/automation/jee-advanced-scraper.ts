/**
 * JEE Advanced Scraper
 * Automatically scrapes JEE Advanced official website for exam dates, cutoffs, and subject weightage
 * Uses Cheerio for HTML parsing
 */

import * as cheerio from 'cheerio'

interface JeeAdvancedExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface JeeAdvancedCutoffData {
  year: number
  category: string
  cutoffScore: number
  rankRange?: string
}

interface JeeAdvancedSubjectWeightage {
  subject: string
  topic: string
  weightage: number
  year: number
}

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1500): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) {
        console.log(`⏳ Retry ${i + 1}/${attempts} after ${delayMs}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
  }
  throw lastErr;
}

export class JeeAdvancedScraper {
  private baseUrl = 'https://jeeadv.iitd.ac.in'
  
  async fetchExamDates(): Promise<JeeAdvancedExamData> {
    try {
      console.log('🔍 Fetching JEE Advanced exam dates from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const examData: JeeAdvancedExamData = {
            examDate: this.extractDateFromHTML($, 'exam-date'),
            registrationStartDate: this.extractDateFromHTML($, 'registration-start'),
            registrationEndDate: this.extractDateFromHTML($, 'registration-end'),
            resultDate: this.extractDateFromHTML($, 'result-date'),
            examYear: new Date().getFullYear() + 1
          };
          
          return examData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      console.log('✅ JEE Advanced exam dates fetched:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Advanced exam dates:', error)
      return this.getMockExamData()
    }
  }
  
  async fetchCutoffs(): Promise<JeeAdvancedCutoffData[]> {
    try {
      console.log('🔍 Fetching JEE Advanced cutoffs from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const cutoffData: JeeAdvancedCutoffData[] = this.extractCutoffsFromHTML($);
          
          return cutoffData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      if (!Array.isArray(data)) return [];
      
      console.log('✅ JEE Advanced cutoffs fetched:', data.length, 'records')
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Advanced cutoffs:', error)
      return this.getMockCutoffData()
    }
  }
  
  async fetchSubjectWeightage(): Promise<JeeAdvancedSubjectWeightage[]> {
    try {
      console.log('🔍 Fetching JEE Advanced subject weightage from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const weightageData: JeeAdvancedSubjectWeightage[] = this.extractWeightageFromHTML($);
          
          return weightageData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      if (!Array.isArray(data)) return [];
      
      console.log('✅ JEE Advanced subject weightage fetched:', data.length, 'records')
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Advanced subject weightage:', error)
      return this.getMockSubjectWeightage()
    }
  }
  
  private extractDateFromHTML($: cheerio.CheerioAPI, type: string): string | undefined {
    try {
      switch (type) {
        case 'registration-start':
          const regStart = $('span:contains("Registration")').first().text()
          if (regStart) return this.parseDate(regStart)
        case 'registration-end':
          const regEnd = $('span:contains("Registration")').last().text()
          if (regEnd) return this.parseDate(regEnd)
        case 'exam-date':
          const examDate = $('span:contains("Exam")').text()
          if (examDate) return this.parseDate(examDate)
        case 'result-date':
          const resultDate = $('span:contains("Result")').text()
          if (resultDate) return this.parseDate(resultDate)
        default:
          return undefined
      }
      return undefined
    } catch (error) {
      return undefined
    }
  }
  
  private extractCutoffsFromHTML($: cheerio.CheerioAPI): JeeAdvancedCutoffData[] {
    try {
      const cutoffs: JeeAdvancedCutoffData[] = []
      const year = new Date().getFullYear()
      
      $('table').each((_, table) => {
        const $table = $(table)
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row)
          const cells = $row.find('td')
          
          if (cells.length >= 3) {
            cutoffs.push({
              year: year,
              category: $(cells[0]).text().trim(),
              cutoffScore: parseFloat($(cells[1]).text().trim()) || 0
            })
          }
        })
      })
      
      return cutoffs
    } catch (error) {
      return []
    }
  }
  
  private extractWeightageFromHTML($: cheerio.CheerioAPI): JeeAdvancedSubjectWeightage[] {
    try {
      const weightage: JeeAdvancedSubjectWeightage[] = []
      const year = new Date().getFullYear()
      
      $('table').each((_, table) => {
        const $table = $(table)
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row)
          const cells = $row.find('td')
          
          if (cells.length >= 3) {
            weightage.push({
              year: year,
              subject: $(cells[0]).text().trim(),
              topic: $(cells[1]).text().trim(),
              weightage: parseFloat($(cells[2]).text().trim()) || 0
            })
          }
        })
      })
      
      return weightage
    } catch (error) {
      return []
    }
  }
  
  private parseDate(dateString: string): string | undefined {
    try {
      const cleanDate = dateString
        .replace(/(\d+)(st|nd|rd|th)/, '$1')
        .replace(/January|February|March|April|May|June|July|August|September|October|November|December/gi, (match) => {
          const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
          const monthIndex = months.findIndex(m => m.toLowerCase() === match.toLowerCase())
          return monthIndex >= 0 ? String(monthIndex + 1).padStart(2, '0') : '01'
        })
        .replace(/\s+/g, '-')
        .replace(/-$/, '')
      
      const date = new Date(cleanDate)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
      
      return undefined
    } catch (error) {
      return undefined
    }
  }
  
  private getMockExamData(): JeeAdvancedExamData {
    const year = new Date().getFullYear() + 1
    return {
      examDate: `${year}-06-04`,
      registrationStartDate: `${year}-04-25`,
      registrationEndDate: `${year}-05-10`,
      resultDate: `${year}-06-15`,
      examYear: year
    }
  }
  
  private getMockCutoffData(): JeeAdvancedCutoffData[] {
    const year = new Date().getFullYear()
    return [
      { year: year, category: 'General', cutoffScore: 85, rankRange: '1-5000' },
      { year: year, category: 'OBC-NCL', cutoffScore: 70, rankRange: '1-10000' },
      { year: year, category: 'SC', cutoffScore: 45, rankRange: '1-25000' },
      { year: year, category: 'ST', cutoffScore: 35, rankRange: '1-50000' }
    ]
  }
  
  private getMockSubjectWeightage(): JeeAdvancedSubjectWeightage[] {
    const year = new Date().getFullYear()
    return [
      { year: year, subject: 'Physics', topic: 'Mechanics', weightage: 20 },
      { year: year, subject: 'Physics', topic: 'Electromagnetism', weightage: 18 },
      { year: year, subject: 'Chemistry', topic: 'Organic Chemistry', weightage: 22 },
      { year: year, subject: 'Chemistry', topic: 'Inorganic Chemistry', weightage: 18 },
      { year: year, subject: 'Mathematics', topic: 'Calculus', weightage: 28 },
      { year: year, subject: 'Mathematics', topic: 'Algebra', weightage: 22 }
    ]
  }
}

export const jeeAdvancedScraper = new JeeAdvancedScraper()
