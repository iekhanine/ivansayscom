import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type {
  Application,
  Availability,
  Category,
  JournalEntry,
  JournalStatus,
  Nomination,
  Person,
  PersonAccess,
  PersonStatus,
  Reviewer,
  ReviewerAccess,
  ReviewStatus,
} from '../types'

type AccessRole = 'admin' | 'reviewer' | 'none' | 'checking'
type AdminSection = 'overview' | 'applications' | 'nominations' | 'recommended' | 'people' | 'reviewers' | 'journal'
type ReviewerDraft = Partial<Reviewer> & { email?: string }
type PersonDraft = Partial<Person> & { access_email?: string }

const emptyPerson: PersonDraft = {
  display_name: '', slug: '', category: 'developer', role: '', bio: '', location: '', timezone: '',
  availability: 'available', skills: [], website_url: '', github_url: '', portfolio_url: '', contact_url: '',
  monogram: '', sort_order: 100, status: 'draft', is_featured: false, featured_order: 100, featured_note: '', access_email: '',
}

const emptyReviewer: ReviewerDraft = {
  display_name: '', title: '', bio: '', specialties: [], website_url: '', monogram: '',
  is_public: true, is_active: true, sort_order: 100, email: '',
}

const emptyJournal: Partial<JournalEntry> = {
  title: '', slug: '', excerpt: '', body: '', author_name: 'ivansays Editorial', status: 'draft', published_at: null,
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [accessRole, setAccessRole] = useState<AccessRole>('checking')
  const [reviewerId, setReviewerId] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [activeSection, setActiveSection] = useState<AdminSection>('overview')
  const [peopleFilter, setPeopleFilter] = useState<'active' | 'archived' | 'all'>('active')

  const [applications, setApplications] = useState<Application[]>([])
  const [nominations, setNominations] = useState<Nomination[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [reviewers, setReviewers] = useState<Reviewer[]>([])
  const [reviewerAccess, setReviewerAccess] = useState<ReviewerAccess[]>([])
  const [personAccess, setPersonAccess] = useState<PersonAccess[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])

  const [editingPerson, setEditingPerson] = useState<PersonDraft | null>(null)
  const [editingReviewer, setEditingReviewer] = useState<ReviewerDraft | null>(null)
  const [editingJournal, setEditingJournal] = useState<Partial<JournalEntry> | null>(null)

  const [notice, setNotice] = useState('')
  const [loadingData, setLoadingData] = useState(false)
  const [dataError, setDataError] = useState('')

  const isAdmin = accessRole === 'admin'
  const isReviewer = accessRole === 'reviewer'

  useEffect(() => {
    if (isReviewer && ['people', 'reviewers', 'journal'].includes(activeSection)) {
      setActiveSection('overview')
    }
  }, [activeSection, isReviewer])

  const loadData = useCallback(async () => {
    if (!session || (accessRole !== 'admin' && accessRole !== 'reviewer')) return
    setLoadingData(true)
    setDataError('')

    const baseRequests = [
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('nominations').select('*').order('created_at', { ascending: false }),
    ] as const

    const [appsResult, nominationsResult] = await Promise.all(baseRequests)
    const errors = [appsResult.error, nominationsResult.error].filter(Boolean)

    setApplications((appsResult.data as Application[] | null) ?? [])
    setNominations((nominationsResult.data as Nomination[] | null) ?? [])

    if (accessRole === 'admin') {
      const [peopleResult, reviewersResult, accessResult, journalResult, personAccessResult] = await Promise.all([
        supabase.from('people').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('reviewers').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: true }),
        supabase.from('reviewer_access').select('*'),
        supabase.from('journal_entries').select('*').order('created_at', { ascending: false }),
        supabase.from('person_access').select('*'),
      ])

      errors.push(...[peopleResult.error, reviewersResult.error, accessResult.error, journalResult.error, personAccessResult.error].filter(Boolean))
      setPeople((peopleResult.data as Person[] | null) ?? [])
      setReviewers((reviewersResult.data as Reviewer[] | null) ?? [])
      setReviewerAccess((accessResult.data as ReviewerAccess[] | null) ?? [])
      setPersonAccess((personAccessResult.data as PersonAccess[] | null) ?? [])
      setJournalEntries((journalResult.data as JournalEntry[] | null) ?? [])
    }

    if (errors.length) {
      errors.forEach((error) => console.error(error))
      setDataError(errors.map((error) => error?.message).filter(Boolean).join(' · '))
    }
    setLoadingData(false)
  }, [accessRole, session])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingAuth(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) {
      setAccessRole('checking')
      setReviewerId(null)
      return
    }

    let cancelled = false
    void (async () => {
      setAccessRole('checking')
      setDataError('')
      const adminResult = await supabase.rpc('is_admin')
      if (cancelled) return
      if (adminResult.error) {
        setDataError(adminResult.error.message)
        setAccessRole('none')
        return
      }
      if (adminResult.data) {
        setAccessRole('admin')
        return
      }

      await supabase.rpc('claim_reviewer_access')
      const reviewerResult = await supabase.rpc('current_reviewer_id')
      if (cancelled) return
      if (reviewerResult.error) {
        setDataError(reviewerResult.error.message)
        setAccessRole('none')
        return
      }
      if (reviewerResult.data) {
        setReviewerId(String(reviewerResult.data))
        setAccessRole('reviewer')
      } else {
        setAccessRole('none')
      }
    })()

    return () => { cancelled = true }
  }, [session])

  useEffect(() => {
    if (session && (isAdmin || isReviewer)) void loadData()
  }, [isAdmin, isReviewer, loadData, session])

  useEffect(() => {
    if (!session || (!isAdmin && !isReviewer)) return
    const refreshOnFocus = () => void loadData()
    window.addEventListener('focus', refreshOnFocus)

    let channel = supabase
      .channel('ivansays-review-desk')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nominations' }, () => void loadData())

    if (isAdmin) {
      channel = channel
        .on('postgres_changes', { event: '*', schema: 'public', table: 'people' }, () => void loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'person_access' }, () => void loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviewers' }, () => void loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'journal_entries' }, () => void loadData())
    }

    channel.subscribe()
    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      void supabase.removeChannel(channel)
    }
  }, [isAdmin, isReviewer, loadData, session])

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    setNotice('')

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return setNotice(error.message)
      if (!data.session) setNotice('Account created. Check your email if confirmation is enabled, then come back and log in.')
      else setNotice('Account created. Checking reviewer access…')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setNotice(error.message)
  }

  async function updateReviewStatus(table: 'applications' | 'nominations', id: string, status: ReviewStatus) {
    if (isReviewer) {
      const { error } = await supabase.rpc('review_submission', {
        item_kind: table === 'applications' ? 'application' : 'nomination',
        item_id: id,
        new_status: status,
      })
      if (error) return setNotice(error.message)
    } else {
      const { error } = await supabase.from(table).update({ status, reviewed_at: new Date().toISOString() }).eq('id', id)
      if (error) return setNotice(error.message)
    }
    setNotice(status === 'approved' ? 'Recommended for publication.' : 'Submission declined.')
    await loadData()
  }

  async function publishApplication(app: Application, featured = false) {
    if (!isAdmin) return
    setNotice('')
    const now = new Date().toISOString()
    const payload = {
      display_name: app.name.trim(), slug: slugify(app.name), category: app.category, role: app.role.trim(),
      bio: (app.current_focus || app.note || `${app.name} was selected for the ivansays directory.`).trim(),
      location: app.location?.trim() || null, timezone: app.timezone?.trim() || null,
      availability: app.availability || 'available', skills: [] as string[], website_url: app.secondary_url?.trim() || null,
      github_url: null, portfolio_url: app.primary_url.trim(), contact_url: null, monogram: null, sort_order: 100,
      status: 'published' as const, is_featured: featured, featured_order: 100,
      featured_note: featured ? (app.current_focus?.trim() || app.note?.trim() || null) : null,
      curated_at: now, updated_at: now,
    }
    const { data: personData, error: personError } = await supabase.from('people').upsert(payload, { onConflict: 'slug' }).select('id').single()
    if (personError) return setNotice(`Could not publish profile: ${personError.message}`)
    if (personData?.id && app.email.trim()) {
      const email = app.email.trim().toLowerCase()
      const existingAccess = personAccess.find((item) => item.person_id === personData.id)
      const accessPayload = {
        person_id: personData.id,
        email,
        user_id: existingAccess && existingAccess.email.toLowerCase() === email
          ? existingAccess.user_id
          : null,
      }
      const { error: accessError } = await supabase.from('person_access').upsert(accessPayload, { onConflict: 'person_id' })
      if (accessError) return setNotice(`Profile published, but Studio access could not be prepared: ${accessError.message}`)
    }
    const { error: reviewError } = await supabase.from('applications').update({ status: 'approved' }).eq('id', app.id)
    if (reviewError) return setNotice(`Profile published, but the application queue could not update: ${reviewError.message}`)
    setNotice(featured ? 'Published and featured on the homepage.' : 'Published to the directory.')
    await loadData()
  }

  async function publishNomination(item: Nomination, featured = false) {
    if (!isAdmin) return
    setNotice('')
    const now = new Date().toISOString()
    const payload = {
      display_name: item.nominee_name.trim(), slug: slugify(item.nominee_name), category: item.category,
      role: item.nominee_role.trim(), bio: item.why_nominate.trim(), location: null, timezone: null,
      availability: 'unavailable' as const, skills: [] as string[], website_url: item.secondary_url?.trim() || null,
      github_url: null, portfolio_url: item.primary_url.trim(), contact_url: null, monogram: null, sort_order: 100,
      status: 'published' as const, is_featured: featured, featured_order: 100,
      featured_note: featured ? item.why_nominate.trim() : null, curated_at: now, updated_at: now,
    }
    const { error: personError } = await supabase.from('people').upsert(payload, { onConflict: 'slug' })
    if (personError) return setNotice(`Could not publish profile: ${personError.message}`)
    const { error: reviewError } = await supabase.from('nominations').update({ status: 'approved' }).eq('id', item.id)
    if (reviewError) return setNotice(`Profile published, but the nomination queue could not update: ${reviewError.message}`)
    setNotice(featured ? 'Published and featured on the homepage.' : 'Published to the directory.')
    await loadData()
  }

  function draftFromApplication(app: Application) {
    setEditingPerson({ ...emptyPerson, display_name: app.name, slug: slugify(app.name), category: app.category, role: app.role,
      location: app.location ?? '', timezone: app.timezone ?? '', availability: app.availability ?? 'available',
      bio: app.current_focus ?? app.note ?? '', portfolio_url: app.primary_url, website_url: app.secondary_url ?? '', access_email: app.email })
  }

  function draftFromNomination(item: Nomination) {
    setEditingPerson({ ...emptyPerson, display_name: item.nominee_name, slug: slugify(item.nominee_name), category: item.category,
      role: item.nominee_role, bio: item.why_nominate, portfolio_url: item.primary_url, website_url: item.secondary_url ?? '' })
  }

  async function savePerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingPerson || !isAdmin) return
    const payload = {
      display_name: editingPerson.display_name?.trim(), slug: editingPerson.slug?.trim() || slugify(editingPerson.display_name || ''),
      category: editingPerson.category as Category, role: editingPerson.role?.trim(), bio: editingPerson.bio?.trim(),
      location: editingPerson.location?.trim() || null, timezone: editingPerson.timezone?.trim() || null,
      availability: editingPerson.availability as Availability, skills: editingPerson.skills ?? [],
      website_url: editingPerson.website_url?.trim() || null, github_url: editingPerson.github_url?.trim() || null,
      portfolio_url: editingPerson.portfolio_url?.trim() || null, contact_url: editingPerson.contact_url?.trim() || null,
      monogram: editingPerson.monogram?.trim() || null, sort_order: Number(editingPerson.sort_order ?? 100),
      status: editingPerson.status as PersonStatus, is_featured: Boolean(editingPerson.is_featured),
      featured_order: Number(editingPerson.featured_order ?? 100), featured_note: editingPerson.featured_note?.trim() || null,
      curated_at: editingPerson.status === 'published' ? (editingPerson.curated_at || new Date().toISOString()) : editingPerson.curated_at || null,
      updated_at: new Date().toISOString(),
    }

    const result = editingPerson.id
      ? await supabase.from('people').update(payload).eq('id', editingPerson.id).select('id').single()
      : await supabase.from('people').insert(payload).select('id').single()

    if (result.error) return setNotice(result.error.message)
    const personId = String(result.data.id)
    const accessEmail = editingPerson.access_email?.trim().toLowerCase() || ''
    const existingAccess = personAccess.find((item) => item.person_id === personId)

    if (accessEmail) {
      const accessPayload = {
        person_id: personId,
        email: accessEmail,
        user_id: existingAccess && existingAccess.email.toLowerCase() === accessEmail
          ? existingAccess.user_id
          : null,
      }
      const { error: accessError } = await supabase.from('person_access').upsert(accessPayload, { onConflict: 'person_id' })
      if (accessError) return setNotice(`Directory entry saved, but Studio access failed: ${accessError.message}`)
    } else if (existingAccess) {
      const { error: accessError } = await supabase.from('person_access').delete().eq('person_id', personId)
      if (accessError) return setNotice(`Directory entry saved, but Studio access could not be removed: ${accessError.message}`)
    }

    setEditingPerson(null)
    setNotice('Directory entry saved.')
    await loadData()
  }

  function openPerson(person?: Person) {
    if (!person) return setEditingPerson({ ...emptyPerson })
    const access = personAccess.find((item) => item.person_id === person.id)
    setEditingPerson({ ...person, access_email: access?.email ?? '' })
  }

  async function toggleFeatured(person: Person) {
    if (!isAdmin) return
    const { error } = await supabase.from('people').update({ is_featured: !person.is_featured, updated_at: new Date().toISOString() }).eq('id', person.id)
    if (error) return setNotice(error.message)
    await loadData()
  }

  async function archivePerson(person: Person) {
    if (!isAdmin || person.status === 'archived') return
    if (!window.confirm(`Archive ${person.display_name}? They will be removed from the public index and homepage.`)) return
    setNotice('')
    const { error } = await supabase
      .from('people')
      .update({ status: 'archived', is_featured: false, updated_at: new Date().toISOString() })
      .eq('id', person.id)
    if (error) return setNotice(error.message)
    setNotice(`${person.display_name} archived.`)
    await loadData()
  }

  async function restorePerson(person: Person) {
    if (!isAdmin || person.status !== 'archived') return
    setNotice('')
    const { error } = await supabase
      .from('people')
      .update({ status: 'draft', is_featured: false, updated_at: new Date().toISOString() })
      .eq('id', person.id)
    if (error) return setNotice(error.message)
    setNotice(`${person.display_name} restored as a draft.`)
    await loadData()
  }

  function openReviewer(reviewer?: Reviewer) {
    if (!reviewer) return setEditingReviewer({ ...emptyReviewer })
    const access = reviewerAccess.find((item) => item.reviewer_id === reviewer.id)
    setEditingReviewer({ ...reviewer, email: access?.email ?? '' })
  }

  async function saveReviewer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingReviewer || !isAdmin) return
    setNotice('')
    const profilePayload = {
      display_name: editingReviewer.display_name?.trim(), title: editingReviewer.title?.trim(), bio: editingReviewer.bio?.trim() || '',
      specialties: editingReviewer.specialties ?? [], website_url: editingReviewer.website_url?.trim() || null,
      monogram: editingReviewer.monogram?.trim() || null, is_public: Boolean(editingReviewer.is_public),
      is_active: Boolean(editingReviewer.is_active), sort_order: Number(editingReviewer.sort_order ?? 100), updated_at: new Date().toISOString(),
    }
    const email = editingReviewer.email?.trim().toLowerCase()
    if (!email) return setNotice('Reviewer email is required for access.')

    if (editingReviewer.id) {
      const { error: reviewerError } = await supabase.from('reviewers').update(profilePayload).eq('id', editingReviewer.id)
      if (reviewerError) return setNotice(reviewerError.message)
      const { error: accessError } = await supabase.from('reviewer_access').update({ email }).eq('reviewer_id', editingReviewer.id)
      if (accessError) return setNotice(accessError.message)
    } else {
      const { data, error: reviewerError } = await supabase.from('reviewers').insert(profilePayload).select('*').single()
      if (reviewerError || !data) return setNotice(reviewerError?.message || 'Could not create reviewer.')
      const { error: accessError } = await supabase.from('reviewer_access').insert({ reviewer_id: data.id, email })
      if (accessError) {
        await supabase.from('reviewers').delete().eq('id', data.id)
        return setNotice(accessError.message)
      }
    }
    setEditingReviewer(null)
    setNotice('Reviewer saved. They can create or log into an account at /admin using this email.')
    await loadData()
  }

  async function saveJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingJournal || !isAdmin) return
    const status = editingJournal.status as JournalStatus
    const payload = {
      title: editingJournal.title?.trim(), slug: editingJournal.slug?.trim() || slugify(editingJournal.title || ''),
      excerpt: editingJournal.excerpt?.trim(), body: editingJournal.body?.trim(),
      author_name: editingJournal.author_name?.trim() || 'ivansays Editorial', status,
      published_at: status === 'published' ? (editingJournal.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    }
    const query = editingJournal.id ? supabase.from('journal_entries').update(payload).eq('id', editingJournal.id) : supabase.from('journal_entries').insert(payload)
    const { error } = await query
    if (error) return setNotice(error.message)
    setEditingJournal(null)
    setNotice(status === 'published' ? 'Journal entry published.' : 'Journal draft saved.')
    await loadData()
  }

  async function deleteJournalEntry(entry: JournalEntry) {
    if (!isAdmin) return
    const confirmed = window.confirm(`Permanently delete “${entry.title}”? This cannot be undone.`)
    if (!confirmed) return
    setNotice('')
    const { error } = await supabase.from('journal_entries').delete().eq('id', entry.id)
    if (error) return setNotice(error.message)
    if (editingJournal?.id === entry.id) setEditingJournal(null)
    setNotice(`“${entry.title}” deleted.`)
    await loadData()
  }

  const pendingApplications = useMemo(() => applications.filter((item) => item.status === 'pending'), [applications])
  const pendingNominations = useMemo(() => nominations.filter((item) => item.status === 'pending'), [nominations])
  const approvedApplications = useMemo(() => applications.filter((item) => item.status === 'approved'), [applications])
  const approvedNominations = useMemo(() => nominations.filter((item) => item.status === 'approved'), [nominations])
  const reviewerName = useMemo(() => new Map(reviewers.map((reviewer) => [reviewer.id, reviewer.display_name])), [reviewers])

  const archivedPeopleCount = people.filter((person) => person.status === 'archived').length
  const activePeopleCount = people.length - archivedPeopleCount
  const visiblePeople = people.filter((person) => {
    if (peopleFilter === 'archived') return person.status === 'archived'
    if (peopleFilter === 'active') return person.status !== 'archived'
    return true
  })

  if (loadingAuth) return <main className="admin-login-page">Loading…</main>

  if (!session) {
    return (
      <main className="admin-login-page">
        <form className="admin-login" onSubmit={login}>
          <span className="kicker">ivansays.COM</span>
          <h1>{authMode === 'login' ? 'Review desk' : 'Reviewer access'}</h1>
          <p className="admin-login-copy">{authMode === 'login' ? 'For ivansays administrators and approved reviewers.' : 'Create an account only with the email address that was pre-authorized by an ivansays administrator.'}</p>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minLength={8} required /></label>
          {notice && <p className="form-error">{notice}</p>}
          <button className="button button-dark" type="submit">{authMode === 'login' ? 'Login' : 'Create reviewer account'}</button>
          <button className="admin-auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setNotice('') }}>
            {authMode === 'login' ? 'First-time reviewer? Create an account' : 'Already have access? Log in'}
          </button>
          <Link to="/">← Public site</Link>
        </form>
      </main>
    )
  }

  if (accessRole === 'checking') return <main className="admin-login-page">Checking review access…</main>

  if (accessRole === 'none') {
    return (
      <main className="admin-login-page">
        <section className="admin-login admin-access-warning">
          <span className="kicker">ACCESS CHECK</span>
          <h1>Signed in, but not authorized.</h1>
          <p>This account is authenticated, but it is not an administrator and its email is not attached to an active reviewer profile.</p>
          <label>Your Supabase Auth user ID<input value={session.user.id} readOnly /></label>
          <p className="admin-sql-hint">Admins belong in <code>public.admins</code>. Reviewers should first be added from the Review Panel section of the admin desk using the same email address they use to sign in.</p>
          {dataError && <p className="form-error">{dataError}</p>}
          <button className="button button-dark" type="button" onClick={() => void supabase.auth.signOut()}>Log out</button>
          <Link to="/">← Public site</Link>
        </section>
      </main>
    )
  }

  const publishedCount = people.filter((person) => person.status === 'published').length
  const featuredCount = people.filter((person) => person.status === 'published' && person.is_featured).length
  const activeReviewerCount = reviewers.filter((reviewer) => reviewer.is_active).length
  const recommendedCount = approvedApplications.length + approvedNominations.length

  const sectionMeta: Record<AdminSection, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: isAdmin ? 'CURATION DESK' : 'REVIEW DESK',
      title: 'Overview',
      description: isAdmin ? 'Review incoming work, make editorial decisions, and manage the published index.' : 'Review incoming work and send strong submissions forward for editorial consideration.',
    },
    applications: { eyebrow: 'INBOX', title: 'Self submissions', description: 'People submitting their own work for consideration.' },
    nominations: { eyebrow: 'INBOX', title: 'Nominations', description: 'People recommended by somebody else for consideration.' },
    recommended: { eyebrow: 'EDITORIAL QUEUE', title: 'Recommended', description: isAdmin ? 'Reviewed submissions ready for a final editorial decision.' : 'Submissions reviewers have recommended for editorial consideration.' },
    people: { eyebrow: 'INDEX', title: 'People', description: 'Manage draft, published, archived, and homepage-featured directory profiles.' },
    reviewers: { eyebrow: 'TRANSPARENCY', title: 'Review Panel', description: 'Manage reviewer access and the public-facing Review Panel.' },
    journal: { eyebrow: 'EDITORIAL', title: 'Journal', description: 'Write, edit, publish, and manage ivansays journal entries.' },
  }

  const navItems: Array<{ id: AdminSection; label: string; count?: number; adminOnly?: boolean; tone: string }> = [
    { id: 'overview', label: 'Overview', tone: 'yellow' },
    { id: 'applications', label: 'Self submissions', count: pendingApplications.length, tone: 'blue' },
    { id: 'nominations', label: 'Nominations', count: pendingNominations.length, tone: 'red' },
    { id: 'recommended', label: 'Recommended', count: recommendedCount, tone: 'mint' },
    { id: 'people', label: 'People / Index', count: people.length, adminOnly: true, tone: 'lilac' },
    { id: 'reviewers', label: 'Review Panel', count: activeReviewerCount, adminOnly: true, tone: 'pink' },
    { id: 'journal', label: 'Journal', count: journalEntries.length, adminOnly: true, tone: 'yellow' },
  ]

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin)
  const currentMeta = sectionMeta[activeSection]

  return (
    <main className="admin-shell admin-shell-magazine">
      <div className="admin-frame">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <Link to="/" className="admin-wordmark"><span>ivansays</span><small>focus on indie</small></Link>
            <span className="admin-role-chip">{isAdmin ? 'ADMIN' : 'REVIEWER'}</span>
          </div>

          <nav className="admin-side-nav" aria-label="Admin sections">
            <span className="admin-nav-label">WORKSPACE</span>
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`admin-nav-item tone-${item.tone}${activeSection === item.id ? ' is-active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <i aria-hidden="true" />
                <span>{item.label}</span>
                {typeof item.count === 'number' && <b>{item.count}</b>}
              </button>
            ))}
          </nav>

          <div className="admin-sidebar-bottom">
            <div className="admin-sidebar-account">
              <span>SIGNED IN</span>
              <strong>{session.user.email || 'Supabase account'}</strong>
            </div>
            <div className="admin-sidebar-links">
              <Link to="/">Public site ↗</Link>
              <button type="button" onClick={() => void loadData()} disabled={loadingData}>{loadingData ? 'Refreshing…' : 'Refresh data'}</button>
              <button type="button" onClick={() => void supabase.auth.signOut()}>Log out</button>
            </div>
          </div>
        </aside>

        <section className="admin-workspace">
          <header className="admin-workspace-head">
            <div>
              <span className="kicker">{currentMeta.eyebrow}</span>
              <h1>{currentMeta.title}</h1>
              <p>{currentMeta.description}</p>
            </div>
            <div className="admin-workspace-head-actions">
              {activeSection === 'people' && isAdmin && <button className="button button-dark" type="button" onClick={() => openPerson()}>+ Add person</button>}
              {activeSection === 'reviewers' && isAdmin && <><Link className="admin-text-link" to="/review-panel">Public panel ↗</Link><button className="button button-dark" type="button" onClick={() => openReviewer()}>+ Add reviewer</button></>}
              {activeSection === 'journal' && isAdmin && <><Link className="admin-text-link" to="/journal">Public journal ↗</Link><button className="button button-dark" type="button" onClick={() => setEditingJournal({ ...emptyJournal })}>+ Write entry</button></>}
            </div>
          </header>

          {notice && <div className="admin-notice">{notice}</div>}
          {dataError && <div className="admin-notice admin-notice-error">Database: {dataError}</div>}

          <div className="admin-content-panel">
            {activeSection === 'overview' && (
              <div className="admin-overview-view">
                <div className="admin-stat-grid">
                  <button type="button" className="stat-blue" onClick={() => setActiveSection('applications')}><span>Self submissions</span><strong>{pendingApplications.length}</strong><small>waiting for review</small></button>
                  <button type="button" className="stat-red" onClick={() => setActiveSection('nominations')}><span>Nominations</span><strong>{pendingNominations.length}</strong><small>waiting for review</small></button>
                  <button type="button" className="stat-mint" onClick={() => setActiveSection('recommended')}><span>Recommended</span><strong>{recommendedCount}</strong><small>awaiting editorial decision</small></button>
                  {isAdmin ? <button type="button" className="stat-lilac" onClick={() => setActiveSection('people')}><span>Published</span><strong>{publishedCount}</strong><small>{featuredCount} featured on homepage</small></button> : <div className="admin-stat-static stat-lilac"><span>Your role</span><strong>Reviewer</strong><small>recommend or decline</small></div>}
                </div>

                <div className="admin-overview-grid">
                  <section className="admin-overview-block">
                    <div className="admin-mini-heading"><span>QUEUE</span><strong>Needs attention</strong></div>
                    <button type="button" onClick={() => setActiveSection('applications')}><span>Self submissions</span><b>{pendingApplications.length}</b></button>
                    <button type="button" onClick={() => setActiveSection('nominations')}><span>Nominations</span><b>{pendingNominations.length}</b></button>
                    <button type="button" onClick={() => setActiveSection('recommended')}><span>Recommended</span><b>{recommendedCount}</b></button>
                  </section>
                  {isAdmin && <section className="admin-overview-block admin-overview-editorial">
                    <div className="admin-mini-heading"><span>PUBLISHING</span><strong>Editorial inventory</strong></div>
                    <button type="button" onClick={() => setActiveSection('people')}><span>People / Index</span><b>{people.length}</b></button>
                    <button type="button" onClick={() => setActiveSection('reviewers')}><span>Active reviewers</span><b>{activeReviewerCount}</b></button>
                    <button type="button" onClick={() => setActiveSection('journal')}><span>Journal entries</span><b>{journalEntries.length}</b></button>
                  </section>}
                </div>
              </div>
            )}

            {activeSection === 'applications' && (
              <div className="admin-list admin-list-standalone">
                {pendingApplications.length === 0 && <div className="admin-empty">Nothing waiting here.</div>}
                {pendingApplications.map((app) => (
                  <article className="review-row" key={app.id}>
                    <div className="review-person"><strong>{app.name}</strong><span>{app.role} · {app.category}</span>{(app.location || app.timezone) && <small>{[app.location, app.timezone].filter(Boolean).join(' · ')}</small>}</div>
                    <div className="review-links"><a href={app.primary_url} target="_blank" rel="noreferrer">Primary work ↗</a>{app.secondary_url && <a href={app.secondary_url} target="_blank" rel="noreferrer">Second ↗</a>}{app.tertiary_url && <a href={app.tertiary_url} target="_blank" rel="noreferrer">Third ↗</a>}</div>
                    <div className="review-copy"><p>{app.current_focus || app.note || 'No additional context provided.'}</p></div>
                    <div className="admin-actions">
                      {isAdmin ? <><button onClick={() => void publishApplication(app)} type="button">Approve &amp; publish</button><button onClick={() => void publishApplication(app, true)} type="button">Approve + feature</button><button onClick={() => draftFromApplication(app)} type="button">Create draft</button><button className="danger" onClick={() => void updateReviewStatus('applications', app.id, 'rejected')} type="button">Reject</button></> : <><button onClick={() => void updateReviewStatus('applications', app.id, 'approved')} type="button">Recommend</button><button className="danger" onClick={() => void updateReviewStatus('applications', app.id, 'rejected')} type="button">Decline</button></>}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeSection === 'nominations' && (
              <div className="admin-list admin-list-standalone">
                {pendingNominations.length === 0 && <div className="admin-empty">No nominations are waiting for review.</div>}
                {pendingNominations.map((item) => (
                  <article className="review-row" key={item.id}>
                    <div className="review-person"><strong>{item.nominee_name}</strong><span>{item.nominee_role} · {item.category}</span><small>Nominated by {item.nominator_name}{item.relationship ? ` · ${item.relationship}` : ''}</small></div>
                    <div className="review-links"><a href={item.primary_url} target="_blank" rel="noreferrer">Primary work ↗</a>{item.secondary_url && <a href={item.secondary_url} target="_blank" rel="noreferrer">Second ↗</a>}</div>
                    <div className="review-copy"><p>{item.why_nominate}</p></div>
                    <div className="admin-actions">
                      {isAdmin ? <><button onClick={() => void publishNomination(item)} type="button">Approve &amp; publish</button><button onClick={() => void publishNomination(item, true)} type="button">Approve + feature</button><button onClick={() => draftFromNomination(item)} type="button">Create draft</button><button className="danger" onClick={() => void updateReviewStatus('nominations', item.id, 'rejected')} type="button">Reject</button></> : <><button onClick={() => void updateReviewStatus('nominations', item.id, 'approved')} type="button">Recommend</button><button className="danger" onClick={() => void updateReviewStatus('nominations', item.id, 'rejected')} type="button">Decline</button></>}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {activeSection === 'recommended' && (
              <div className="admin-list admin-list-standalone">
                {recommendedCount === 0 && <div className="admin-empty">Nothing has been recommended yet.</div>}
                {approvedNominations.map((item) => (
                  <article className="review-row" key={`approved-nomination-${item.id}`}>
                    <div className="review-person"><strong>{item.nominee_name}</strong><span>{item.nominee_role} · {item.category}</span><small>{item.reviewed_by ? `Recommended by ${reviewerName.get(item.reviewed_by) || 'reviewer'}` : 'Approved nomination'} · {item.nominator_name}</small></div>
                    <div className="review-links"><a href={item.primary_url} target="_blank" rel="noreferrer">Primary work ↗</a>{item.secondary_url && <a href={item.secondary_url} target="_blank" rel="noreferrer">Second ↗</a>}</div>
                    <div className="review-copy"><p>{item.why_nominate}</p></div>
                    <div className="admin-actions">{isAdmin ? <><button onClick={() => void publishNomination(item)} type="button">Publish</button><button onClick={() => void publishNomination(item, true)} type="button">Publish + feature</button><button onClick={() => draftFromNomination(item)} type="button">Open as draft</button></> : <span className="review-handoff">Waiting for editorial decision</span>}</div>
                  </article>
                ))}
                {approvedApplications.map((app) => (
                  <article className="review-row" key={`approved-application-${app.id}`}>
                    <div className="review-person"><strong>{app.name}</strong><span>{app.role} · {app.category}</span><small>{app.reviewed_by ? `Recommended by ${reviewerName.get(app.reviewed_by) || 'reviewer'}` : 'Approved self-submission'}</small></div>
                    <div className="review-links"><a href={app.primary_url} target="_blank" rel="noreferrer">Primary work ↗</a>{app.secondary_url && <a href={app.secondary_url} target="_blank" rel="noreferrer">Second ↗</a>}</div>
                    <div className="review-copy"><p>{app.current_focus || app.note || 'No additional context provided.'}</p></div>
                    <div className="admin-actions">{isAdmin ? <><button onClick={() => void publishApplication(app)} type="button">Publish</button><button onClick={() => void publishApplication(app, true)} type="button">Publish + feature</button><button onClick={() => draftFromApplication(app)} type="button">Open as draft</button></> : <span className="review-handoff">Waiting for editorial decision</span>}</div>
                  </article>
                ))}
              </div>
            )}

            {activeSection === 'people' && isAdmin && (
              <div className="people-admin-view">
                <div className="admin-filter-bar" role="group" aria-label="Filter people">
                  <button className={peopleFilter === 'active' ? 'is-active' : ''} type="button" onClick={() => setPeopleFilter('active')}>Active <span>{activePeopleCount}</span></button>
                  <button className={peopleFilter === 'archived' ? 'is-active' : ''} type="button" onClick={() => setPeopleFilter('archived')}>Archived <span>{archivedPeopleCount}</span></button>
                  <button className={peopleFilter === 'all' ? 'is-active' : ''} type="button" onClick={() => setPeopleFilter('all')}>All <span>{people.length}</span></button>
                </div>
                <div className="admin-list admin-list-standalone people-admin-list">
                  {visiblePeople.length === 0 && <div className="admin-empty">{peopleFilter === 'archived' ? 'No archived people.' : 'No people in this view yet.'}</div>}
                  {visiblePeople.map((person) => (
                    <article className={`person-admin-row${person.status === 'archived' ? ' is-archived' : ''}`} key={person.id}>
                      <div><strong>{person.display_name}</strong><span>{person.role} · {person.category}</span><small>{personAccess.find((access) => access.person_id === person.id)?.user_id ? 'Studio connected' : personAccess.find((access) => access.person_id === person.id)?.email ? 'Studio access prepared' : 'No Studio login'}</small></div>
                      <span className={`status-pill status-${person.status}`}>{person.status}</span>
                      <span className={person.is_featured ? 'feature-state is-featured' : 'feature-state'}>{person.is_featured ? '★ Featured' : 'Not featured'}</span>
                      <div className="row-buttons">
                        {person.status === 'published' && <Link to={`/people/${person.slug}`}>Showcase ↗</Link>}
                        {person.status !== 'archived' && <button type="button" onClick={() => void toggleFeatured(person)}>{person.is_featured ? 'Unfeature' : 'Feature'}</button>}
                        <button type="button" onClick={() => openPerson(person)}>Edit</button>
                        {person.status === 'archived'
                          ? <button className="restore" type="button" onClick={() => void restorePerson(person)}>Restore</button>
                          : <button className="archive" type="button" onClick={() => void archivePerson(person)}>Archive</button>}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'reviewers' && isAdmin && (
              <div>
                <div className="admin-panel-explainer">Add the reviewer here first using the email they will use for access. They can then create or log into an account at <code>/admin</code>; their account is automatically linked to this reviewer record.</div>
                <div className="admin-list admin-list-standalone reviewer-admin-list">
                  {reviewers.length === 0 && <div className="admin-empty">No reviewers added yet.</div>}
                  {reviewers.map((reviewer) => {
                    const access = reviewerAccess.find((item) => item.reviewer_id === reviewer.id)
                    return (
                      <article className="reviewer-admin-row" key={reviewer.id}>
                        <div><strong>{reviewer.display_name}</strong><span>{reviewer.title}</span><small>{access?.email || 'No access email'}</small></div>
                        <span className={reviewer.is_active ? 'access-state is-connected' : 'access-state'}>{reviewer.is_active ? 'Active' : 'Inactive'}</span>
                        <span className={access?.user_id ? 'access-state is-connected' : 'access-state'}>{access?.user_id ? 'Account connected' : 'Awaiting account'}</span>
                        <span className={reviewer.is_public ? 'access-state is-public' : 'access-state'}>{reviewer.is_public ? 'Public profile' : 'Hidden profile'}</span>
                        <div className="row-buttons"><button type="button" onClick={() => openReviewer(reviewer)}>Edit</button></div>
                      </article>
                    )
                  })}
                </div>
              </div>
            )}

            {activeSection === 'journal' && isAdmin && (
              <div className="admin-list admin-list-standalone journal-admin-list">
                {journalEntries.length === 0 && <div className="admin-empty">No journal entries yet.</div>}
                {journalEntries.map((entry) => (
                  <article className="journal-admin-row" key={entry.id}>
                    <div><strong>{entry.title}</strong><span>{entry.author_name}</span><small>{entry.excerpt}</small></div>
                    <span className={`status-pill status-${entry.status}`}>{entry.status}</span>
                    <span className="journal-admin-date">{entry.published_at ? new Date(entry.published_at).toLocaleDateString() : 'Not published'}</span>
                    <div className="row-buttons">{entry.status === 'published' && <Link to={`/journal/${entry.slug}`}>View ↗</Link>}<button type="button" onClick={() => setEditingJournal(entry)}>Edit</button><button className="danger" type="button" onClick={() => void deleteJournalEntry(entry)}>Delete</button></div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {editingPerson && isAdmin && (
        <div className="editor-backdrop" role="presentation">
          <form className="person-editor" onSubmit={savePerson}>
            <div className="editor-head"><div><span className="kicker">{editingPerson.id ? 'EDIT ENTRY' : 'NEW ENTRY'}</span><h2>{editingPerson.display_name || 'Untitled person'}</h2></div><button type="button" onClick={() => setEditingPerson(null)}>×</button></div>
            <div className="editor-grid">
              <label>Name<input value={editingPerson.display_name ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, display_name: e.target.value })} required /></label>
              <label>Slug<input value={editingPerson.slug ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, slug: e.target.value })} /></label>
              <label>Category<select value={editingPerson.category ?? 'developer'} onChange={(e) => setEditingPerson({ ...editingPerson, category: e.target.value as Category })}><option value="developer">Developer</option><option value="creator">Creator</option><option value="artist">Artist</option></select></label>
              <label>Role<input value={editingPerson.role ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, role: e.target.value })} required /></label>
              <label className="full">Bio<textarea rows={4} value={editingPerson.bio ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, bio: e.target.value })} required /></label>
              <label className="full">Skills <span>comma separated</span><input value={(editingPerson.skills ?? []).join(', ')} onChange={(e) => setEditingPerson({ ...editingPerson, skills: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
              <label>Portfolio<input type="url" value={editingPerson.portfolio_url ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, portfolio_url: e.target.value })} /></label>
              <label>GitHub<input type="url" value={editingPerson.github_url ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, github_url: e.target.value })} /></label>
              <label>Website<input type="url" value={editingPerson.website_url ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, website_url: e.target.value })} /></label>
              <label>Contact URL<input type="url" value={editingPerson.contact_url ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, contact_url: e.target.value })} /></label>
              <label className="full">Showcase login email <span>private · grants /studio access</span><input type="email" value={editingPerson.access_email ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, access_email: e.target.value })} placeholder="person@example.com" /></label>
              <label>Location<input value={editingPerson.location ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, location: e.target.value })} /></label>
              <label>Timezone<input value={editingPerson.timezone ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, timezone: e.target.value })} /></label>
              <label>Monogram<input maxLength={4} value={editingPerson.monogram ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, monogram: e.target.value })} /></label>
              <label>Sort order<input type="number" value={editingPerson.sort_order ?? 100} onChange={(e) => setEditingPerson({ ...editingPerson, sort_order: Number(e.target.value) })} /></label>
              <label>Availability<select value={editingPerson.availability ?? 'available'} onChange={(e) => setEditingPerson({ ...editingPerson, availability: e.target.value as Availability })}><option value="available">Available</option><option value="limited">Limited</option><option value="unavailable">Unavailable</option></select></label>
              <label>Status<select value={editingPerson.status ?? 'draft'} onChange={(e) => setEditingPerson({ ...editingPerson, status: e.target.value as PersonStatus })}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
              <label className="feature-checkbox"><input type="checkbox" checked={Boolean(editingPerson.is_featured)} onChange={(e) => setEditingPerson({ ...editingPerson, is_featured: e.target.checked })} /><span><strong>Feature on homepage</strong><small>Editorial feature. Never paid placement.</small></span></label>
              <label>Featured order<input type="number" value={editingPerson.featured_order ?? 100} onChange={(e) => setEditingPerson({ ...editingPerson, featured_order: Number(e.target.value) })} /></label>
              <label className="full">Featured note <span>optional</span><textarea rows={3} value={editingPerson.featured_note ?? ''} onChange={(e) => setEditingPerson({ ...editingPerson, featured_note: e.target.value })} /></label>
            </div>
            <div className="editor-actions"><button type="button" onClick={() => setEditingPerson(null)}>Cancel</button><button className="button button-dark" type="submit">Save entry</button></div>
          </form>
        </div>
      )}

      {editingReviewer && isAdmin && (
        <div className="editor-backdrop" role="presentation">
          <form className="person-editor" onSubmit={saveReviewer}>
            <div className="editor-head"><div><span className="kicker">{editingReviewer.id ? 'EDIT REVIEWER' : 'ADD REVIEWER'}</span><h2>{editingReviewer.display_name || 'New reviewer'}</h2></div><button type="button" onClick={() => setEditingReviewer(null)}>×</button></div>
            <div className="editor-grid">
              <label>Name<input value={editingReviewer.display_name ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, display_name: e.target.value })} required /></label>
              <label>Access email<input type="email" value={editingReviewer.email ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, email: e.target.value })} required /></label>
              <label className="full">Title / discipline<input value={editingReviewer.title ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, title: e.target.value })} placeholder="Senior software engineer · Product systems" required /></label>
              <label className="full">Public bio<textarea rows={4} value={editingReviewer.bio ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, bio: e.target.value })} required /></label>
              <label className="full">Specialties <span>comma separated</span><input value={(editingReviewer.specialties ?? []).join(', ')} onChange={(e) => setEditingReviewer({ ...editingReviewer, specialties: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
              <label>Background / work URL<input type="url" value={editingReviewer.website_url ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, website_url: e.target.value })} /></label>
              <label>Monogram<input maxLength={4} value={editingReviewer.monogram ?? ''} onChange={(e) => setEditingReviewer({ ...editingReviewer, monogram: e.target.value })} /></label>
              <label>Sort order<input type="number" value={editingReviewer.sort_order ?? 100} onChange={(e) => setEditingReviewer({ ...editingReviewer, sort_order: Number(e.target.value) })} /></label>
              <label className="feature-checkbox"><input type="checkbox" checked={Boolean(editingReviewer.is_public)} onChange={(e) => setEditingReviewer({ ...editingReviewer, is_public: e.target.checked })} /><span><strong>Show on Review Panel</strong><small>Public transparency profile.</small></span></label>
              <label className="feature-checkbox"><input type="checkbox" checked={Boolean(editingReviewer.is_active)} onChange={(e) => setEditingReviewer({ ...editingReviewer, is_active: e.target.checked })} /><span><strong>Active reviewer</strong><small>Allows access to review submissions.</small></span></label>
            </div>
            <div className="editor-actions"><button type="button" onClick={() => setEditingReviewer(null)}>Cancel</button><button className="button button-dark" type="submit">Save reviewer</button></div>
          </form>
        </div>
      )}

      {editingJournal && isAdmin && (
        <div className="editor-backdrop" role="presentation">
          <form className="person-editor journal-editor" onSubmit={saveJournal}>
            <div className="editor-head"><div><span className="kicker">{editingJournal.id ? 'EDIT JOURNAL' : 'NEW JOURNAL ENTRY'}</span><h2>{editingJournal.title || 'Untitled entry'}</h2></div><button type="button" onClick={() => setEditingJournal(null)}>×</button></div>
            <div className="editor-grid">
              <label className="full">Title<input value={editingJournal.title ?? ''} onChange={(e) => setEditingJournal({ ...editingJournal, title: e.target.value, slug: editingJournal.id ? editingJournal.slug : slugify(e.target.value) })} required /></label>
              <label>Slug<input value={editingJournal.slug ?? ''} onChange={(e) => setEditingJournal({ ...editingJournal, slug: e.target.value })} required /></label>
              <label>Byline<input value={editingJournal.author_name ?? 'ivansays Editorial'} onChange={(e) => setEditingJournal({ ...editingJournal, author_name: e.target.value })} required /></label>
              <label className="full">Excerpt<textarea rows={3} value={editingJournal.excerpt ?? ''} onChange={(e) => setEditingJournal({ ...editingJournal, excerpt: e.target.value })} placeholder="Short summary shown on the Journal index." required /></label>
              <label className="full">Entry<textarea className="journal-body-editor" rows={18} value={editingJournal.body ?? ''} onChange={(e) => setEditingJournal({ ...editingJournal, body: e.target.value })} placeholder="Write the entry here. Blank lines are preserved." required /></label>
              <label>Status<select value={editingJournal.status ?? 'draft'} onChange={(e) => setEditingJournal({ ...editingJournal, status: e.target.value as JournalStatus })}><option value="draft">Draft</option><option value="published">Published</option></select></label>
            </div>
            <div className="editor-actions">{editingJournal.id && <button className="editor-delete" type="button" onClick={() => void deleteJournalEntry(editingJournal as JournalEntry)}>Delete permanently</button>}<span className="editor-actions-spacer" /><button type="button" onClick={() => setEditingJournal(null)}>Cancel</button><button className="button button-dark" type="submit">{editingJournal.status === 'published' ? 'Publish entry' : 'Save draft'}</button></div>
          </form>
        </div>
      )}
    </main>
  )
}
