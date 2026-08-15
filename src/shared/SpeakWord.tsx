import { t } from './i18n'
import { IconSpeak } from './Icons'
import { canSpeakEnglish, speakEnglish } from './sound'

export function SpeakWord({ text }: { text: string }) {
  if (!canSpeakEnglish() || !text.trim()) return null
  return (
    <button
      type="button"
      className="icon-btn speak-btn"
      aria-label={t.speak}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        speakEnglish(text, true)
      }}
    >
      <IconSpeak />
    </button>
  )
}
