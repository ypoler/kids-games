import { useState } from 'react'
import { useVocabCatalog } from '../games/vocab/VocabCatalog'
import type { VocabPack } from '../games/vocab/engine'
import { IconBack, IconClose } from '../shared/Icons'
import { t } from '../shared/i18n'
import { SHEETS_NOT_CONFIGURED } from '../shared/sheets'
import { useStore } from '../shared/store'
import {
  resolvedGames,
  PACKS_NONE,
  isAllPacks,
  isNoPacks,
  ADD_MAX_CHOICES,
  FRAC_MAX_CHOICES,
  type RoundGoal,
  type AddMax,
  type FracMax,
} from '../shared/types'

export { ParentCorner as SettingsSheet }

function packQuery(s: string) {
  return s.trim().toLowerCase()
}

type Section =
  | 'menu'
  | 'general'
  | 'multiplication'
  | 'add-sub'
  | 'fractions'
  | 'vocab-mc'
  | 'vocab-match'

const MENU: { id: Exclude<Section, 'menu'>; emoji: string; label: string }[] = [
  { id: 'general', emoji: '⚙️', label: t.settingsGeneral },
  { id: 'multiplication', emoji: '✖️', label: t.multiply },
  { id: 'add-sub', emoji: '➕', label: t.addSub },
  { id: 'fractions', emoji: '🍕', label: t.fractions },
  { id: 'vocab-mc', emoji: '🔤', label: t.vocabMc },
  { id: 'vocab-match', emoji: '🧩', label: t.vocabMatch },
]

export function ParentCorner({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const [section, setSection] = useState<Section>('menu')
  const { state, updateGeneral, updateGameSettings, resetProgress } = useStore()

  if (!open && section !== 'menu') {
    setSection('menu')
  }
  const games = resolvedGames(state)
  const playerId = state.currentPlayerId
  const { packs, ready } = useVocabCatalog()

  if (!open) return null

  const current = MENU.find((m) => m.id === section)
  const title =
    section === 'menu'
      ? t.settings
      : current
        ? `${current.emoji} ${current.label}`
        : t.settings

  function close() {
    setSection('menu')
    onClose()
  }

  return (
    <div className="sheet" dir="rtl" role="dialog" aria-label={t.settings}>
      <div className="sheet-bar">
        {section === 'menu' ? (
          <span className="app-bar-slot" />
        ) : (
          <button
            type="button"
            className="icon-btn back"
            aria-label={t.settingsBack}
            onClick={() => setSection('menu')}
          >
            <IconBack />
          </button>
        )}
        <h2 className="sheet-title">{title}</h2>
        <button type="button" className="icon-btn" aria-label={t.close} onClick={close}>
          <IconClose />
        </button>
      </div>

      {section === 'menu' ? (
        <nav className="settings-nav" aria-label={t.settings}>
          {MENU.map((item) => (
            <button
              key={item.id}
              type="button"
              className="tap settings-nav-item"
              onClick={() => setSection(item.id)}
            >
              <span className="settings-nav-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              {item.label}
            </button>
          ))}
        </nav>
      ) : null}

      {section === 'general' ? (
        <>
          <label className="check">
            <input
              type="checkbox"
              checked={state.general.sound}
              onChange={(e) => updateGeneral({ sound: e.target.checked })}
            />
            {t.sound}
          </label>
          <p className="label">{t.theme}</p>
          <div className="chip-row">
            {(
              [
                ['light', t.themeLight],
                ['dark', t.themeDark],
                ['system', t.themeSystem],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={state.general.theme === id ? 'tap chip on' : 'tap chip'}
                onClick={() => updateGeneral({ theme: id })}
              >
                {label}
              </button>
            ))}
          </div>
          {playerId ? (
            <button type="button" className="tap danger" onClick={() => resetProgress(playerId)}>
              {t.reset}
            </button>
          ) : null}
          <p className="muted">
            {t.unpublished}: {state.outbox.length}
          </p>
          {SHEETS_NOT_CONFIGURED ? <p className="muted">{t.syncLater}</p> : null}
        </>
      ) : null}

      {section === 'multiplication' ? (
        <MultSettings
          missing={games.multiplication.missing}
          tables={games.multiplication.tables}
          round={games.multiplication.round}
          onMissing={(missing) => updateGameSettings({ multiplication: { missing } })}
          onTables={(tables) => updateGameSettings({ multiplication: { tables } })}
          onRound={(round) => updateGameSettings({ multiplication: { round } })}
        />
      ) : null}

      {section === 'add-sub' ? (
        <AddSubSettings
          max={games.addSub.max}
          round={games.addSub.round}
          onMax={(max) => updateGameSettings({ addSub: { max } })}
          onRound={(round) => updateGameSettings({ addSub: { round } })}
        />
      ) : null}

      {section === 'fractions' ? (
        <FractionsSettings
          max={games.fractions.max}
          round={games.fractions.round}
          onMax={(max) => updateGameSettings({ fractions: { max } })}
          onRound={(round) => updateGameSettings({ fractions: { round } })}
        />
      ) : null}

      {section === 'vocab-mc' ? (
        <VocabSettingsPanel
          packs={packs}
          loading={!ready}
          packIds={games.vocabMc.packIds}
          heToEn={games.vocabMc.heToEn}
          onPacks={(packIds) => updateGameSettings({ vocabMc: { packIds } })}
          onHeToEn={(heToEn) => updateGameSettings({ vocabMc: { heToEn } })}
          round={games.vocabMc.round}
          onRound={(round) => updateGameSettings({ vocabMc: { round } })}
        />
      ) : null}

      {section === 'vocab-match' ? (
        <VocabSettingsPanel
          packs={packs}
          loading={!ready}
          packIds={games.vocabMatch.packIds}
          onPacks={(packIds) => updateGameSettings({ vocabMatch: { packIds } })}
          round={games.vocabMatch.round}
          onRound={(round) => updateGameSettings({ vocabMatch: { round } })}
        />
      ) : null}
    </div>
  )
}

function AddSubSettings({
  max,
  round,
  onMax,
  onRound,
}: {
  max: AddMax
  round: RoundGoal
  onMax: (n: AddMax) => void
  onRound: (r: RoundGoal) => void
}) {
  return (
    <>
      <RoundPicker round={round} onRound={onRound} />
      <p className="label">{t.maxNumber}</p>
      <div className="chip-row">
        {ADD_MAX_CHOICES.map((n) => (
          <button
            key={n}
            type="button"
            className={max === n ? 'tap chip on' : 'tap chip'}
            onClick={() => onMax(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </>
  )
}

function FractionsSettings({
  max,
  round,
  onMax,
  onRound,
}: {
  max: FracMax
  round: RoundGoal
  onMax: (n: FracMax) => void
  onRound: (r: RoundGoal) => void
}) {
  return (
    <>
      <RoundPicker round={round} onRound={onRound} />
      <p className="label">{t.fracMaxSlices}</p>
      <div className="chip-row">
        {FRAC_MAX_CHOICES.map((n) => (
          <button
            key={n}
            type="button"
            className={max === n ? 'tap chip on' : 'tap chip'}
            onClick={() => onMax(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </>
  )
}

function MultSettings({
  missing,
  tables,
  round,
  onMissing,
  onTables,
  onRound,
}: {
  missing: boolean
  tables: number[]
  round: RoundGoal
  onMissing: (v: boolean) => void
  onTables: (n: number[]) => void
  onRound: (r: RoundGoal) => void
}) {
  return (
    <>
      <RoundPicker round={round} onRound={onRound} />
      <label className="check">
        <input type="checkbox" checked={missing} onChange={(e) => onMissing(e.target.checked)} />
        {t.missing}
      </label>
      <p className="label">{t.tablesOn}</p>
      <div className="chip-row">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
          const on = tables.includes(n)
          return (
            <button
              key={n}
              type="button"
              className={on ? 'tap chip on' : 'tap chip'}
              onClick={() => {
                const next = on ? tables.filter((x) => x !== n) : [...tables, n].sort((a, b) => a - b)
                onTables(next.length ? next : [2])
              }}
            >
              {n}
            </button>
          )
        })}
      </div>
    </>
  )
}

function RoundPicker({ round, onRound }: { round: RoundGoal; onRound: (r: RoundGoal) => void }) {
  const q5 = round.type === 'questions' && round.count === 5
  const q10 = round.type === 'questions' && round.count === 10
  const timed = round.type === 'timed'
  return (
    <>
      <p className="label">{t.roundGoal}</p>
      <div className="chip-row">
        <button
          type="button"
          className={q5 ? 'tap chip on' : 'tap chip'}
          onClick={() => onRound({ type: 'questions', count: 5 })}
        >
          {t.q5}
        </button>
        <button
          type="button"
          className={q10 ? 'tap chip on' : 'tap chip'}
          onClick={() => onRound({ type: 'questions', count: 10 })}
        >
          {t.q10}
        </button>
        <button
          type="button"
          className={timed ? 'tap chip on' : 'tap chip'}
          onClick={() => onRound({ type: 'timed' })}
        >
          {t.timed}
        </button>
      </div>
    </>
  )
}

function VocabSettingsPanel({
  packs,
  loading,
  packIds,
  heToEn,
  round,
  onPacks,
  onHeToEn,
  onRound,
}: {
  packs: VocabPack[]
  loading: boolean
  packIds: string[]
  heToEn?: boolean
  round: RoundGoal
  onPacks: (ids: string[]) => void
  onHeToEn?: (v: boolean) => void
  onRound: (r: RoundGoal) => void
}) {
  const [q, setQ] = useState('')
  const allOn = isAllPacks(packIds)
  const noneOn = isNoPacks(packIds)
  const needle = packQuery(q)
  const visible = needle
    ? packs.filter((p) => {
        if (
          packQuery(p.he).includes(needle) ||
          packQuery(p.en).includes(needle) ||
          packQuery(p.id).includes(needle)
        ) {
          return true
        }
        return p.words.some(
          (w) => packQuery(w.en).includes(needle) || packQuery(w.he).includes(needle),
        )
      })
    : packs
  const selectedCount = allOn ? packs.length : noneOn ? 0 : packIds.filter((id) => id !== PACKS_NONE).length

  function togglePack(id: string) {
    const current = allOn ? packs.map((x) => x.id) : packIds.filter((x) => x !== PACKS_NONE)
    const on = current.includes(id)
    const next = on ? current.filter((x) => x !== id) : [...current, id]
    if (next.length === 0) onPacks([PACKS_NONE])
    else if (next.length === packs.length) onPacks([])
    else onPacks(next)
  }

  return (
    <>
      {onHeToEn && heToEn !== undefined ? (
        <label className="check">
          <input type="checkbox" checked={heToEn} onChange={(e) => onHeToEn(e.target.checked)} />
          {t.heToEn}
        </label>
      ) : null}
      <RoundPicker round={round} onRound={onRound} />
      <p className="label">{t.hiddenPacks}</p>
      <p className="muted">{t.packsHint}</p>
      {loading ? <p className="muted">{t.packsLoading}</p> : null}
      <label className="field">
        <span className="sr-only">{t.packSearch}</span>
        <input
          className="text-input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.packSearch}
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
      <div className="chip-row pack-toolbar">
        <button
          type="button"
          className={allOn ? 'tap chip on' : 'tap chip'}
          onClick={() => onPacks(allOn ? [PACKS_NONE] : [])}
        >
          {t.packAll}
        </button>
        <span className="muted pack-count">
          {allOn ? t.packAllOn : noneOn ? t.packNonePicked : `${selectedCount} / ${packs.length}`}
        </span>
      </div>
      <div className="pack-list" role="list">
        {visible.length === 0 ? (
          <p className="muted">{t.packNone}</p>
        ) : (
          visible.map((p) => {
            const on = allOn || packIds.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                role="listitem"
                className={on ? 'tap pack-row on' : 'tap pack-row'}
                onClick={() => togglePack(p.id)}
                aria-pressed={on}
              >
                <span className="pack-row-text">
                  <strong>{p.he}</strong>
                  {p.en ? <span className="muted">{p.en}</span> : null}
                </span>
              </button>
            )
          })
        )}
      </div>
    </>
  )
}
