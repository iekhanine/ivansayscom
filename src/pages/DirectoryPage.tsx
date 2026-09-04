import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import PersonCard from '../components/PersonCard'
import { supabase } from '../lib/supabase'
import type { Category, Person } from '../types'

type Filter = 'all' | Category
const validFilters: Filter[] = ['all', 'developer', 'creator', 'artist']

export default function DirectoryPage() {
  const [people, setPeople] = useState<Person[]>([])
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedCategory = searchParams.get('category') as Filter | null
  const filter: Filter = requestedCategory && validFilters.includes(requestedCategory) ? requestedCategory : 'all'
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    void supabase
      .from('people')
      .select('*')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .order('curated_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error(error)
        setPeople((data as Person[] | null) ?? [])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return people.filter((person) => {
      if (filter !== 'all' && person.category !== filter) return false
      if (!needle) return true
      return [person.display_name, person.role, person.bio, person.category, person.location ?? '', ...person.skills]
        .join(' ').toLowerCase().includes(needle)
    })
  }, [filter, people, query])

  function setFilter(value: Filter) {
    setSearchParams(value === 'all' ? {} : { category: value })
  }

  return (
    <main>
      <SiteHeader />
      <div className="shell page-wrap">
        <header className="page-heading compact-heading">
          <span className="kicker">DIRECTORY</span>
          <h1>the creators...</h1>
          <p>a selective collection of developers and artists.</p>
        </header>

        <section className="directory-controls">
          <div className="filters" aria-label="Directory category">
            {validFilters.map((value) => (
              <button className={filter === value ? 'active' : ''} type="button" key={value} onClick={() => setFilter(value)}>
                {value === 'all' ? 'All' : `${value[0].toUpperCase()}${value.slice(1)}s`}
              </button>
            ))}
          </div>
          <label className="search-box">
            <span className="sr-only">Search directory</span>
            <input placeholder="Search name, skill, or keyword" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
        </section>

        {loading ? (
          <div className="loading-panel">Loading the directory…</div>
        ) : visible.length ? (
          <div className="directory-grid">
            {visible.map((person) => <PersonCard key={person.id} person={person} />)}
          </div>
        ) : (
          <div className="empty-panel"><strong>No matches.</strong><span>Try another filter or search term.</span></div>
        )}
      </div>
      <SiteFooter />
    </main>
  )
}
