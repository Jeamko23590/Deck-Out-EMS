import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { usePageTitle } from '../hooks/usePageTitle'
import { formatCurrency } from '../lib/format'

export function MerchandisePage() {
  usePageTitle('Merchandise')
  const { merchandise } = useApp()
  const [section, setSection] = useState<'merch' | 'singles'>('merch')
  const [category, setCategory] = useState('All items')
  const [query, setQuery] = useState('')
  const published = merchandise.filter((item) => item.published)
  const isSingle = (item: (typeof published)[number]) => item.section === 'singles' || item.section === 'cards' && !/(pack|booster|sealed|deck|box|starter|bundle)/i.test(item.category)
  const sectionItems = published.filter((item) => section === 'singles' ? isSingle(item) : !isSingle(item))
  const categories = ['All items', ...new Set(sectionItems.map((item) => section === 'singles' ? item.game : item.category).filter((value): value is string => Boolean(value)))]
  const items = useMemo(() => sectionItems.filter((item) => {
    const itemFilter = section === 'singles' ? item.game : item.category
    const matchesCategory = category === 'All items' || itemFilter === category
    const searchText = [item.name, item.description, item.category, ...item.tags].join(' ').toLowerCase()
    return matchesCategory && searchText.includes(query.trim().toLowerCase())
  }), [sectionItems, section, category, query])

  return (
    <div className="merch-page">
      <section className="merch-hero">
        <div className="container merch-hero__inner">
          <div>
            <p className="eyebrow"><span className="eyebrow__bar" />The Decked Out shop</p>
            <h1>Gear for<br /><span>your next round.</span></h1>
            <p>Club essentials, table-ready accessories, and cafe favorites. Find your next tournament day staple.</p>
          </div>
          <div className="merch-hero__mark" aria-hidden="true">DO<span>SHOP</span></div>
        </div>
      </section>

      <div className="merch-section-switcher">
        <div className="container merch-section-switcher__inner" role="tablist" aria-label="Shop sections">
          <button type="button" role="tab" aria-selected={section === 'merch'} className={section === 'merch' ? 'is-active' : ''} onClick={() => { setSection('merch'); setCategory('All items') }}>Merchandise <span>{published.filter((item) => !isSingle(item)).length}</span></button>
          <button type="button" role="tab" aria-selected={section === 'singles'} className={section === 'singles' ? 'is-active' : ''} onClick={() => { setSection('singles'); setCategory('All items') }}>Singles <span>{published.filter(isSingle).length}</span></button>
        </div>
      </div>

      <section className="section merch-catalog">
        <div className="container">
          <div className="section-head">
            <div className="section-head__copy">
              <p className="eyebrow">{section === 'singles' ? 'Find your next favorite' : 'Made for the community'}</p>
              <h2 className="section-title">{section === 'singles' ? 'The singles case' : 'The collection'}</h2>
              <p className="section-desc">{section === 'singles' ? 'Individual cards from the games you play. Filter by game and check condition, set, and price.' : `${sectionItems.length} items from the cafe and the club, including sealed card products.`}</p>
            </div>
            <label className="merch-search"><span className="sr-only">Search merchandise</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the shop" /></label>
          </div>
          <div className="merch-filters" aria-label={section === 'singles' ? 'Filter singles by card game' : 'Merchandise categories'}>
            {categories.map((item) => <button key={item} type="button" className={`merch-filter ${category === item ? 'is-active' : ''}`} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          {items.length ? <div className="merch-grid">
            {items.map((item) => <article className={`merch-card ${section === 'singles' ? 'merch-card--single' : ''}`} key={item.id}>
              <div className="merch-card__image-wrap">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} loading="lazy" /> : <div className="merch-card__placeholder" aria-label="No product image">DO</div>}
                <span className="merch-card__category">{section === 'singles' ? item.game : item.category || 'Merch'}</span>
              </div>
              <div className="merch-card__body">
                {section === 'singles' && <div className="single-card__meta"><span>{item.setName || item.game}</span>{item.cardNumber && <span>#{item.cardNumber}</span>}{item.rarity && <strong>{item.rarity}</strong>}{item.condition && <em>{item.condition}</em>}</div>}
                <div className="merch-card__heading"><h3>{item.name}</h3><strong>{formatCurrency(item.price)}</strong></div>
                <p>{item.description}</p>
                {item.tags.length > 0 && <div className="merch-tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
                <div className="merch-card__foot"><span className={item.stock === 0 ? 'is-sold-out' : section === 'singles' && item.stock <= 3 ? 'is-low-stock' : ''}>{item.stock === 0 ? 'Sold out' : section === 'singles' && item.stock <= 3 ? `Only ${item.stock} left` : `${item.stock} available`}</span><span>{section === 'singles' ? item.stock > 0 ? 'Ask to see this card' : 'Unavailable' : 'Available at the cafe'}</span></div>
              </div>
            </article>)}
          </div> : <div className="merch-empty"><strong>No items match that search.</strong><span>Try another category or search term.</span></div>}
          <p className="merch-note">To purchase, ask our staff at Decked Out Cafe. Online checkout is not available yet.</p>
        </div>
      </section>
    </div>
  )
}
