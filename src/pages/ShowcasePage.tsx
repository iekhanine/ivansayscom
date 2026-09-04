import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PersonCard from '../components/PersonCard'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabase'
import type { Person, ShowcaseItem } from '../types'

function imageUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path
  return supabase.storage.from('showcase').getPublicUrl(path).data.publicUrl
}

function categoryLabel(category: Person['category']) {
  return category[0].toUpperCase() + category.slice(1)
}

function profileLinks(person: Person) {
  return [
    ['Portfolio', person.portfolio_url],
    ['GitHub', person.github_url],
    ['Website', person.website_url],
    ['Contact', person.contact_url],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]))
}

function money(item: ShowcaseItem) {
  if (!item.price_cents) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: item.currency || 'USD',
  }).format(item.price_cents / 100)
}

export default function ShowcasePage() {
  const { slug } = useParams()
  const [person, setPerson] = useState<Person | null>(null)
  const [items, setItems] = useState<ShowcaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true

    async function load() {
      if (!slug) {
        setNotFound(true)
        setLoading(false)
        return
      }

      const { data: personData, error: personError } = await supabase
        .from('people')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!active) return
      if (personError || !personData) {
        if (personError) console.error(personError)
        setNotFound(true)
        setLoading(false)
        return
      }

      const selected = personData as Person
      const { data: itemData, error: itemError } = await supabase
        .from('showcase_items')
        .select('*')
        .eq('person_id', selected.id)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (!active) return
      if (itemError) console.error(itemError)
      setPerson(selected)
      setItems((itemData as ShowcaseItem[] | null) ?? [])
      setLoading(false)
    }

    void load()
    return () => { active = false }
  }, [slug])

  return (
    <main>
      <SiteHeader />
      <div className="shell showcase-page">
        {loading ? (
          <div className="loading-panel">Loading showcase…</div>
        ) : notFound || !person ? (
          <section className="showcase-not-found">
            <span className="kicker">SHOWCASE</span>
            <h1>That page isn't in the index.</h1>
            <p>It may have been archived, unpublished, or the address may have changed.</p>
            <Link className="button button-dark" to="/directory">Back to directory</Link>
          </section>
        ) : (
          <>
            <header className={`showcase-profile-head category-${person.category}`}>
              <div className="showcase-profile-number">IS / {categoryLabel(person.category).toUpperCase()}</div>
              <div className="showcase-profile-copy">
                <span className="kicker">SELECTED PROFILE</span>
                <h1>{person.display_name}</h1>
                <p className="showcase-role">{person.role}</p>
                <p className="showcase-bio">{person.bio}</p>
                <div className="showcase-meta-row">
                  {person.location && <span>{person.location}</span>}
                  {person.timezone && <span>{person.timezone}</span>}
                  <span className={`availability availability-${person.availability}`}><i aria-hidden="true" />{person.availability === 'available' ? 'Available' : person.availability === 'limited' ? 'Limited availability' : 'Not currently available'}</span>
                </div>
                <div className="featured-skills">{person.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
              </div>
              <aside className="showcase-profile-links">
                <span>LINKS</span>
                {profileLinks(person).map(([label, url]) => <a href={url} target="_blank" rel="noreferrer" key={`${label}-${url}`}>{label} ↗</a>)}
              </aside>
            </header>

            <section className="showcase-work-section">
              <div className="section-heading magazine-section-heading">
                <div><span className="kicker">SELECTED WORK</span><h2>Showcase</h2></div>
                <span className="showcase-piece-count">{items.length} {items.length === 1 ? 'piece' : 'pieces'}</span>
              </div>

              {items.length ? (
                <div className="showcase-grid">
                  {items.map((item, index) => (
                    <article className={`showcase-piece showcase-piece-${index % 3}`} key={item.id}>
                      <div className="showcase-image-wrap">
                        <img src={imageUrl(item.image_path)} alt={item.alt_text || item.title} loading="lazy" />
                        <span>{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="showcase-piece-copy">
                        <div>
                          <h3>{item.title}</h3>
                          {item.description && <p>{item.description}</p>}
                        </div>
                        {item.is_for_sale && item.purchase_url && (
                          <a className="showcase-buy" href={item.purchase_url} target="_blank" rel="noreferrer">
                            {money(item) ? `${money(item)} · ` : ''}Purchase ↗
                          </a>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-panel showcase-empty"><strong>The showcase is being assembled.</strong><span>This profile is live; selected work will appear here as it is added.</span></div>
              )}
            </section>

            <section className="showcase-directory-return">
              <span>KEEP LOOKING</span>
              <Link to={`/directory?category=${person.category}`}>More {categoryLabel(person.category).toLowerCase()}s in the index →</Link>
            </section>
          </>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
