import type { Person } from '../types'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function categoryLabel(category: Person['category']) {
  return category[0].toUpperCase() + category.slice(1)
}

function links(person: Person) {
  return [
    ['Portfolio', person.portfolio_url],
    ['GitHub', person.github_url],
    ['Website', person.website_url],
    ['Contact', person.contact_url],
  ].filter((item): item is [string, string] => Boolean(item[1]))
}

export default function PersonCard({ person, compact = false }: { person: Person; compact?: boolean }) {
  return (
    <article className={`person-card category-${person.category} ${compact ? 'person-card-compact' : ''}`}>
      <div className="person-card-topline">
        <span>{categoryLabel(person.category)}</span>
        {person.is_featured && <span className="featured-chip">Featured</span>}
      </div>

      <div className="person-identity">
        <div className="monogram" aria-hidden="true">{person.monogram || initials(person.display_name)}</div>
        <div>
          <h2>{person.display_name}</h2>
          <p>{person.role}</p>
        </div>
      </div>

      {!compact && <p className="person-bio">{person.bio}</p>}

      <div className="skill-list">
        {person.skills.slice(0, compact ? 3 : 5).map((skill) => <span key={skill}>{skill}</span>)}
      </div>

      <footer className="person-card-footer">
        <span className={`availability availability-${person.availability}`}>
          <i aria-hidden="true" />
          {person.availability === 'available' ? 'Available' : person.availability === 'limited' ? 'Limited' : 'Unavailable'}
        </span>
        <span className="person-links">
          {links(person).slice(0, compact ? 1 : 4).map(([label, url]) => (
            <a href={url} target="_blank" rel="noreferrer" key={`${label}-${url}`}>{label} ↗</a>
          ))}
        </span>
      </footer>
    </article>
  )
}
