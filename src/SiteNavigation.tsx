const pages = [
  { path: '/project/', label: 'Selected projects' },
  { path: '/work/', label: 'All work' },
  { path: '/lab/', label: 'Lab' },
  { path: '/contact/', label: 'Contact' },
];

export function SiteNavigation({ currentPath }: { currentPath?: string }) {
  return <nav className="site-navigation" aria-label="Site pages">
    {pages.map(page => <a key={page.path} href={page.path} aria-current={currentPath === page.path ? 'page' : undefined}>{page.label}</a>)}
  </nav>;
}

export function SiteHeader({ currentPath }: { currentPath: string }) {
  return <header>
    <a href="/" aria-label="qvost portfolio home">qvost</a>
    <SiteNavigation currentPath={currentPath} />
  </header>;
}
