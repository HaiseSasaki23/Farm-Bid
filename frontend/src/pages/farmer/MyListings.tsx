import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, Eye, EyeOff, Gavel, MapPin, Pencil, Plus, Sprout, Trash2 } from 'lucide-react';
import { harvestService } from '../../api';
import { useQuery } from '../../hooks/useQuery';
import { useToast } from '../../context/ToastContext';
import { dateShort, num } from '../../lib/format';
import type { ListingInput, ListingStatus, ListingView } from '../../types';
import { ListingForm } from '../../components/ListingForm';
import { Confirm, CropArt, Empty, ErrorBanner, Loading, Modal, PageHeader, PriceTag, Stars, StatusBadge } from '../../components/ui';

const FILTERS: ('All' | ListingStatus)[] = ['All', 'Available', 'Reserved', 'Sold', 'Unavailable'];

export function MyListings() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const { data, loading, error } = useQuery(() => harvestService.mine(), []);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [form, setForm] = useState<{ mode: 'create' } | { mode: 'edit'; listing: ListingView } | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'sold' | 'close'; listing: ListingView } | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('new')) {
      setForm({ mode: 'create' });
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const shown = (data ?? []).filter((l) => filter === 'All' || l.status === filter);
  const count = (s: (typeof FILTERS)[number]) => (s === 'All' ? data?.length ?? 0 : data?.filter((l) => l.status === s).length ?? 0);

  const save = async (input: ListingInput) => {
    setBusy(true);
    setFormError(null);
    try {
      if (form?.mode === 'edit') {
        await harvestService.update(form.listing.harvestId, input);
        toast('Changes saved.');
      } else {
        await harvestService.create(input);
        toast('Listing published. Buyers can bid now.');
      }
      setForm(null);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save the listing.');
    } finally {
      setBusy(false);
    }
  };

  const act = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setConfirm(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Something went wrong.', 'error');
      setConfirm(null);
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = () => {
    if (!confirm) return;
    const { kind, listing: l } = confirm;
    if (kind === 'delete') return act(() => harvestService.remove(l.harvestId), 'Listing deleted.');
    if (kind === 'sold') return act(() => harvestService.setStatus(l.harvestId, 'Sold'), 'Marked as sold.');
    return act(() => harvestService.setStatus(l.harvestId, 'Unavailable'), 'Listing closed. Buyers can no longer see it.');
  };

  return (
    <>
      <PageHeader
        title="My listings"
        subtitle="Post harvests, edit details, and close a listing when it is no longer available."
        actions={<button className="btn mango" onClick={() => { setFormError(null); setForm({ mode: 'create' }); }}><Plus size={18} /> New listing</button>}
      />
      {error && <ErrorBanner message={error} />}

      <div className="tabs" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} className="tab" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f} <span className="n">{count(f)}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <Loading />
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty icon={<Sprout size={24} />} title={filter === 'All' ? 'No listings yet' : `No ${filter.toLowerCase()} listings`}>
            {filter === 'All' ? 'Add the crop, quantity and a starting price to start receiving bids.' : 'Change the filter to see your other listings.'}
          </Empty>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table stack">
              <thead>
                <tr><th>Product</th><th>Quantity</th><th>Quality</th><th>Starting price</th><th>Status</th><th>Bids</th><th /></tr>
              </thead>
              <tbody>
                {shown.map((l) => {
                  const locked = l.status === 'Reserved';
                  return (
                    <tr key={l.harvestId}>
                      <td>
                        <div className="cell-prod">
                          <CropArt name={l.cropName} src={l.imagePath} size="sm" />
                          <div>
                            <div className="t">{l.cropName}</div>
                            <div className="small faint"><MapPin size={12} style={{ verticalAlign: -1 }} /> {l.location} · harvested {dateShort(l.harvestDate)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="num" data-label="Quantity">{num(l.quantity)} {l.unit}</td>
                      <td data-label="Quality"><Stars value={l.quality} /></td>
                      <td data-label="Starting price"><PriceTag amount={l.startingPrice} unit={l.unit} variant="quiet" /></td>
                      <td data-label="Status"><StatusBadge status={l.status} /></td>
                      <td className="num" data-label="Bids">{l.bidCount}</td>
                      <td>
                        <div className="cell-actions">
                          <Link className="btn secondary sm" to={`/farmer/listings/${l.harvestId}/bids`}><Gavel size={15} /> Bids</Link>
                          <button className="btn ghost icon" title={locked ? 'Locked while a transaction is pending' : 'Edit'} aria-label={`Edit ${l.cropName}`} disabled={locked} onClick={() => { setFormError(null); setForm({ mode: 'edit', listing: l }); }}><Pencil size={17} /></button>
                          {l.status === 'Unavailable' ? (
                            <button className="btn ghost icon" title="Reopen listing" aria-label={`Reopen ${l.cropName}`} onClick={() => act(() => harvestService.setStatus(l.harvestId, 'Available'), 'Listing is open for bids again.')}><Eye size={17} /></button>
                          ) : (
                            <button className="btn ghost icon" title="Close listing (mark unavailable)" aria-label={`Close ${l.cropName}`} disabled={locked || l.status === 'Sold'} onClick={() => setConfirm({ kind: 'close', listing: l })}><EyeOff size={17} /></button>
                          )}
                          <button className="btn ghost icon" title="Mark as sold" aria-label={`Mark ${l.cropName} as sold`} disabled={locked || l.status === 'Sold'} onClick={() => setConfirm({ kind: 'sold', listing: l })}><BadgeCheck size={17} /></button>
                          <button className="btn ghost icon" title="Delete" aria-label={`Delete ${l.cropName}`} disabled={locked} onClick={() => setConfirm({ kind: 'delete', listing: l })}><Trash2 size={17} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {form && (
        <Modal title={form.mode === 'edit' ? `Edit ${form.listing.cropName}` : 'New harvest listing'} onClose={() => !busy && setForm(null)}>
          <ListingForm
            initial={form.mode === 'edit' ? form.listing : undefined}
            submitLabel={form.mode === 'edit' ? 'Save changes' : 'Publish listing'}
            busy={busy}
            serverError={formError}
            onSubmit={save}
            onCancel={() => setForm(null)}
          />
        </Modal>
      )}

      {confirm && (
        <Confirm
          title={confirm.kind === 'delete' ? `Delete ${confirm.listing.cropName}?` : confirm.kind === 'sold' ? 'Mark as sold?' : 'Close this listing?'}
          confirmLabel={confirm.kind === 'delete' ? 'Delete listing' : confirm.kind === 'sold' ? 'Mark as sold' : 'Close listing'}
          danger={confirm.kind === 'delete'}
          busy={busy}
          onConfirm={runConfirm}
          onClose={() => setConfirm(null)}
        >
          {confirm.kind === 'delete' && <p>This removes the listing for good. {confirm.listing.bidCount > 0 ? `${confirm.listing.bidCount} pending ${confirm.listing.bidCount === 1 ? 'bid' : 'bids'} will be cancelled and the buyers told.` : ''}</p>}
          {confirm.kind === 'sold' && <p>Use this when you sold the harvest outside Bidding Farm. The listing leaves the marketplace.</p>}
          {confirm.kind === 'close' && <p>Buyers will no longer see this listing or place new bids. You can reopen it any time.</p>}
        </Confirm>
      )}
    </>
  );
}
