import bundled from '../../data/vocab/packs.json'
import type { VocabPack, VocabWord } from './engine'

export const VOCAB_SHEET_ID = '13T1RHODlL5oDytVeGSh097IauQAg7ll97a8UkH1j8Hw'
export const VOCAB_SHEET_TAB = 'english'
export const VOCAB_SHEET_CSV = `https://docs.google.com/spreadsheets/d/${VOCAB_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(VOCAB_SHEET_TAB)}`

const CACHE_KEY = 'kids-games-vocab-sheet-v1'

export const bundledPacks = (bundled as { packs: VocabPack[] }).packs

type Cache = { fetchedAt: number; packs: VocabPack[] }

export function readCachedPacks(): VocabPack[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cache
    return Array.isArray(parsed.packs) && parsed.packs.length ? parsed.packs : null
  } catch {
    return null
  }
}

function writeCachedPacks(packs: VocabPack[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), packs }))
  } catch {
    /* quota */
  }
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else quoted = false
      } else cell += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') cell += c
  }
  if (cell.length || row.length) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}

export function packsFromSheetRows(rows: string[][]): VocabPack[] {
  const byCat = new Map<string, VocabWord[]>()
  const order: string[] = []
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!
    const en = (r[0] ?? '').trim()
    const he = (r[1] ?? '').trim()
    const cat = ((r[2] ?? '').trim() || 'כללי')
    if (i === 0 && /english/i.test(en)) continue
    if (!en || !he) continue
    let words = byCat.get(cat)
    if (!words) {
      words = []
      byCat.set(cat, words)
      order.push(cat)
    }
    const id = `${cat}::${en.toLowerCase()}`
    if (words.some((w) => w.id === id)) continue
    words.push({ id, en, he })
  }
  return order.map((he) => ({ id: he, he, en: '', words: byCat.get(he)! }))
}

export async function fetchVocabPacks(signal?: AbortSignal): Promise<VocabPack[]> {
  const res = await fetch(VOCAB_SHEET_CSV, { signal })
  if (!res.ok) throw new Error(`sheet ${res.status}`)
  const text = (await res.text()).replace(/^\uFEFF/, '')
  const packs = packsFromSheetRows(parseCsv(text))
  if (!packs.length) throw new Error('empty sheet')
  writeCachedPacks(packs)
  return packs
}

export function initialPacks(): VocabPack[] {
  return readCachedPacks() ?? bundledPacks
}
