import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(import.meta.dirname, '..', '.env')
try {
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
} catch {
  // .env file not found
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const oldIds = [
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  '00000000-0000-4000-8000-000000000007',
  '00000000-0000-4000-8000-000000000008',
  '00000000-0000-4000-8000-000000000009',
  '00000000-0000-4000-8000-000000000010',
]

async function main() {
  console.log('Finding old demo items...')
  const { data: found, error: findError } = await supabase
    .from('items')
    .select('id, name, price, category')
    .in('id', oldIds)

  if (findError) {
    console.error('Error finding items:', findError.message)
    process.exit(1)
  }

  console.log(`Found ${found?.length ?? 0} demo items to delete:`)
  for (const item of found ?? []) {
    console.log(` - [${item.id}] ${item.name} (₹${item.price}, ${item.category})`)
  }

  if (found && found.length > 0) {
    const { data: deleted, error: delError } = await supabase
      .from('items')
      .delete()
      .in('id', oldIds)
      .select('id, name')

    if (delError) {
      console.error('Delete failed:', delError.message)
      process.exit(1)
    }

    console.log(`Successfully deleted ${deleted?.length ?? 0} demo items.`)
  } else {
    console.log('No demo items found matching known IDs.')
  }

  const { count } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })

  console.log(`Total remaining items in database: ${count}`)
}

main()
