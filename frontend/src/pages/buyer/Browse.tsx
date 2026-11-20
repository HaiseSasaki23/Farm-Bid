import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { harvestService } from '../../services';
import { useQuery } from '../../hooks/useQuery';
import type { ListingFilters } from '../../types';
import { ListingCard } from '../../components/ListingCard';
import { CATEGORIES, cropCategory, type Category } from '../../lib/format';
import { Empty, ErrorBanner, Loading, PageHeader } from '../../components/ui';

const EMPTY = { search: '', location: '', minPrice: '', maxPrice: '', minQuantity: '', minGrade: '', sort: 'newest' };

export function Browse() {
  const [f, setF] = useState(EMPTY);
  const [category, setCategory] = useState<Category | ''>('');
  const [open, setOpen] = useState(false);
  const [debounced, setDebounced] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const t = setTimeout(() => setDebounced(f), 250);
    return () => clearTimeout(t);
  }, [f]);

  const locations = useQuery(() => harvestService.locations(), []);
  const filters: ListingFilters = {
    search: debounced.search,
    location: debounced.location || undefined,
    minPrice: debounced.minPrice ? Number(debounced.minPrice) : undefined,
    maxPrice: debounced.maxPrice ? Number(debounced.maxPrice) : undefined,
    minQuantity: debounced.minQuantity ? Number(debounced.minQuantity) : undefined,
    minGrade: (debounced.minGrade || undefined) as ListingFilters['minGrade'],
    sort: debounced.sort as ListingFilters['sort'],
  };
  const { data: all, loading, error } = useQuery(() => harvestService.search(filters), [JSON.stringify(debounced)]);
  const data = all && category ? all.filter((l) => cropCategory(l.cropName) === category) : all;
  const counts = (c: Category) => all?.filter((l) => cropCategory(l.cropName) === c).length ?? 0;
  const activeCount = [f.location, f.minPrice, f.maxPrice, f.minQuantity, f.minGrade].filter(Boolean).length + (f.sort !== 'newest' ? 1 : 0);
  const dirty = JSON.stringify({ ...f, sort: 'newest' }) !== JSON.stringify(EMPTY);

  return (
    <>
      <PageHeader title="Browse harvests" subtitle="Find crops that match your needs, then open a listing to place a bid." />

      <div className="cats" role="group" aria-label="Crop category">
        <button className={`cat ${category === '' ? 'on' : ''}`} aria-pressed={category === ''} onClick={() => setCategory('')}>🧺 All</button>
        {CATEGORIES.filter((c) => c.key !== 'Other' || counts('Other') > 0).map((c) => (
          <button key={c.key} className={`cat ${category === c.key ? 'on' : ''}`} aria-pressed={category === c.key} onClick={() => setCategory(c.key)}>
            <span aria-hidden="true">{c.emoji}</span> {c.key} <span className="n">{counts(c.key)}</span>
          </button>
        ))}
      </div>

      <div className={`card filters${open ? ' open' : ''}`} style={{ marginBottom: 22 }}>
        <div className="field c6 search">
          <label htmlFor="s" className="sr-only">Search by crop name</label>
          <Search />
          <input id="s" className="input" placeholder="Search by crop name" value={f.search} onChange={(e) => set('search', e.target.value)} />
        </div>
        <button type="button" className="btn secondary filter-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <SlidersHorizontal size={16} /> {open ? 'Hide filters' : activeCount ? `Filters (${activeCount})` : 'Filters'}
        </button>
        <div className="field c3">
          <label htmlFor="loc">Location</label>
          <select id="loc" className="select" value={f.location} onChange={(e) => set('location', e.target.value)}>
            <option value="">Any location</option>
            {locations.data?.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div className="field c3">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" className="select" value={f.sort} onChange={(e) => set('sort', e.target.value)}>
            <option value="newest">Newest listing</option>
            <option value="lowestPrice">Lowest price</option>
            <option value="highestPrice">Highest starting price</option>
            <option value="topRated">Top-rated sellers</option>
          </select>
        </div>
        <div className="field c3">
          <label htmlFor="minp">Min price (₱)</label>
          <input id="minp" type="number" min="0" className="input" value={f.minPrice} onChange={(e) => set('minPrice', e.target.value)} />
        </div>
        <div className="field c3">
          <label htmlFor="maxp">Max price (₱)</label>
          <input id="maxp" type="number" min="0" className="input" value={f.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} />
        </div>
        <div className="field c3">
          <label htmlFor="minq">Min quantity</label>
          <input id="minq" type="number" min="0" className="input" value={f.minQuantity} onChange={(e) => set('minQuantity', e.target.value)} />
        </div>
        <div className="field c3">
          <label htmlFor="qual">Grade</label>
          <select id="qual" className="select" value={f.minGrade} onChange={(e) => set('minGrade', e.target.value)}>
            <option value="">Any grade</option>
            <option value="A">Grade A only</option>
            <option value="B">Grade B or better</option>
          </select>
        </div>
      </div>

      {error && <ErrorBanner message={error} />}

      <div className="spread" style={{ marginBottom: 14 }}>
        <span className="muted" aria-live="polite">{data ? `${data.length} ${data.length === 1 ? 'harvest' : 'harvests'} available` : ''}</span>
        {(dirty || category) && <button className="btn ghost sm" onClick={() => { setF(EMPTY); setCategory(''); }}><X size={16} /> Clear filters</button>}
      </div>

      {loading && !all ? (
        <Loading variant="cards" />
      ) : data && data.length === 0 ? (
        <div className="card">
          <Empty icon={<SearchX size={24} />} art="search" title="No harvests match">
            Try a different crop name, widen the price range, or clear the filters.
          </Empty>
        </div>
      ) : (
        <div className="grid-3">{data?.map((l) => <ListingCard key={l.harvestId} listing={l} />)}</div>
      )}
    </>
  );
}
