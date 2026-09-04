import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'

const principles = [
  ['Work first', 'Finished work, useful experiments, repositories, releases, portfolios, and case studies matter more than résumé language.'],
  ['Small is fine', 'The directory does not need thousands of profiles to be useful. Selectivity is part of the product.'],
  ['Editorial review', 'Experienced practitioners review submissions and nominations. No score automatically decides inclusion.'],
  ['No purchased endorsement', 'A listing or homepage feature is an editorial choice, not an ad product.'],
  ['Interesting beats famous', 'Reach can be useful context, but it is not the standard for whether the work deserves attention.'],
  ['Direct links', 'The directory should help visitors get to the person and their work with as little platform friction as possible.'],
]

export default function PhilosophyPage() {
  return (
    <main>
      <SiteHeader />
      <div className="shell page-wrap">
        <header className="page-heading compact-heading">
          <span className="kicker">SELECTION</span>
          <h1>the process...</h1>
          <p>The standard is deliberately simple: show strong work, add useful context, and give reviewers something real to evaluate.</p>
        </header>

        <section className="principles-grid-new">
          {principles.map(([title, copy], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h2>{title}</h2>
              <p>{copy}</p>
            </article>
          ))}
        </section>

        <section className="page-cta-row">
          <div><strong>Two ways into review.</strong><span>Submit your own work or recommend somebody else.</span></div>
          <div><Link className="button button-quiet" to="/nominate">Nominate</Link><Link className="button button-dark" to="/apply">Submit work</Link></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
