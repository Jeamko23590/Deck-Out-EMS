import { useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatCurrency } from '../../lib/format'
import type { Merchandise } from '../../types'

interface MerchandiseForm {
  name: string
  description: string
  imageUrl: string
  price: string
  stock: string
  category: string
  section: 'merch' | 'cards'
  game: string
  setName: string
  rarity: string
  condition: string
  cardNumber: string
  tags: string
  published: boolean
}

const blankForm = (): MerchandiseForm => ({ name: '', description: '', imageUrl: '', price: '', stock: '0', category: '', section: 'merch', game: '', setName: '', rarity: '', condition: 'Near Mint', cardNumber: '', tags: '', published: false })
const fromItem = (item: Merchandise): MerchandiseForm => ({ name: item.name, description: item.description, imageUrl: item.imageUrl, price: String(item.price), stock: String(item.stock), category: item.category, section: item.section === 'singles' || item.section === 'cards' && !/(pack|booster|sealed|deck|box|starter|bundle)/i.test(item.category) ? 'cards' : 'merch', game: item.game ?? '', setName: item.setName ?? '', rarity: item.rarity ?? '', condition: item.condition ?? 'Near Mint', cardNumber: item.cardNumber ?? '', tags: item.tags.join(', '), published: item.published })

export function AdminMerchandisePage() {
  usePageTitle('Admin merchandise')
  const { merchandise, addMerchandise, updateMerchandise, archiveMerchandise } = useApp()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<MerchandiseForm>(blankForm)
  const [error, setError] = useState('')
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url')
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const imageInput = useRef<HTMLInputElement>(null)
  const categories = useMemo(() => [...new Set(merchandise.map((item) => item.category).filter(Boolean))], [merchandise])
  const cardGames = useMemo(() => [...new Set(merchandise.filter((item) => item.section === 'singles' || item.section === 'cards' && !/(pack|booster|sealed|deck|box|starter|bundle)/i.test(item.category)).map((item) => item.game).filter((game): game is string => Boolean(game)))], [merchandise])

  const startEdit = (item: Merchandise) => { setEditingId(item.id); setForm(fromItem(item)); setImageMode(item.imageUrl.startsWith('data:image/') ? 'upload' : 'url'); setError('') }
  const cancelEdit = () => { setEditingId(null); setForm(blankForm()); setImageMode('url'); setError('') }
  const useImageFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return setError('Choose a JPG, PNG, WebP, or GIF image.')
    if (file.size > 4 * 1024 * 1024) return setError('Image must be 4 MB or smaller.')
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((current) => ({ ...current, imageUrl: reader.result as string }))
        setError('')
      } else setError('Unable to read the selected image.')
    }
    reader.onerror = () => setError('Unable to read the selected image.')
    reader.readAsDataURL(file)
  }
  const onImageSelected = (event: ChangeEvent<HTMLInputElement>) => useImageFile(event.target.files?.[0])
  const onImageDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDraggingImage(false)
    useImageFile(event.dataTransfer.files[0])
  }
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (form.name.trim().length < 2) return setError('Enter a product name with at least 2 characters.')
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid non-negative price.')
    if (!Number.isInteger(stock) || stock < 0) return setError('Stock must be a whole number of zero or more.')
    if (form.imageUrl && !/^https?:\/\//i.test(form.imageUrl) && !/^data:image\/(jpeg|png|webp|gif);base64,/i.test(form.imageUrl)) return setError('Use a full image URL or upload a supported image file.')
    if (form.section === 'cards' && !form.game.trim()) return setError('Choose or enter the card game for this single.')
    const payload = { name: form.name.trim(), description: form.description.trim(), imageUrl: form.imageUrl.trim(), price, stock, category: form.category.trim() || (form.section === 'cards' ? 'Single' : 'General'), section: form.section === 'cards' ? 'singles' as const : 'merch' as const, game: form.section === 'cards' ? form.game.trim() : undefined, setName: form.section === 'cards' ? form.setName.trim() : undefined, rarity: form.section === 'cards' ? form.rarity.trim() : undefined, condition: form.section === 'cards' ? form.condition.trim() : undefined, cardNumber: form.section === 'cards' ? form.cardNumber.trim() : undefined, tags: [...new Set(form.tags.split(',').map((tag) => tag.trim()).filter(Boolean))], published: form.published }
    try {
      if (editingId) await updateMerchandise(editingId, payload)
      else await addMerchandise(payload)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save listing.')
      return
    }
    cancelEdit()
  }

  return <div className="admin-page">
    <header className="admin-page__head">
      <div><p className="eyebrow">Shop catalog</p><h1>Merchandise &amp; singles</h1><p>Manage cafe merchandise and sealed card products here. Individual cards go into the dedicated singles section.</p></div>
      <Link to="/merchandise" className="btn btn--ghost">View public shop ↗</Link>
    </header>

    <div className="merch-admin-layout">
      <form className="admin-panel merch-admin-form" onSubmit={submit}>
        <div className="admin-panel__head"><div><p className="eyebrow">{editingId ? 'Edit listing' : 'New listing'}</p><h2>{editingId ? 'Product details' : 'Add merchandise'}</h2></div></div>
        <label className="field"><span className="field__label">Product name</span><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Decked Out Club Tee" /></label>
        <label className="field"><span className="field__label">Description</span><textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What makes this item worth picking up?" /></label>
        <label className="field"><span className="field__label">Shop section</span><select value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value as 'merch' | 'cards', game: '' })}><option value="merch">Merchandise (including sealed packs)</option><option value="cards">Singles</option></select></label>
        {form.section === 'cards' && <>
          <label className="field"><span className="field__label">Card game</span><input list="merch-card-games" value={form.game} onChange={(event) => setForm({ ...form, game: event.target.value })} placeholder="Riftbound, Pokémon, Magic…" /><datalist id="merch-card-games">{cardGames.map((game) => <option key={game} value={game} />)}</datalist><span className="field__hint">Choose an existing game or type a new one to add it to Singles.</span></label>
          <div className="field-row"><label className="field"><span className="field__label">Set / expansion</span><input value={form.setName} onChange={(event) => setForm({ ...form, setName: event.target.value })} placeholder="Set name" /></label><label className="field"><span className="field__label">Card number</span><input value={form.cardNumber} onChange={(event) => setForm({ ...form, cardNumber: event.target.value })} placeholder="Optional" /></label></div>
          <div className="field-row"><label className="field"><span className="field__label">Rarity</span><input value={form.rarity} onChange={(event) => setForm({ ...form, rarity: event.target.value })} placeholder="Rare, Holo, Mythic…" /></label><label className="field"><span className="field__label">Condition</span><input value={form.condition} onChange={(event) => setForm({ ...form, condition: event.target.value })} placeholder="Near Mint" /></label></div>
        </>}
        <div className="field merch-image-field">
          <span className="field__label">Product image</span>
          <div className="merch-image-mode" role="group" aria-label="Choose image source">
            <button type="button" className={imageMode === 'url' ? 'is-active' : ''} onClick={() => setImageMode('url')}>Image URL</button>
            <button type="button" className={imageMode === 'upload' ? 'is-active' : ''} onClick={() => setImageMode('upload')}>Upload image</button>
          </div>
          {imageMode === 'url' ? <input type="url" value={form.imageUrl.startsWith('data:image/') ? '' : form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} placeholder="https://…" /> : <>
            <input ref={imageInput} className="merch-image-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onImageSelected} />
            <div className={`merch-image-drop${isDraggingImage ? ' is-dragging' : ''}`} role="button" tabIndex={0} onClick={() => imageInput.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') imageInput.current?.click() }} onDragOver={(event) => { event.preventDefault(); setIsDraggingImage(true) }} onDragLeave={() => setIsDraggingImage(false)} onDrop={onImageDrop}>
              <strong>Drop an image here or browse files</strong><span>JPG, PNG, WebP, or GIF · up to 4 MB</span>
            </div>
          </>}
          <span className="field__hint">Uploaded images are saved with the shared product so they appear in both EMS and POS. Leave blank to use the shop placeholder.</span>
        </div>
        {form.imageUrl && <><img className="merch-admin-preview" src={form.imageUrl} alt="Product preview" /><button className="text-btn" type="button" onClick={() => setForm({ ...form, imageUrl: '' })}>Remove image</button></>}
        <div className="field-row">
          <label className="field"><span className="field__label">Price (PHP)</span><input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="650" /></label>
          <label className="field"><span className="field__label">Stock quantity</span><input type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label>
        </div>
        <label className="field"><span className="field__label">{form.section === 'cards' ? 'Single category' : 'Merchandise category'}</span><input list="merch-categories" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={form.section === 'cards' ? 'Single, Promo, Graded…' : 'Booster packs, accessories, apparel…'} /><datalist id="merch-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist><span className="field__hint">Create a category or reuse one already in the catalog.</span></label>
        <label className="field"><span className="field__label">Tags</span><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="TCG, Club Gear, New" /><span className="field__hint">Separate tags with commas. New tags are added as you use them.</span></label>
        <label className="merch-publish-toggle"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Show in public shop</strong><small>Unpublished items stay in this admin catalog.</small></span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="admin-form__actions"><button className="btn btn--primary" type="submit">{editingId ? 'Save changes' : 'Create listing'}</button>{editingId && <button className="btn btn--ghost" type="button" onClick={cancelEdit}>Cancel</button>}</div>
      </form>

      <section className="admin-panel merch-admin-list">
        <div className="admin-panel__head"><div><p className="eyebrow">Catalog</p><h2>{merchandise.length} listings</h2></div></div>
        {merchandise.length ? <div className="merch-admin-items">{merchandise.map((item) => <article key={item.id} className="merch-admin-item">
          {item.imageUrl ? <img src={item.imageUrl} alt="" loading="lazy" /> : <div className="merch-admin-item__placeholder">DO</div>}
          <div className="merch-admin-item__details"><strong>{item.name}</strong><span>{item.section === 'singles' || item.section === 'cards' && !/(pack|booster|sealed|deck|box|starter|bundle)/i.test(item.category) ? `Single · ${item.game} · ${item.setName ?? ''} · ` : 'Merchandise · '}{item.category} · {item.stock} in stock · {formatCurrency(item.price)}</span><div className="merch-tags">{item.tags.map((tag) => <small key={tag}>{tag}</small>)}</div></div>
          <div className="merch-admin-item__actions"><span className={`status ${item.published ? 'status--upcoming' : 'status--draft'}`}>{item.published ? 'Published' : 'Draft'}</span><button className="text-btn" type="button" onClick={() => startEdit(item)}>Edit</button><button className="text-btn" type="button" onClick={() => void updateMerchandise(item.id, { published: !item.published }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to update product.'))}>{item.published ? 'Unpublish' : 'Publish'}</button><button className="text-btn" type="button" onClick={() => { if (window.confirm(`Archive ${item.name} from the shared POS and EMS catalogs?`)) void archiveMerchandise(item.id).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to archive product.')) }}>Archive</button></div>
        </article>)}</div> : <div className="admin-empty"><strong>No merchandise yet.</strong><span>Add a listing using the form.</span></div>}
      </section>
    </div>
  </div>
}
