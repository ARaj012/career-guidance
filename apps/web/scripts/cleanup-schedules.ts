import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function cleanupSchedules() {
  console.log('🧹 Cleaning up duplicate exam schedules...\n')
  
  // Get all exams
  const { data: exams } = await supabase
    .from('exams')
    .select('id, name, slug')
  
  if (!exams) {
    console.log('No exams found')
    return
  }
  
  for (const exam of exams) {
    console.log(`\n📝 ${exam.name} (${exam.slug}):`)
    
    // Get all schedules for this exam
    const { data: schedules } = await supabase
      .from('exam_schedules')
      .select('*')
      .eq('exam_id', exam.id)
      .order('year', { ascending: false })
    
    if (!schedules || schedules.length === 0) {
      console.log('  No schedules')
      continue
    }
    
    // Group by year
    const byYear: { [key: number]: any[] } = {}
    schedules.forEach(s => {
      if (!byYear[s.year]) byYear[s.year] = []
      byYear[s.year].push(s)
    })
    
    // For each year, keep the one with data, delete the NULL ones
    for (const [year, yearSchedules] of Object.entries(byYear)) {
      if (yearSchedules.length === 1) {
        console.log(`  Year ${year}: 1 record (keeping)`)
        continue
      }
      
      console.log(`  Year ${year}: ${yearSchedules.length} records (cleaning...)`)
      
      // Find one with actual data
      const withData = yearSchedules.find(s => 
        s.registration_start || s.registration_end || s.exam_date_start || s.result_date
      )
      
      if (withData) {
        console.log(`    ✓ Keeping record with data (ID: ${withData.id})`)
        console.log(`      Registration: ${withData.registration_start} to ${withData.registration_end}`)
        console.log(`      Exam: ${withData.exam_date_start}`)
        console.log(`      Result: ${withData.result_date}`)
        
        // Delete the NULL ones
        const toDelete = yearSchedules.filter(s => s.id !== withData.id)
        for (const record of toDelete) {
          const { error } = await supabase
            .from('exam_schedules')
            .delete()
            .eq('id', record.id)
          
          if (error) {
            console.log(`    ✗ Failed to delete ${record.id}: ${error.message}`)
          } else {
            console.log(`    ✓ Deleted NULL record (ID: ${record.id})`)
          }
        }
      } else {
        // All are NULL, keep one, delete the rest
        const toKeep = yearSchedules[0]
        const toDelete = yearSchedules.slice(1)
        
        console.log(`    ✓ Keeping one NULL record (ID: ${toKeep.id})`)
        
        for (const record of toDelete) {
          const { error } = await supabase
            .from('exam_schedules')
            .delete()
            .eq('id', record.id)
          
          if (error) {
            console.log(`    ✗ Failed to delete ${record.id}: ${error.message}`)
          } else {
            console.log(`    ✓ Deleted duplicate NULL record (ID: ${record.id})`)
          }
        }
      }
    }
  }
  
  console.log('\n✅ Cleanup complete!')
}

cleanupSchedules()
