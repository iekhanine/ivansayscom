import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { supabase } from '../lib/supabase'
import type { Category } from '../types'

export default function NominatePage() {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)

    const payload = {
      nominee_name: String(form.get('nominee_name') || '').trim(),
      nominee_role: String(form.get('nominee_role') || '').trim(),
      category: String(form.get('category') || '') as Category,
      primary_url: String(form.get('primary_url') || '').trim(),
      secondary_url: String(form.get('secondary_url') || '').trim() || null,
      why_nominate: String(form.get('why_nominate') || '').trim(),
      nominator_name: String(form.get('nominator_name') || '').trim(),
      nominator_email: String(form.get('nominator_email') || '').trim(),
      relationship: String(form.get('relationship') || '').trim() || null,
      status: 'pending' as const,
    }

    const { error: insertError } = await supabase.from('nominations').insert(payload)
    setBusy(false)
    if (insertError) {
      console.error(insertError)
      setError('Could not send the nomination. Please try again.')
      return
    }
    setSubmitted(true)
  }

  return (
    <main>
      <SiteHeader />
      <div className="shell form-page-new">
        <aside className="form-aside">
          <span className="kicker">NOMINATE SOMEONE</span>
          <h1>Who should we know?</h1>
          <p>
            Recommend a developer, creator, or artist whose work deserves a closer look. They do not need a huge audience or a polished personal brand.
          </p>
          <div className="process-note">
            <strong>What makes a useful nomination</strong>
            <span>Point reviewers toward actual work and tell us why it stands out. A specific recommendation is much more useful than a generic endorsement.</span>
          </div>
          <p className="aside-switch">Submitting yourself? <Link to="/apply">Use the work submission form →</Link></p>
        </aside>

        {submitted ? (
          <section className="form-card success-card">
            <span className="success-mark">✓</span>
            <h2>Nomination received.</h2>
            <p>The recommendation is now in the review queue. If the work is a fit, the team may contact the nominee before publishing anything.</p>
            <div className="form-actions left-actions"><Link className="button button-dark" to="/directory">Browse the directory</Link><Link className="button button-quiet" to="/">Return home</Link></div>
          </section>
        ) : (
          <form className="form-card" onSubmit={submit}>
            <div className="form-card-head">
              <div><span className="kicker">THE NOMINEE</span><h2>Point us toward their work.</h2></div>
              <span>Required fields marked *</span>
            </div>

            <div className="field-grid two">
              <label><span>Their name *</span><input name="nominee_name" required /></label>
              <label><span>Role / focus *</span><input name="nominee_role" placeholder="Backend engineer, photographer, musician…" required /></label>
              <label>
                <span>Discipline *</span>
                <select name="category" defaultValue="developer" required>
                  <option value="developer">Developer</option>
                  <option value="creator">Creator</option>
                  <option value="artist">Artist</option>
                </select>
              </label>
              <label><span>Best work link *</span><input name="primary_url" type="url" placeholder="https://" required /></label>
            </div>
            <div className="field-grid nomination-secondary">
              <label><span>Another useful link</span><input name="secondary_url" type="url" placeholder="https://" /></label>
              <label><span>Why are you nominating them? *</span><textarea name="why_nominate" rows={5} placeholder="What did they make? What makes the work unusually good, useful, original, or thoughtful?" required /></label>
            </div>

            <div className="form-divider" />

            <div className="form-group-title"><strong>About you</strong><span>Used only to validate or follow up on the recommendation.</span></div>
            <div className="field-grid two">
              <label><span>Your name *</span><input name="nominator_name" autoComplete="name" required /></label>
              <label><span>Your email *</span><input name="nominator_email" type="email" autoComplete="email" required /></label>
              <label className="full-field"><span>How do you know their work?</span><input name="relationship" placeholder="Colleague, client, follower, collaborator, found them online…" /></label>
            </div>

            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <span>Nomination does not guarantee inclusion.</span>
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Send nomination'}</button>
            </div>
          </form>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
