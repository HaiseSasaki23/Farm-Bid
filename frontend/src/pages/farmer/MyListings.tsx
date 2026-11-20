import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Sprout } from 'lucide-react';
import { harvestService } from '../../api';
import { useQuery } from '../../hooks/useQuery';
import { useToast } from '../../context/ToastContext';
import type { ListingInput, ListingStatus, ListingView } from '../../types';
import { ListingForm } from '../../components/ListingForm';
import { FarmerListingCard } from '../../components/FarmerListingCard';
import { Confirm, Empty, ErrorBanner, Loading, Modal, PageHeader } from '../../components/ui';

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
        <Loading variant="cards" />
      ) : shown.length === 0 ? (
        <div className="card">
          <Empty icon={<Sprout size={24} />} title={filter === 'All' ? 'No listings yet' : `No ${filter.toLowerCase()} listings`}>
            {filter === 'All' ? 'Add the crop, quantity and a starting price to start receiving bids.' : 'Change the filter to see your other listings.'}
          </Empty>
        </div>
      ) : (
        <div className="grid-3">
          {shown.map((l) => (
            <FarmerListingCard
              key={l.harvestId}
              listing={l}
              actions={{
                onEdit: () => { setFormError(null); setForm({ mode: 'edit', listing: l }); },
                onClose: () => setConfirm({ kind: 'close', listing: l }),
                onReopen: () => act(() => harvestService.setStatus(l.harvestId, 'Available'), 'Listing is open for bids again.'),
                onSold: () => setConfirm({ kind: 'sold', listing: l }),
                onDelete: () => setConfirm({ kind: 'delete', listing: l }),
              }}
            />
          ))}
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
          {confirm.kind === 'sold' && <p>Use this when you sold the harvest outside FarmBid. The listing leaves the marketplace.</p>}
          {confirm.kind === 'close' && <p>Buyers will no longer see this listing or place new bids. You can reopen it any time.</p>}
        </Confirm>
      )}
    </>
  );
}