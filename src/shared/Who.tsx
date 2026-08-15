const APP_LOGO = `${import.meta.env.BASE_URL}favicon.svg`

export function Avatar({
  src,
  size = 'md',
}: {
  src?: string
  size?: 'sm' | 'md'
}) {
  return (
    <img
      className={size === 'sm' ? 'avatar sm' : 'avatar'}
      src={src || APP_LOGO}
      alt=""
      referrerPolicy="no-referrer"
    />
  )
}

export function Who({
  name,
  picture,
  size = 'sm',
}: {
  name: string
  picture?: string
  size?: 'sm' | 'md'
}) {
  return (
    <span className="who">
      <Avatar src={picture} size={size} />
      <span className="who-name">{name}</span>
    </span>
  )
}
