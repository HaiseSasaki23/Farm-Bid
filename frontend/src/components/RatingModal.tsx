import { useState } from 'react';
import { transactionService } from '../api';
import { useToast } from '../context/ToastContext';
import type { TransactionView } from '../types';
import { ErrorBanner, Modal, Stars } from './ui';

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** Buyer rates the farmer after a completed sale. One rating per transaction. */
export function RatingModal({ tx, onClose }: { tx: TransactionView; onClose: () => void }) {
  const toast = useToast();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (stars < 1) {
      setError('Choose 1 to 5 stars.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await transactionService.rate(tx.transactionId, { stars, comment });
      toast('Thanks! Your rating was sent.');
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your rating.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Rate this farmer"
      narrow
      onClose={onClose}
      footer={
        <>
          <button className="btn secondary" onClick={onClose} disabled={busy}>Not now</button>
          <button className="btn primary" onClick={submit} disabled={busy}>
            {busy && <span className="spinner" />} Send rating
          </button>
        </>
      }
    >
      <div className="stack">
        {error && <ErrorBanner message={error} />}
        <p>
          How was your {tx.listing?.cropName} purchase from <strong>{tx.farmer.farmName ?? tx.farmer.fullName}</strong>? Rate the harvest as described, the packing and the hand-over.
        </p>
        <div>
          <Stars value={stars} onChange={setStars} large />
          <div className="small muted" style={{ minHeight: 22, marginTop: 4 }} aria-live="polite">{WORDS[stars]}</div>
        </div>
        <div className="field">
          <label htmlFor="rc">Comment (optional)</label>
          <textarea id="rc" className="textarea" maxLength={300} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What went well, or what could be better?" />
          <span className="hint">You can rate once per purchase and cannot change it later.</span>
        </div>
      </div>
    </Modal>
  );
}