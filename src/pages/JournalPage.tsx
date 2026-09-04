import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabase'
import type { JournalEntry } from '../types'

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void supabase
      .from('journal_entries')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error)
        setEntries((data as JournalEntry[] | null) ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <main>
      <SiteHeader />
      <div className="shell page-wrap">
        <header className="page-heading compact-heading">
          <span className="kicker">JOURNAL</span>
          <h1>Notes from the directory.</h1>
          <p>Profiles, interviews, project notes, and occasional observations from the people around ivansays.</p>
        </header>

        {loading ? (
          <div className="loading-panel">Loading journal…</div>
        ) : entries.length ? (
          <section className="journal-entries">
            {entries.map((entry) => (
              <article className="journal-entry-row" key={entry.id}>
                <div className="journal-entry-meta">
                  <span>{formatDate(entry.published_at)}</span>
                  <span>{entry.author_name}</span>
                </div>
                <div className="journal-entry-copy">
                  <h2><Link to={`/journal/${entry.slug}`}>{entry.title}</Link></h2>
                  <p>{entry.excerpt}</p>
                </div>
                <Link className="journal-read-link" to={`/journal/${entry.slug}`}>Read →</Link>
              </article>
            ))}
          </section>
        ) : (
          <div className="empty-panel">
            <strong>No journal entries yet.</strong>
            <span>The journal only grows when there is something useful to publish.</span>
          </div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
