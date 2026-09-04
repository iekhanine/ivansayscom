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

function firstLink(person: Person) {
  return person.portfolio_url || person.website_url || person.github_url || person.contact_url
}

const categoryImage: Record<Person['category'], { src: string; alt: string; credit: string }> = {
  developer: {
    src: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=1800&q=80',
    alt: 'A dark computer display filled with colorful code.',
    credit: 'Editorial image · Unsplash',
  },
  creator: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Camera_-_Desk_-_Computer_-_Notepad_-_Life_%28Unsplash%29.jpg/1280px-Camera_-_Desk_-_Computer_-_Notepad_-_Life_%28Unsplash%29.jpg',
    alt: 'A camera and notebook arranged on a creative desk.',
    credit: 'Editorial image · CC0 / Wikimedia Commons',
  },
  artist: {
    src: 'https://images.unsplash.com/photo-1650413890515-68dc18d68c2b?auto=format&fit=crop&w=1800&q=80',
    alt: 'A vivid abstract painting with red, turquoise, blue, and yellow.',
    credit: 'Editorial image · Unsplash',
  },
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
  const leadImage = lead ? categoryImage[lead.category] : categoryImage.creator

  return (
    <main>
      <SiteHeader />

      <div className="shell home-page magazine-home">
        <section className="home-intro magazine-intro">
          <div>
            <span className="kicker">THE CURRENT EDITION</span>
            <p>A selective directory of independent people making thoughtful, useful, original work.</p>
          </div>
          <div className="edition-stamp">
            <span>ISSUE 01</span>
            <b>2026</b>
          </div>
        </section>

        {!loading && lead ? (
          <section className={`cover-feature category-${lead.category}`}>
            <div className="cover-feature-image">
              <img src={leadImage.src} alt={leadImage.alt} />
              <span className="image-credit">{leadImage.credit}</span>
              <span className="cover-tab">FEATURED / {categoryLabel(lead.category).toUpperCase()}</span>
            </div>
            <div className="cover-feature-copy">
              <div className="cover-meta">
                <span>EDITORIAL SELECTION</span>
                <span>#{String(Math.max(1, lead.featured_order)).padStart(2, '0')}</span>
              </div>
              <h1>{lead.display_name}</h1>
              <p className="cover-role">{lead.role}</p>
              <p className="cover-description">{lead.featured_note || lead.bio}</p>
              <div className="featured-skills">
                {lead.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <div className="cover-actions">
                {firstLink(lead) && <a className="button button-dark" href={firstLink(lead) ?? undefined} target="_blank" rel="noreferrer">See the work ↗</a>}
                <span className={`availability availability-${lead.availability}`}>
                  <i aria-hidden="true" />
                  {lead.availability === 'available' ? 'Available' : lead.availability === 'limited' ? 'Limited availability' : 'Not currently available'}
                </span>
              </div>
            </div>
          </section>
        ) : !loading ? (
          <section className="cover-feature cover-feature-empty">
            <div className="cover-feature-image"><img src={categoryImage.artist.src} alt={categoryImage.artist.alt} /></div>
            <div className="cover-feature-copy"><span className="kicker">FIRST EDITION</span><h1>The cover is open.</h1><p className="cover-description">Featured work will live here as the directory grows.</p><Link className="button button-dark" to="/nominate">Nominate someone</Link></div>
          </section>
        ) : null}

        {!loading && featured.length > 1 && (
          <section className="home-section magazine-section">
            <div className="section-heading magazine-section-heading">
              <div><span className="kicker">ALSO FEATURED</span><h2>Three people we think you should click on.</h2></div>
              <span className="section-number">01</span>
            </div>
            <div className="home-card-grid home-card-grid-small">
              {featured.slice(1).map((person) => <PersonCard key={person.id} person={person} compact />)}
            </div>
          </section>
        )}

        <section className="department-grid" aria-label="Browse by discipline">
          <Link className="department-card department-developer" to="/directory?category=developer">
            <div className="department-image"><img src={categoryImage.developer.src} alt="" /></div>
            <span className="department-no">01</span>
            <div><small>DEPARTMENT</small><strong>Developers</strong><p>Code, infrastructure, systems, products.</p></div>
            <b>Explore →</b>
          </Link>
          <Link className="department-card department-creator" to="/directory?category=creator">
            <div className="department-image"><img src={categoryImage.creator.src} alt="" /></div>
            <span className="department-no">02</span>
            <div><small>DEPARTMENT</small><strong>Creators</strong><p>Video, writing, media, storytelling.</p></div>
            <b>Explore →</b>
          </Link>
          <Link className="department-card department-artist" to="/directory?category=artist">
            <div className="department-image"><img src={categoryImage.artist.src} alt="" /></div>
            <span className="department-no">03</span>
            <div><small>DEPARTMENT</small><strong>Artists</strong><p>Visual, sound, physical, experimental work.</p></div>
            <b>Explore →</b>
          </Link>
        </section>

        <section className="home-section magazine-section recent-section">
          <div className="section-heading magazine-section-heading">
            <div><span className="kicker">THE INDEX</span><h2>Recently selected</h2></div>
            <Link to="/directory">See the full directory →</Link>
          </div>
          {loading ? (
            <div className="loading-panel">Loading selections…</div>
          ) : recent.length ? (
            <div className="home-card-grid magazine-card-grid">
              {recent.map((person) => <PersonCard key={person.id} person={person} compact />)}
            </div>
          ) : (
            <div className="empty-panel">
              <strong>The index is just getting started.</strong>
              <span>Selected profiles will appear here as they are published.</span>
            </div>
          )}
        </section>

        <section className="editorial-callout">
          <div className="editorial-callout-mark">IS</div>
          <div>
            <span className="kicker">HELP SHAPE THE NEXT EDITION</span>
            <h2>Know someone whose work deserves a closer look?</h2>
            <p>Nominations and self-submissions go through human review. Inclusion and homepage features are editorial, never purchased.</p>
          </div>
          <div className="editorial-callout-actions">
            <Link className="button button-light" to="/nominate">Nominate someone</Link>
            <Link className="button button-accent" to="/apply">Submit your work</Link>
          </div>
        </section>
      </div>

      <SiteFooter />
    </main>
  )
}
