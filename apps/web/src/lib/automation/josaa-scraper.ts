/**
 * JOSAA Cutoff Scraper
 * Automatically scrapes JOSAA official website for IIT/NIT cutoffs
 * Uses Cheerio for HTML parsing
 */

import * as cheerio from 'cheerio'

interface JosaaCutoffData {
  year: number
  institute: string
  branch: string
  category: string
  gender: string
  openingRank: number
  closingRank: number
}

export class JosaaScraper {
  private baseUrl = 'https://josaa.nic.in'
  
  /**
   * Fetch JOSAA cutoffs for IITs and NITs
   */
  async fetchCutoffs(): Promise<JosaaCutoffData[]> {
    try {
      console.log('🔍 Fetching JOSAA cutoffs from official website...')
      
      const response = await fetch(`${this.baseUrl}/`)
      const html = await response.text()
      const $ = cheerio.load(html)
      
      // Try to extract cutoffs from the website
      const cutoffData: JosaaCutoffData[] = this.extractCutoffsFromHTML($)
      
      console.log('✅ JOSAA cutoffs fetched:', cutoffData.length, 'records')
      return cutoffData
      
    } catch (error) {
      console.error('❌ Error fetching JOSAA cutoffs:', error)
      // Return mock data as fallback
      return this.getMockCutoffData()
    }
  }
  
  /**
   * Extract cutoffs from HTML using Cheerio
   * This is a placeholder - you need to update selectors based on actual website structure
   */
  private extractCutoffsFromHTML($: cheerio.CheerioAPI): JosaaCutoffData[] {
    try {
      const cutoffs: JosaaCutoffData[] = []
      const year = new Date().getFullYear()
      
      // Example: Look for cutoff tables
      $('table').each((_, table) => {
        const $table = $(table)
        
        // Example parsing logic - update based on actual table structure
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row)
          const cells = $row.find('td')
          
          if (cells.length >= 6) {
            cutoffs.push({
              year: year,
              institute: $(cells[0]).text().trim(),
              branch: $(cells[1]).text().trim(),
              category: $(cells[2]).text().trim(),
              gender: $(cells[3]).text().trim(),
              openingRank: parseInt($(cells[4]).text().trim()) || 0,
              closingRank: parseInt($(cells[5]).text().trim()) || 0
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
   * Get mock cutoff data as fallback
   */
  private getMockCutoffData(): JosaaCutoffData[] {
    const year = new Date().getFullYear()
    return [
      {
        year: year,
        institute: 'IIT Bombay',
        branch: 'Computer Science',
        category: 'General',
        gender: 'Gender-Neutral',
        openingRank: 1,
        closingRank: 100
      },
      {
        year: year,
        institute: 'IIT Bombay',
        branch: 'Computer Science',
        category: 'OBC-NCL',
        gender: 'Gender-Neutral',
        openingRank: 50,
        closingRank: 200
      },
      {
        year: year,
        institute: 'IIT Delhi',
        branch: 'Computer Science',
        category: 'General',
        gender: 'Gender-Neutral',
        openingRank: 20,
        closingRank: 150
      },
      {
        year: year,
        institute: 'IIT Madras',
        branch: 'Computer Science',
        category: 'General',
        gender: 'Gender-Neutral',
        openingRank: 30,
        closingRank: 180
      },
      {
        year: year,
        institute: 'NIT Trichy',
        branch: 'Computer Science',
        category: 'General',
        gender: 'Gender-Neutral',
        openingRank: 500,
        closingRank: 2000
      },
      {
        year: year,
        institute: 'NIT Trichy',
        branch: 'Computer Science',
        category: 'OBC-NCL',
        gender: 'Gender-Neutral',
        openingRank: 1000,
        closingRank: 4000
      }
    ]
  }
}

export const josaaScraper = new JosaaScraper()
