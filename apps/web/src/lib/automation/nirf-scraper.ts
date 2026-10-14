/**
 * NIRF Ranking Scraper
 * Automatically scrapes NIRF official website for college rankings
 * Uses Cheerio for HTML parsing
 */

import * as cheerio from 'cheerio'

interface NirfRankingData {
  year: number
  instituteName: string
  instituteType: string
  state: string
  rank: number
  score: number
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

export class NirfScraper {
  private baseUrl = 'https://www.nirfindia.org'
  
  /**
   * Fetch NIRF rankings for engineering colleges
   */
  async fetchRankings(): Promise<NirfRankingData[]> {
    try {
      console.log('🔍 Fetching NIRF rankings from official website...')
      
      const data = await retry(async () => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        try {
          const res = await fetch(`${this.baseUrl}/Ranking/2024/EngineeringRanking.html`, { 
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }
          
          const html = await res.text();
          const $ = cheerio.load(html);
          
          // Try to extract rankings from the website
          const rankingData: NirfRankingData[] = this.extractRankingsFromHTML($);
          
          return rankingData;
        } finally {
          clearTimeout(timeout);
        }
      }, 3, 2000);
      
      // Ensure we always return an array
      if (!Array.isArray(data)) {
        console.warn('⚠️ NirfScraper: Unexpected response shape, returning empty array');
        return [];
      }
      
      console.log('✅ NIRF rankings fetched:', data.length, 'records')
      return data
      
    } catch (error) {
      console.error('❌ Error fetching NIRF rankings:', error)
      console.log('📋 Using mock data as fallback')
      // Return mock data as fallback
      return this.getMockRankingData()
    }
  }
  
  /**
   * Extract rankings from HTML using Cheerio
   * This is a placeholder - you need to update selectors based on actual website structure
   */
  private extractRankingsFromHTML($: cheerio.CheerioAPI): NirfRankingData[] {
    try {
      const rankings: NirfRankingData[] = []
      const year = new Date().getFullYear()
      
      // Example: Look for ranking tables
      $('table').each((_, table) => {
        const $table = $(table)
        
        // Example parsing logic - update based on actual table structure
        $table.find('tr').slice(1).each((_, row) => {
          const $row = $(row)
          const cells = $row.find('td')
          
          if (cells.length >= 5) {
            rankings.push({
              year: year,
              instituteName: $(cells[1]).text().trim(),
              instituteType: $(cells[2]).text().trim(),
              state: $(cells[3]).text().trim(),
              rank: parseInt($(cells[0]).text().trim()) || 0,
              score: parseFloat($(cells[4]).text().trim()) || 0
            })
          }
        })
      })
      
      return rankings
    } catch (error) {
      console.error('Error extracting rankings:', error)
      return []
    }
  }
  
  /**
   * Get mock ranking data as fallback
   */
  private getMockRankingData(): NirfRankingData[] {
    const year = new Date().getFullYear()
    return [
      {
        year: year,
        instituteName: 'Indian Institute of Technology Bombay',
        instituteType: 'IIT',
        state: 'Maharashtra',
        rank: 1,
        score: 89.5
      },
      {
        year: year,
        instituteName: 'Indian Institute of Technology Delhi',
        instituteType: 'IIT',
        state: 'Delhi',
        rank: 2,
        score: 88.2
      },
      {
        year: year,
        instituteName: 'Indian Institute of Technology Madras',
        instituteType: 'IIT',
        state: 'Tamil Nadu',
        rank: 3,
        score: 87.8
      },
      {
        year: year,
        instituteName: 'Indian Institute of Technology Kanpur',
        instituteType: 'IIT',
        state: 'Uttar Pradesh',
        rank: 4,
        score: 86.5
      },
      {
        year: year,
        instituteName: 'Indian Institute of Technology Kharagpur',
        instituteType: 'IIT',
        state: 'West Bengal',
        rank: 5,
        score: 85.9
      },
      {
        year: year,
        instituteName: 'National Institute of Technology Trichy',
        instituteType: 'NIT',
        state: 'Tamil Nadu',
        rank: 9,
        score: 78.5
      },
      {
        year: year,
        instituteName: 'National Institute of Technology Karnataka',
        instituteType: 'NIT',
        state: 'Karnataka',
        rank: 10,
        score: 77.2
      }
    ]
  }
}

export const nirfScraper = new NirfScraper()
