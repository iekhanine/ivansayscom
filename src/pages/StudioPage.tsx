import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { supabase } from '../lib/supabase'
import type { Person, PersonAccess, ShowcaseItem } from '../types'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function imageUrl(path: string) {
  return supabase.storage.from('showcase').getPublicUrl(path).data.publicUrl
}

function safeFilename(name: string) {
  const dot = name.lastIndexOf('.')
  const extension = dot >= 0 ? name.slice(dot).toLowerCase() : ''
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'work'
  return `${base}${extension}`
}

export default function StudioPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [person, setPerson] = useState<Person | null>(null)
  const [items, setItems] = useState<ShowcaseItem[]>([])
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [notice, setNotice] = useState('')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [altText, setAltText] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [editingItem, setEditingItem] = useState<ShowcaseItem | null>(null)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoadingAuth(false)
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setLoadingAuth(false)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  const loadStudio = useCallback(async () => {
    if (!session) {
      setAuthorized(null)
      setPerson(null)
      setItems([])
      return
    }

    setCheckingAccess(true)
    setNotice('')

    const { error: claimError } = await supabase.rpc('claim_person_access')
    if (claimError) {
      console.error(claimError)
      setNotice(`Showcase access could not be checked: ${claimError.message}`)
    }

    const { data: accessData, error: accessError } = await supabase
      .from('person_access')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (accessError) {
      setNotice(accessError.message)
      setAuthorized(false)
      setCheckingAccess(false)
      return
    }

    if (!accessData) {
      setAuthorized(false)
      setCheckingAccess(false)
      return
    }

    const access = accessData as PersonAccess
    const [{ data: personData, error: personError }, { data: itemData, error: itemError }] = await Promise.all([
      supabase.from('people').select('*').eq('id', access.person_id).maybeSingle(),
      supabase.from('showcase_items').select('*').eq('person_id', access.person_id).order('sort_order', { ascending: true }).order('created_at', { ascending: false }),
    ])

    if (personError || !personData) {
      setNotice(personError?.message || 'The linked directory profile could not be loaded.')
      setAuthorized(false)
      setCheckingAccess(false)
      return
    }
    if (itemError) setNotice(itemError.message)

    setPerson(personData as Person)
    setItems((itemData as ShowcaseItem[] | null) ?? [])
    setAuthorized(true)
    setCheckingAccess(false)
  }, [session])

  useEffect(() => { void loadStudio() }, [loadStudio])

  async function authSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    setNotice('')

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return setNotice(error.message)
      if (!data.session) setNotice('Account created. Confirm your email if required, then return here and sign in.')
      else setNotice('Account created. Connecting it to your approved profile…')
      return
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setNotice(error.message)
  }

  async function uploadWork(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!person || !file) return
    setNotice('')

    if (!ALLOWED_TYPES.includes(file.type)) return setNotice('Use a JPG, PNG, or WebP image.')
    if (file.size > MAX_FILE_SIZE) return setNotice('Images must be 10 MB or smaller.')
    if (!title.trim()) return setNotice('Give the work a title.')

    setUploading(true)
    const path = `${person.id}/${crypto.randomUUID()}-${safeFilename(file.name)}`
    const { error: uploadError } = await supabase.storage.from('showcase').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

    if (uploadError) {
      setUploading(false)
      return setNotice(uploadError.message)
    }

    const { error: insertError } = await supabase.from('showcase_items').insert({
      person_id: person.id,
      image_path: path,
      title: title.trim(),
      description: description.trim() || null,
      alt_text: altText.trim() || title.trim(),
      sort_order: items.length * 10 + 10,
      is_published: publishNow,
    })

    if (insertError) {
      await supabase.storage.from('showcase').remove([path])
      setUploading(false)
      return setNotice(insertError.message)
    }

    setFile(null)
    setTitle('')
    setDescription('')
    setAltText('')
    setPublishNow(true)
    setUploading(false)
    setNotice('Work added to your showcase.')
    const input = document.getElementById('studio-work-file') as HTMLInputElement | null
    if (input) input.value = ''
    await loadStudio()
  }

  async function togglePublished(item: ShowcaseItem) {
    const { error } = await supabase.from('showcase_items').update({ is_published: !item.is_published, updated_at: new Date().toISOString() }).eq('id', item.id)
    if (error) return setNotice(error.message)
    setNotice(item.is_published ? 'Piece moved to draft.' : 'Piece published.')
    await loadStudio()
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingItem) return
    const { error } = await supabase.from('showcase_items').update({
      title: editingItem.title.trim(),
      description: editingItem.description?.trim() || null,
      alt_text: editingItem.alt_text.trim() || editingItem.title.trim(),
      sort_order: Number(editingItem.sort_order || 0),
      updated_at: new Date().toISOString(),
    }).eq('id', editingItem.id)
    if (error) return setNotice(error.message)
    setEditingItem(null)
    setNotice('Showcase piece updated.')
    await loadStudio()
  }

  async function deleteItem(item: ShowcaseItem) {
    if (!window.confirm(`Delete “${item.title}” from your showcase? This cannot be undone.`)) return
    const { error: deleteError } = await supabase.from('showcase_items').delete().eq('id', item.id)
    if (deleteError) return setNotice(deleteError.message)
    const { error: storageError } = await supabase.storage.from('showcase').remove([item.image_path])
    if (storageError) console.error(storageError)
    setNotice('Showcase piece deleted.')
    await loadStudio()
  }

  if (loadingAuth) {
    return <main><SiteHeader /><div className="shell studio-page"><div className="loading-panel">Opening studio…</div></div><SiteFooter /></main>
  }

  if (!session) {
    return (
      <main>
        <SiteHeader />
        <div className="shell studio-page studio-login-wrap">
          <section className="studio-login-copy">
            <span className="kicker">MEMBER STUDIO</span>
            <h1>Manage your showcase.</h1>
            <p>Studio access is only available to people already selected for the ivansays index. Use the same email the editorial team connected to your profile.</p>
          </section>
          <form className="studio-login-card" onSubmit={authSubmit}>
            <div><span className="kicker">{authMode === 'login' ? 'SIGN IN' : 'FIRST VISIT'}</span><h2>{authMode === 'login' ? 'Studio access' : 'Create your studio login'}</h2></div>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={6} required /></label>
            {notice && <div className="form-error studio-notice">{notice}</div>}
            <button className="button button-dark" type="submit">{authMode === 'login' ? 'Sign in' : 'Create account'}</button>
            <button className="studio-auth-switch" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setNotice('') }}>{authMode === 'login' ? 'First visit? Create an account' : 'Already have an account? Sign in'}</button>
          </form>
        </div>
        <SiteFooter />
      </main>
    )
  }

  if (checkingAccess) {
    return <main><SiteHeader /><div className="shell studio-page"><div className="loading-panel">Checking showcase access…</div></div><SiteFooter /></main>
  }

  if (!authorized || !person) {
    return (
      <main>
        <SiteHeader />
        <div className="shell studio-page">
          <section className="studio-access-card">
            <span className="kicker">ACCESS CHECK</span>
            <h1>This login isn't connected to a showcase yet.</h1>
            <p>You're signed in as <strong>{session.user.email}</strong>. An ivansays admin needs to add that email to your approved profile in People / Index.</p>
            {notice && <div className="form-error">{notice}</div>}
            <div className="studio-access-actions"><button className="button button-dark" type="button" onClick={() => void loadStudio()}>Check again</button><button className="button" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button></div>
          </section>
        </div>
        <SiteFooter />
      </main>
    )
  }

  return (
    <main>
      <SiteHeader />
      <div className="shell studio-page">
        <header className="studio-head">
          <div><span className="kicker">MEMBER STUDIO</span><h1>{person.display_name}</h1><p>Build the visual side of your ivansays profile. Upload work, add context, and decide what appears publicly.</p></div>
          <div className="studio-head-actions"><Link className="button button-dark" to={`/people/${person.slug}`}>View public showcase ↗</Link><button className="button" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button></div>
        </header>

        {notice && <div className="studio-banner">{notice}</div>}

        <div className="studio-layout">
          <form className="studio-upload-panel" onSubmit={uploadWork}>
            <div className="studio-panel-head"><span className="kicker">ADD WORK</span><strong>New showcase piece</strong></div>
            <label>Image<input id="studio-work-file" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required /><small>JPG, PNG, or WebP · maximum 10 MB</small></label>
            <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required /></label>
            <label>Description<textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this? What should someone notice about it?" /></label>
            <label>Image description <span>for accessibility</span><input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe what is visible in the image" /></label>
            <label className="studio-publish-check"><input type="checkbox" checked={publishNow} onChange={(event) => setPublishNow(event.target.checked)} /><span><strong>Publish immediately</strong><small>Turn this off to keep it out of the public showcase.</small></span></label>
            <button className="button button-dark" type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Add to showcase'}</button>
            <div className="studio-commerce-note"><span>SELLING</span><p>Commerce is intentionally disabled for now. The gallery is structured so pricing and purchase links can be enabled later without rebuilding it.</p></div>
          </form>

          <section className="studio-library">
            <div className="studio-library-head"><div><span className="kicker">YOUR WORK</span><h2>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</h2></div><button type="button" onClick={() => void loadStudio()}>Refresh</button></div>
            {items.length === 0 ? (
              <div className="empty-panel"><strong>Your showcase is empty.</strong><span>Add the first piece using the form.</span></div>
            ) : (
              <div className="studio-item-grid">
                {items.map((item) => (
                  <article className="studio-item" key={item.id}>
                    <img src={imageUrl(item.image_path)} alt={item.alt_text || item.title} />
                    <div className="studio-item-copy"><div><strong>{item.title}</strong><span className={item.is_published ? 'studio-state published' : 'studio-state'}>{item.is_published ? 'Published' : 'Draft'}</span></div>{item.description && <p>{item.description}</p>}</div>
                    <div className="studio-item-actions"><button type="button" onClick={() => void togglePublished(item)}>{item.is_published ? 'Unpublish' : 'Publish'}</button><button type="button" onClick={() => setEditingItem(item)}>Edit</button><button className="danger" type="button" onClick={() => void deleteItem(item)}>Delete</button></div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {editingItem && (
        <div className="editor-backdrop" role="presentation">
          <form className="person-editor studio-item-editor" onSubmit={saveItem}>
            <div className="editor-head"><div><span className="kicker">EDIT WORK</span><h2>{editingItem.title}</h2></div><button type="button" onClick={() => setEditingItem(null)}>×</button></div>
            <div className="editor-grid">
              <label className="full">Title<input value={editingItem.title} onChange={(event) => setEditingItem({ ...editingItem, title: event.target.value })} required /></label>
              <label className="full">Description<textarea rows={5} value={editingItem.description ?? ''} onChange={(event) => setEditingItem({ ...editingItem, description: event.target.value })} /></label>
              <label className="full">Image description<input value={editingItem.alt_text} onChange={(event) => setEditingItem({ ...editingItem, alt_text: event.target.value })} /></label>
              <label>Sort order<input type="number" value={editingItem.sort_order} onChange={(event) => setEditingItem({ ...editingItem, sort_order: Number(event.target.value) })} /></label>
            </div>
            <div className="editor-actions"><button type="button" onClick={() => setEditingItem(null)}>Cancel</button><button className="button button-dark" type="submit">Save changes</button></div>
          </form>
        </div>
      )}

      <SiteFooter />
    </main>
  )
}
