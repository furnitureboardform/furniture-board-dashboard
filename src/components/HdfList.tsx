import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HdfOption } from '../lib/types';

interface Props {
  refreshKey: number;
}

export function HdfList({ refreshKey }: Props) {
  const [items, setItems] = useState<(HdfOption & { docId: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'hdf'), orderBy('createdAt')))
      .then(snap => {
        setItems(snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as HdfOption),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(docId: string) {
    if (!confirm('Usunąć tę płytę HDF?')) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, 'hdf', docId));
      setItems(prev => prev.filter(i => i.docId !== docId));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="loading">Ładowanie płyt HDF…</div>;
  if (items.length === 0) return <div className="empty">Brak płyt HDF. Dodaj pierwszą!</div>;

  return (
    <div className="list">
      <h2 className="list-title">Płyty HDF ({items.length})</h2>
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
