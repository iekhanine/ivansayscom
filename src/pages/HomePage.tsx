import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import PersonCard from '../components/PersonCard'
import { supabase } from '../lib/supabase'
import type { Person } from '../types'

function categoryLabel(category: Person['category']) {
  return category[0].toUpperCase() + category.slice(1)
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function firstLink(person: Person) {
  return person.portfolio_url || person.website_url || person.github_url || person.contact_url
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Person[]>([])
  const [recent, setRecent] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  const loadHome = useCallback(async () => {
    const [featuredResult, recentResult] = await Promise.all([
      supabase
        .from('people')
        .select('*')
        .eq('status', 'published')
        .eq('is_featured', true)
        .order('featured_order', { ascending: true })
        .limit(3),
      supabase
        .from('people')
        .select('*')
        .eq('status', 'published')
        .order('curated_at', { ascending: false })
        .limit(6),
    ])

    if (featuredResult.error) console.error(featuredResult.error)
    if (recentResult.error) console.error(recentResult.error)
    setFeatured((featuredResult.data as Person[] | null) ?? [])
    setRecent((recentResult.data as Person[] | null) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadHome()

    const refreshOnFocus = () => void loadHome()
    window.addEventListener('focus', refreshOnFocus)

    const channel = supabase
      .channel('ivansays-public-home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, () => void loadHome())
      .subscribe()

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      void supabase.removeChannel(channel)
    }
  }, [loadHome])

  const lead = featured[0]

  return (
    <main>
      <SiteHeader />

      <div className="shell home-page">
        <section className="home-intro">
          <div>
            <span className="kicker">CURATED DIRECTORY</span>
            <p>Independent developers, creators, and artists doing work worth seeing.</p>
          </div>
          <Link to="/directory">Browse everyone <span>→</span></Link>
        </section>

        {!loading && lead && (
          <section className={`featured-profile category-${lead.category}`}>
            <div className="featured-profile-label">
              <span>Featured</span>
              <span>{categoryLabel(lead.category)}</span>
            </div>
            <div className="featured-profile-main">
              <div className="featured-monogram" aria-hidden="true">{lead.monogram || initials(lead.display_name)}</div>
              <div className="featured-person-copy">
                <h1>{lead.display_name}</h1>
                <p className="featured-role">{lead.role}</p>
                <p className="featured-description">{lead.featured_note || lead.bio}</p>
                <div className="featured-skills">
                  {lead.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              </div>
              <div className="featured-profile-action">
                {firstLink(lead) && <a href={firstLink(lead) ?? undefined} target="_blank" rel="noreferrer">View work ↗</a>}
                <span className={`availability availability-${lead.availability}`}>
                  <i aria-hidden="true" />
                  {lead.availability === 'available' ? 'Available' : lead.availability === 'limited' ? 'Limited availability' : 'Not currently available'}
                </span>
              </div>
            </div>
          </section>
        )}

        {!loading && featured.length > 1 && (
          <section className="home-section">
            <div className="section-heading">
              <div><span className="kicker">FEATURED</span><h2>Worth a closer look</h2></div>
            </div>
            <div className="home-card-grid home-card-grid-small">
              {featured.slice(1).map((person) => <PersonCard key={person.id} person={person} compact />)}
            </div>
          </section>
        )}

        <section className="home-section">
          <div className="section-heading">
            <div><span className="kicker">RECENTLY SELECTED</span><h2>New to the directory</h2></div>
            <Link to="/directory">View directory →</Link>
          </div>
          {loading ? (
            <div className="loading-panel">Loading selections…</div>
          ) : recent.length ? (
            <div className="home-card-grid">
              {recent.map((person) => <PersonCard key={person.id} person={person} compact />)}
            </div>
          ) : (
            <div className="empty-panel">
              <strong>The index is just getting started.</strong>
              <span>Selected profiles will appear here as they are published.</span>
            </div>
          )}
        </section>

        <section className="browse-categories" aria-label="Browse by discipline">
          <Link to="/directory?category=developer"><span>Developers</span><small>Code, systems, products</small><b>→</b></Link>
          <Link to="/directory?category=creator"><span>Creators</span><small>Video, writing, media</small><b>→</b></Link>
          <Link to="/directory?category=artist"><span>Artists</span><small>Visual, sound, physical work</small><b>→</b></Link>
        </section>

        <section className="home-participate">
          <div>
            <span className="kicker">KNOW GOOD WORK?</span>
            <h2>Help us find people worth adding.</h2>
          </div>
          <div className="participate-actions">
            <Link className="participate-card" to="/nominate">
              <strong>Nominate someone</strong>
              <span>Recommend a developer, creator, or artist for review.</span>
              <b>Nominate →</b>
            </Link>
            <Link className="participate-card" to="/apply">
              <strong>Submit your own work</strong>
              <span>Put your work in front of the review team.</span>
              <b>Submit →</b>
            </Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
