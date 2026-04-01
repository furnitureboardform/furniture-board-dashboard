import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FinishOption } from '../lib/types';

const TYPE_LABELS: Record<string, string> = {
  okleina: 'Okleina',
  laminat: 'Laminat',
  akryl: 'Akryl',
  lakier: 'Lakier',
};

interface Props {
  refreshKey: number;
}

export function FinishList({ refreshKey }: Props) {
  const [items, setItems] = useState<(FinishOption & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'finishes'), orderBy('createdAt')))
      .then(snap => {
        setItems(snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as FinishOption),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(docId: string) {
    if (!confirm('Usunąć tę okleinę?')) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, 'finishes', docId));
      setItems(prev => prev.filter(i => i.docId !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="loading">Ładowanie oklein…</div>;
  if (items.length === 0) return <div className="empty">Brak oklein. Dodaj pierwszą!</div>;

  return (
    <div className="list">
      <h2 className="list-title">Okleiny ({items.length})</h2>
      <div className="cards-grid">
        {items.map(item => (
          <div key={item.docId} className="item-card">
            {item.imageBase64 ? (
              <img src={item.imageBase64} alt={item.label} className="item-img" />
            ) : (
              <div className="item-img-placeholder">Brak zdjęcia</div>
            )}
            <div className="item-body">
              <div className="item-name">{item.label}</div>
              <div className="item-brand">{item.brand}</div>
              <div className="item-meta">
                <span className="badge">{TYPE_LABELS[item.type] ?? item.type}</span>
                <span className="item-price">{item.pricePerSqmPln?.toFixed(2)} PLN/m²</span>
              </div>
            </div>
            <button
              className="btn-delete"
              onClick={() => handleDelete(item.docId)}
              disabled={deletingId === item.docId}
              title="Usuń"
            >
              {deletingId === item.docId ? '…' : '✕'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
