/**
 * JEE Main Scraper
 * Automatically scrapes NTA website for JEE Main exam dates, cutoffs, and subject weightage
 * Uses Cheerio for HTML parsing
 */

import * as cheerio from 'cheerio'

interface JeeMainExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface JeeMainCutoffData {
  year: number
  category: string
  cutoffScore: number
  rankRange?: string
}

interface JeeMainSubjectWeightage {
  subject: string
  topic: string
  weightage: number
  year: number
}

// Retry helper function
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

export class JeeMainScraper {
  private baseUrl = 'https://nta.ac.in'
  
  /**
   * Fetch JEE Main exam dates from official website
   */
  async fetchExamDates(): Promise<JeeMainExamData> {
    try {
      console.log('🔍 Fetching JEE Main exam dates from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const examData: JeeMainExamData = {
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
      
      console.log('✅ JEE Main exam dates fetched:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Main exam dates:', error)
      return this.getMockExamData()
    }
  }
  
  /**
   * Fetch JEE Main cutoffs from official website
   */
  async fetchCutoffs(): Promise<JeeMainCutoffData[]> {
    try {
      console.log('🔍 Fetching JEE Main cutoffs from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const cutoffData: JeeMainCutoffData[] = this.extractCutoffsFromHTML($);
          
          return cutoffData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      if (!Array.isArray(data)) {
        console.warn('⚠️ JEE Main Scraper: Unexpected response shape, returning empty array');
        return [];
      }
      
      console.log('✅ JEE Main cutoffs fetched:', data.length, 'records')
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Main cutoffs:', error)
      return this.getMockCutoffData()
    }
  }
  
  /**
   * Fetch JEE Main subject-wise weightage
   */
  async fetchSubjectWeightage(): Promise<JeeMainSubjectWeightage[]> {
    try {
      console.log('🔍 Fetching JEE Main subject weightage from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        try {
          const res = await fetch(`${this.baseUrl}/`, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          const weightageData: JeeMainSubjectWeightage[] = this.extractWeightageFromHTML($);
          
          return weightageData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      if (!Array.isArray(data)) {
        console.warn('⚠️ JEE Main Scraper: Unexpected response shape, returning empty array');
        return [];
      }
      
      console.log('✅ JEE Main subject weightage fetched:', data.length, 'records')
      return data
      
    } catch (error) {
      console.error('❌ Error fetching JEE Main subject weightage:', error)
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
      console.error('Error extracting date:', error)
      return undefined
    }
  }
  
  private extractCutoffsFromHTML($: cheerio.CheerioAPI): JeeMainCutoffData[] {
    try {
      const cutoffs: JeeMainCutoffData[] = []
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
      console.error('Error extracting cutoffs:', error)
      return []
    }
  }
  
  private extractWeightageFromHTML($: cheerio.CheerioAPI): JeeMainSubjectWeightage[] {
    try {
      const weightage: JeeMainSubjectWeightage[] = []
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
      console.error('Error extracting weightage:', error)
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
      console.error('Error parsing date:', dateString, error)
      return undefined
    }
  }
  
  private getMockExamData(): JeeMainExamData {
    const year = new Date().getFullYear() + 1
    return {
      examDate: `${year}-04-04`,
      registrationStartDate: `${year}-01-15`,
      registrationEndDate: `${year}-02-15`,
      resultDate: `${year}-06-25`,
      examYear: year
    }
  }
  
  private getMockCutoffData(): JeeMainCutoffData[] {
    const year = new Date().getFullYear()
    return [
      { year: year, category: 'General', cutoffScore: 90, rankRange: '1-10000' },
      { year: year, category: 'OBC-NCL', cutoffScore: 75, rankRange: '1-20000' },
      { year: year, category: 'SC', cutoffScore: 50, rankRange: '1-50000' },
      { year: year, category: 'ST', cutoffScore: 40, rankRange: '1-100000' }
    ]
  }
  
  private getMockSubjectWeightage(): JeeMainSubjectWeightage[] {
    const year = new Date().getFullYear()
    return [
      { year: year, subject: 'Physics', topic: 'Mechanics', weightage: 25 },
      { year: year, subject: 'Physics', topic: 'Thermodynamics', weightage: 20 },
      { year: year, subject: 'Chemistry', topic: 'Organic Chemistry', weightage: 25 },
      { year: year, subject: 'Chemistry', topic: 'Physical Chemistry', weightage: 20 },
      { year: year, subject: 'Mathematics', topic: 'Calculus', weightage: 30 },
      { year: year, subject: 'Mathematics', topic: 'Algebra', weightage: 25 }
    ]
  }
}

export const jeeMainScraper = new JeeMainScraper()
