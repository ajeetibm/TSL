import { SITE } from '../constants/site'

export function setPageMetadata(title: string, description: string) {
  document.title = `${title} | ${SITE.name}`

  const existing = document.querySelector('meta[name="description"]')
  const meta = existing ?? document.createElement('meta')
  meta.setAttribute('name', 'description')
  meta.setAttribute('content', description)

  if (!existing) {
    document.head.appendChild(meta)
  }
}
