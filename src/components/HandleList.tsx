import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HandleOption } from '../lib/types';

interface Props {
  refreshKey: number;
}

export function HandleList({ refreshKey }: Props) {
  const [items, setItems] = useState<(HandleOption & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'handles'), orderBy('createdAt')))
      .then(snap => {
        setItems(snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as HandleOption),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(docId: string) {
    if (!confirm('Usunąć ten uchwyt?')) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, 'handles', docId));
      setItems(prev => prev.filter(i => i.docId !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="loading">Ładowanie uchwytów…</div>;
  if (items.length === 0) return <div className="empty">Brak uchwytów. Dodaj pierwszy!</div>;

  return (
    <div className="list">
      <h2 className="list-title">Uchwyty ({items.length})</h2>
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
                {item.isEdge && (
                  <span className="badge badge-edge">Krawędziowy {item.edgeWidthMm}mm</span>
                )}
                <span className="item-price">{item.pricePln?.toFixed(2)} PLN/szt.</span>
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
