import { useEffect, useState } from 'react'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabase'
import type { Reviewer } from '../types'

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

export default function ReviewPanelPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase
      .from('reviewers')
      .select('*')
      .eq('is_public', true)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setReviewers((data as Reviewer[] | null) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <main>
      <SiteHeader />
      <div className="shell page-wrap">
        <header className="page-heading compact-heading">
          <span className="kicker">REVIEW PANEL</span>
          <h1>the panelists...</h1>
          <p>submissions are evaluated by working practitioners with experience in the disciplines represented in the directory.</p>
        </header>

        <section className="review-panel-note">
          <strong>How review works</strong>
          <p>Reviewers evaluate the work and make recommendations. Final publication and homepage features remain editorial decisions made by ivansays administration.</p>
        </section>

        {loading ? (
          <div className="loading-panel">Loading review panel…</div>
        ) : reviewers.length ? (
          <section className="reviewer-grid">
            {reviewers.map((reviewer) => (
              <article className="reviewer-card" key={reviewer.id}>
                <div className="reviewer-monogram" aria-hidden="true">{reviewer.monogram || initials(reviewer.display_name)}</div>
                <div className="reviewer-card-copy">
                  <span className="kicker">REVIEWER</span>
                  <h2>{reviewer.display_name}</h2>
                  <p className="reviewer-title">{reviewer.title}</p>
                  <p>{reviewer.bio}</p>
                  {reviewer.specialties.length > 0 && (
                    <div className="reviewer-specialties">
                      {reviewer.specialties.map((specialty) => <span key={specialty}>{specialty}</span>)}
                    </div>
                  )}
                  {reviewer.website_url && <a href={reviewer.website_url} target="_blank" rel="noreferrer">Background / work ↗</a>}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="empty-panel">
            <strong>The public review panel is being assembled.</strong>
            <span>Reviewer profiles will appear here as they are added.</span>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
