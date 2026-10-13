/**
 * GATE Exam Web Scraper
 * Automatically scrapes GATE official website for exam dates and cutoffs
 * Uses Cheerio for HTML parsing
 */

import * as cheerio from 'cheerio'

interface GateExamData {
  examDate?: string
  registrationStartDate?: string
  registrationEndDate?: string
  resultDate?: string
  examYear?: number
}

interface GateCutoffData {
  year: number
  category: string
  paper: string
  qualifyingMarks: number
  rankRange?: string
}

export class GateScraper {
  private baseUrl = 'https://gate.iitb.ac.in'
  
  /**
   * Fetch GATE exam dates from official website
   */
  async fetchExamDates(): Promise<GateExamData> {
    try {
      console.log('🔍 Fetching GATE exam dates from official website...')
      
      const response = await fetch(`${this.baseUrl}/`)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Try to extract dates from the website
      // Note: These selectors are examples - you'll need to inspect the actual website
      // to find the correct CSS selectors for exam dates
      
      const examData: GateExamData = {
        examDate: this.extractDateFromHTML($, 'exam-date'),
        registrationStartDate: this.extractDateFromHTML($, 'registration-start'),
        registrationEndDate: this.extractDateFromHTML($, 'registration-end'),
        resultDate: this.extractDateFromHTML($, 'result-date'),
        examYear: new Date().getFullYear() + 1
      }
      
      console.log('✅ GATE exam dates fetched:', examData)
      return examData
      
    } catch (error) {
      console.error('❌ Error fetching GATE exam dates:', error)
      // Return mock data as fallback
      return this.getMockExamData()
    }
  }
  
  /**
   * Fetch GATE cutoffs from official website
   */
  async fetchCutoffs(): Promise<GateCutoffData[]> {
    try {
      console.log('🔍 Fetching GATE cutoffs from official website...')
      
      const response = await fetch(`${this.baseUrl}/cutoff`)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Try to extract cutoffs from the website
      // Note: These selectors are examples - you'll need to inspect the actual website
      // to find the correct CSS selectors for cutoff tables
      
      const cutoffData: GateCutoffData[] = this.extractCutoffsFromHTML($)
      
      console.log('✅ GATE cutoffs fetched:', cutoffData.length, 'records')
      return cutoffData
      
    } catch (error) {
      console.error('❌ Error fetching GATE cutoffs:', error)
      // Return mock data as fallback
      return this.getMockCutoffData()
    }
  }
  
  /**
   * Extract dates from HTML using Cheerio
   * This is a placeholder - you need to update selectors based on actual website structure
   */
  private extractDateFromHTML($: cheerio.CheerioAPI, type: string): string | undefined {
    try {
      // Example selectors - you need to inspect the actual website to find correct ones
      // These are common patterns that might work
      
      switch (type) {
        case 'registration-start':
          // Try to find registration start date
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
  
  /**
   * Extract cutoffs from HTML using Cheerio
   * This is a placeholder - you need to update selectors based on actual website structure
   */
  private extractCutoffsFromHTML($: cheerio.CheerioAPI): GateCutoffData[] {
    try {
      const cutoffs: GateCutoffData[] = []
      
      // Example: Look for cutoff tables
      $('table').each((_, table) => {
        const $table = $(table)
        const year = new Date().getFullYear()
        
        // Example parsing logic - update based on actual table structure
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row)
          const cells = $row.find('td')
          
          if (cells.length >= 3) {
            cutoffs.push({
              year: year,
              category: $(cells[0]).text().trim(),
              paper: $(cells[1]).text().trim(),
              qualifyingMarks: parseFloat($(cells[2]).text().trim()) || 0
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
  
  /**
   * Parse date string to ISO format
   */
  private parseDate(dateString: string): string | undefined {
    try {
      // Remove common words and parse
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
  
  /**
   * Check if data has changed since last update
   */
  async checkForChanges(currentData: GateExamData, previousData: GateExamData): Promise<boolean> {
    const changes = []
    
    if (currentData.examDate !== previousData.examDate) {
      changes.push('examDate')
    }
    if (currentData.registrationStartDate !== previousData.registrationStartDate) {
      changes.push('registrationStartDate')
    }
    if (currentData.registrationEndDate !== previousData.registrationEndDate) {
      changes.push('registrationEndDate')
    }
    if (currentData.resultDate !== previousData.resultDate) {
      changes.push('resultDate')
    }
    
    if (changes.length > 0) {
      console.log('📊 Changes detected:', changes)
      return true
    }
    
    console.log('✅ No changes detected')
    return false
  }
  
  /**
   * Get mock exam data as fallback
   */
  private getMockExamData(): GateExamData {
    const today = new Date()
    const year = today.getFullYear() + 1
    
    return {
      examDate: `${year}-02-06`,
      registrationStartDate: `${year}-08-14`,
      registrationEndDate: `${year}-09-21`,
      resultDate: `${year}-03-16`,
      examYear: year
    }
  }
  
  /**
   * Get mock cutoff data as fallback
   */
  private getMockCutoffData(): GateCutoffData[] {
    return [
      {
        year: 2024,
        category: 'General',
        paper: 'CS',
        qualifyingMarks: 28.5,
        rankRange: '1-10'
      },
      {
        year: 2024,
        category: 'OBC-NCL',
        paper: 'CS',
        qualifyingMarks: 25.7,
        rankRange: '1-10'
      },
      {
        year: 2024,
        category: 'SC',
        paper: 'CS',
        qualifyingMarks: 19.2,
        rankRange: '1-10'
      },
      {
        year: 2024,
        category: 'ST',
        paper: 'CS',
        qualifyingMarks: 12.7,
        rankRange: '1-10'
      }
    ]
  }
}

export const gateScraper = new GateScraper()
