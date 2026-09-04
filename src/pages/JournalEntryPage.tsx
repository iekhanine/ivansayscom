import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabase'
import type { JournalEntry } from '../types'

function formatDate(value: string | null) {
  if (!value) return ''
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

export default function JournalEntryPage() {
  const { slug } = useParams()
  const [entry, setEntry] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    void supabase
      .from('journal_entries')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error(error)
        setEntry((data as JournalEntry | null) ?? null)
        setLoading(false)
      })
  }, [slug])

  return (
    <main>
      <SiteHeader />
      <div className="shell journal-detail-wrap">
        <Link className="journal-back" to="/journal">← Journal</Link>
        {loading ? (
          <div className="loading-panel">Loading entry…</div>
        ) : entry ? (
          <article className="journal-detail">
            <header>
              <span className="kicker">JOURNAL</span>
              <h1>{entry.title}</h1>
              <div className="journal-detail-meta"><span>{entry.author_name}</span><span>{formatDate(entry.published_at)}</span></div>
              <p className="journal-detail-excerpt">{entry.excerpt}</p>
            </header>
            <div className="journal-body">{entry.body}</div>
          </article>
        ) : (
          <div className="empty-panel"><strong>Entry not found.</strong><span>It may have been unpublished or the link may be incorrect.</span></div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
