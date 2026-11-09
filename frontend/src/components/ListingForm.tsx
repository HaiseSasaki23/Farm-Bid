import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { HarvestListing, ListingInput } from '../types';
import { CROP_SUGGESTIONS, PROVINCES, UNITS, readImage } from '../lib/format';
import { ErrorBanner, Stars } from './ui';

type Errors = Partial<Record<keyof ListingInput, string>>;

export function validateListing(v: ListingInput): Errors {
  const e: Errors = {};
  if (!v.cropName.trim()) e.cropName = 'Enter the crop name.';
  if (!(v.quantity > 0)) e.quantity = 'Enter a quantity greater than 0.';
  if (!v.location.trim()) e.location = 'Enter where the harvest is located.';
  if (!v.harvestDate) e.harvestDate = 'Choose the harvest date.';
  else if (v.harvestDate > new Date().toISOString().slice(0, 10)) e.harvestDate = 'Harvest date cannot be in the future.';
  if (!(v.startingPrice > 0)) e.startingPrice = 'Enter a starting price greater than 0.';
  if (!v.description.trim()) e.description = 'Add a short description so buyers know what to expect.';
  return e;
}

export function ListingForm({
  initial, submitLabel, busy, serverError, onSubmit, onCancel,
}: {
  initial?: HarvestListing;
  submitLabel: string;
  busy?: boolean;
  serverError?: string | null;
  onSubmit: (v: ListingInput) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState({
    cropName: initial?.cropName ?? '',
    quantity: initial ? String(initial.quantity) : '',
    unit: initial?.unit ?? 'kg',
    quality: initial?.quality ?? 4,
    location: initial?.location ?? '',
    harvestDate: initial?.harvestDate ?? new Date().toISOString().slice(0, 10),
    startingPrice: initial ? String(initial.startingPrice) : '',
    description: initial?.description ?? '',
    imagePath: initial?.imagePath,
  });
  const [errors, setErrors] = useState<Errors>({});
  const [photoError, setPhotoError] = useState<string | null>(null);

  const set = <K extends keyof typeof v>(k: K, val: (typeof v)[K]) => setV((p) => ({ ...p, [k]: val }));

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const input: ListingInput = {
      ...v,
      quantity: Number(v.quantity),
      startingPrice: Number(v.startingPrice),
    };
    const errs = validateListing(input);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(input);
  };

  const pick = async (file?: File) => {
    if (!file) return;
    setPhotoError(null);
    try {
      set('imagePath', await readImage(file));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Could not use that photo.');
    }
  };

  const err = (k: keyof ListingInput) => (errors[k] ? <span className="error-text">{errors[k]}</span> : null);

  return (
    <form onSubmit={submit} noValidate className="stack">
      {serverError && <ErrorBanner message={serverError} />}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="crop">Crop name</label>
          <input id="crop" className={`input ${errors.cropName ? 'invalid' : ''}`} list="crops" value={v.cropName} onChange={(e) => set('cropName', e.target.value)} placeholder="e.g. Tomato" />
          <datalist id="crops">{CROP_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
          {err('cropName')}
        </div>
        <div className="field">
          <label>Quality</label>
          <div style={{ padding: '6px 0' }}><Stars value={v.quality} onChange={(n) => set('quality', n)} large /></div>
          <span className="hint">Rate the grade of this harvest from 1 to 5 stars.</span>
        </div>
        <div className="field">
          <label htmlFor="qty">Quantity</label>
          <input id="qty" type="number" min="0" step="any" className={`input ${errors.quantity ? 'invalid' : ''}`} value={v.quantity} onChange={(e) => set('quantity', e.target.value)} />
          {err('quantity')}
        </div>
        <div className="field">
          <label htmlFor="unit">Unit</label>
          <select id="unit" className="select" value={v.unit} onChange={(e) => set('unit', e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="loc">Location</label>
          <input id="loc" className={`input ${errors.location ? 'invalid' : ''}`} list="provinces" value={v.location} onChange={(e) => set('location', e.target.value)} placeholder="Province or city" />
          <datalist id="provinces">{PROVINCES.map((p) => <option key={p} value={p} />)}</datalist>
          {err('location')}
        </div>
        <div className="field">
          <label htmlFor="hd">Harvest date</label>
          <input id="hd" type="date" className={`input ${errors.harvestDate ? 'invalid' : ''}`} value={v.harvestDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set('harvestDate', e.target.value)} />
          {err('harvestDate')}
        </div>
        <div className="field full">
          <label htmlFor="price">Starting price per {v.unit}</label>
          <div className="input-affix">
            <span className="affix">₱</span>
            <input id="price" type="number" min="0" step="0.01" className={`input ${errors.startingPrice ? 'invalid' : ''}`} value={v.startingPrice} onChange={(e) => set('startingPrice', e.target.value)} />
          </div>
          <span className="hint">Buyers cannot bid below this price.</span>
          {err('startingPrice')}
        </div>
        <div className="field full">
          <label htmlFor="desc">Description</label>
          <textarea id="desc" className={`textarea ${errors.description ? 'invalid' : ''}`} value={v.description} onChange={(e) => set('description', e.target.value)} placeholder="Grade, packaging, moisture, how soon it should be picked up…" />
          {err('description')}
        </div>
        <div className="field full">
          <label>Product photo</label>
          <div className="row">
            {v.imagePath ? (
              <div style={{ width: 120 }} className="crop-art sm" >
                <img src={v.imagePath} alt="Selected product" style={{ width: 120, height: 52 }} />
              </div>
            ) : null}
            <label className="btn secondary sm" style={{ cursor: 'pointer' }}>
              <ImagePlus size={16} />
              {v.imagePath ? 'Change photo' : 'Add photo'}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            {v.imagePath && (
              <button type="button" className="btn ghost sm" onClick={() => set('imagePath', undefined)}>
                <Trash2 size={16} /> Remove
              </button>
            )}
          </div>
          {photoError && <span className="error-text">{photoError}</span>}
          <span className="hint">Optional. Listings with a photo get more bids.</span>
        </div>
      </div>
      <div className="form-actions">
        <button type="button" className="btn secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button type="submit" className="btn primary" disabled={busy}>
          {busy && <span className="spinner" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
