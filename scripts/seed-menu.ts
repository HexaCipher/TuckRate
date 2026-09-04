/**
 * Seed the `items` table from data/menu-seed.json.
 *
 * Usage:  npx tsx scripts/seed-menu.ts
 *
 * Requires VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in .env
 * (service-role key bypasses RLS so we can insert freely).
 *
 * Safe to re-run: checks which item names already exist and only inserts
 * new ones, so running twice won't create duplicates.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ---------------------------------------------------------------------------
// 1. Read env
// ---------------------------------------------------------------------------
// Support both dotenv-style and raw process.env
// Try to load .env manually (no dotenv dep — just read the file)
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
  // .env file not found — rely on process.env
}

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env\n' +
      'The seed script needs the service-role key (not the anon key) to bypass RLS.',
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

// ---------------------------------------------------------------------------
// 2. Load & flatten menu JSON
// ---------------------------------------------------------------------------
interface MenuItem {
  name: string
  price: number
  is_veg: boolean
}

interface MenuCategory {
  category: string
  items: MenuItem[]
}

interface MenuSeed {
  menu: MenuCategory[]
}

const seedPath = resolve(import.meta.dirname, '..', 'data', 'menu-seed.json')
const seedData: MenuSeed = JSON.parse(readFileSync(seedPath, 'utf-8'))

const allItems = seedData.menu.flatMap((cat) =>
  cat.items.map((item) => ({
    name: item.name,
    price: item.price,
    category: cat.category,
    is_veg: item.is_veg,
    is_active: true,
    // description and photo_url intentionally omitted (null)
  })),
)

console.log(`📋 Source JSON contains ${allItems.length} items across ${seedData.menu.length} categories`)

// ---------------------------------------------------------------------------
// 3. Check for existing items (by name) to avoid duplicates
// ---------------------------------------------------------------------------
const { data: existingItems, error: fetchError } = await supabase
  .from('items')
  .select('name')

if (fetchError) {
  console.error('Failed to fetch existing items:', fetchError.message)
  process.exit(1)
}

const existingNames = new Set((existingItems ?? []).map((i: { name: string }) => i.name))
const newItems = allItems.filter((item) => !existingNames.has(item.name))

console.log(`📦 ${existingNames.size} items already exist in the database`)
console.log(`🆕 ${newItems.length} new items to insert`)

if (newItems.length === 0) {
  console.log('✅ Nothing to insert — all items already exist.')
  process.exit(0)
}

// ---------------------------------------------------------------------------
// 4. Bulk insert
// ---------------------------------------------------------------------------
const { data: inserted, error: insertError } = await supabase
  .from('items')
  .insert(newItems)
  .select('id')

if (insertError) {
  console.error('Insert failed:', insertError.message)
  process.exit(1)
}

console.log(`✅ Inserted ${inserted?.length ?? 0} rows`)

// ---------------------------------------------------------------------------
// 5. Verify total count
// ---------------------------------------------------------------------------
const { count, error: countError } = await supabase
  .from('items')
  .select('*', { count: 'exact', head: true })

if (countError) {
  console.error('Count query failed:', countError.message)
} else {
  console.log(`📊 Total items in database: ${count}`)
}
