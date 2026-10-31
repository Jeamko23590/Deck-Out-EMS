export function BrandMark({ className = 'brand__mark' }: { className?: string }) {
  return (
    <img 
      src="/images/categories/logo.jpg" 
      alt="Decked Out Logo" 
      className={className}
      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
    />
  )
}

export function BrandLogo({ footer = false }: { footer?: boolean }) {
  return (
    <span className={`brand-lockup ${footer ? 'brand-lockup--footer' : ''}`}>
      <BrandMark />
      <span className="brand__text">
        <span className="brand__name">DECKED OUT</span>
        <span className="brand__sub">CAFE · TCG CLUB</span>
      </span>
    </span>
  )
}
