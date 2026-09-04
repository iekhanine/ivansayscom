import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../components/SiteHeader'
import SiteFooter from '../components/SiteFooter'
import { supabase } from '../lib/supabase'
import type { Availability, Category } from '../types'

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)

    if (form.get('company')) {
      setSubmitted(true)
      setBusy(false)
      return
    }

    const payload = {
      name: String(form.get('name') || '').trim(),
      email: String(form.get('email') || '').trim(),
      category: String(form.get('category') || '') as Category,
      role: String(form.get('role') || '').trim(),
      location: String(form.get('location') || '').trim() || null,
      timezone: String(form.get('timezone') || '').trim() || null,
      availability: String(form.get('availability') || 'available') as Availability,
      primary_url: String(form.get('primary_url') || '').trim(),
      secondary_url: String(form.get('secondary_url') || '').trim() || null,
      tertiary_url: String(form.get('tertiary_url') || '').trim() || null,
      current_focus: String(form.get('current_focus') || '').trim() || null,
      note: String(form.get('note') || '').trim() || null,
    }

    const { error: insertError } = await supabase.from('applications').insert(payload)
    setBusy(false)
    if (insertError) {
      console.error(insertError)
      setError('Could not submit your work. Please try again.')
      return
    }
    setSubmitted(true)
  }

  return (
    <main>
      <SiteHeader />
      <div className="shell form-page-new">
        <aside className="form-aside">
          <span className="kicker">SUBMIT YOUR WORK</span>
          <h1>Want to be considered?</h1>
          <p>
            Send enough context for the review team to understand what you do and where your strongest work lives.
            This is not a job application and there is no paid route into the directory.
          </p>
          <div className="process-note">
            <strong>What happens next</strong>
            <span>Submissions are reviewed by experienced practitioners. Strong work may be selected for the directory or considered for a homepage feature.</span>
          </div>
          <p className="aside-switch">Recommending somebody else? <Link to="/nominate">Nominate them instead →</Link></p>
        </aside>

        {submitted ? (
          <section className="form-card success-card">
            <span className="success-mark">✓</span>
            <h2>Submission received.</h2>
            <p>Your work is in the review queue. If selected, the team may follow up for additional details before publication.</p>
            <div className="form-actions left-actions">
              <Link className="button button-dark" to="/directory">Browse the directory</Link>
              <Link className="button button-quiet" to="/">Return home</Link>
            </div>
          </section>
        ) : (
          <form className="form-card" onSubmit={submit}>
            <div className="form-card-head">
              <div><span className="kicker">YOUR DETAILS</span><h2>Tell us what you do.</h2></div>
              <span>Required fields marked *</span>
            </div>

            <div className="field-grid two">
              <label><span>Name *</span><input name="name" autoComplete="name" required /></label>
              <label><span>Email *</span><input name="email" type="email" autoComplete="email" required /></label>
              <label>
                <span>Discipline *</span>
                <select name="category" defaultValue="developer" required>
                  <option value="developer">Developer</option>
                  <option value="creator">Creator</option>
                  <option value="artist">Artist</option>
                </select>
              </label>
              <label><span>Role / focus *</span><input name="role" placeholder="Frontend engineer, filmmaker, illustrator…" required /></label>
              <label><span>Location</span><input name="location" placeholder="Chicago, IL · Remote · Berlin" /></label>
              <label><span>Time zone</span><input name="timezone" placeholder="Central · UTC−5 · CET" /></label>
            </div>

            <div className="form-divider" />

            <div className="form-group">
              <div className="form-group-title"><strong>Work links</strong><span>Lead with the thing you most want reviewed.</span></div>
              <div className="field-grid">
                <label><span>Primary work link *</span><input name="primary_url" type="url" placeholder="https://" required /><small>Portfolio, product, repository, case study, channel, gallery, etc.</small></label>
                <div className="field-grid two nested-grid">
                  <label><span>Second link</span><input name="secondary_url" type="url" placeholder="https://" /></label>
                  <label><span>Third link</span><input name="tertiary_url" type="url" placeholder="https://" /></label>
                </div>
              </div>
            </div>

            <div className="form-divider" />

            <div className="form-group">
              <div className="form-group-title"><strong>Context</strong><span>Plain language is better than a polished pitch.</span></div>
              <div className="field-grid">
                <label><span>What are you focused on right now?</span><textarea name="current_focus" rows={4} placeholder="What are you building, making, exploring, or improving?" /></label>
                <label><span>Anything reviewers should understand?</span><textarea name="note" rows={4} placeholder="Your contribution, constraints, what you are proud of, or useful context that is not obvious from the links." /></label>
              </div>
            </div>

            <div className="form-divider" />

            <fieldset className="availability-radios">
              <legend>Availability</legend>
              <label><input type="radio" name="availability" value="available" defaultChecked /><span><strong>Available</strong><small>Open to work, commissions, or collaboration.</small></span></label>
              <label><input type="radio" name="availability" value="limited" /><span><strong>Limited</strong><small>Selective or partially booked.</small></span></label>
              <label><input type="radio" name="availability" value="unavailable" /><span><strong>Unavailable</strong><small>Not looking right now.</small></span></label>
            </fieldset>

            <label className="honeypot" aria-hidden="true">Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <span>Submitting does not guarantee inclusion.</span>
              <button className="button button-dark" type="submit" disabled={busy}>{busy ? 'Sending…' : 'Submit for review'}</button>
            </div>
          </form>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
