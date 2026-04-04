import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FinishOption, FinishType } from '../lib/types';

const TYPE_LABELS: Record<string, string> = {
  okleina: 'Okleina',
  laminat: 'Laminat',
  akryl: 'Akryl',
  lakier: 'Lakier',
};

const FINISH_TYPES: { value: FinishType; label: string }[] = [
  { value: 'laminat', label: 'Laminat' },
  { value: 'akryl', label: 'Akryl' },
  { value: 'lakier', label: 'Lakier' },
];

type Item = FinishOption & { docId: string };

interface Props {
  refreshKey: number;
}

export function FinishList({ refreshKey }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // edit form state
  const [editLabel, setEditLabel] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editType, setEditType] = useState<FinishType>('laminat');
  const [editPrice, setEditPrice] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

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

  function openEdit(item: Item) {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditBrand(item.brand);
    setEditType(item.type);
    setEditPrice(String(item.pricePerSqmPln));
    setEditImageBase64(item.imageBase64);
    setEditError('');
  }

  function closeEdit() {
    setEditingItem(null);
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingItem) return;
    setEditError('');

    const priceNum = parseFloat(editPrice.replace(',', '.'));
    if (!editLabel.trim()) { setEditError('Podaj nazwę okleiny.'); return; }
    if (!editBrand.trim()) { setEditError('Podaj nazwę firmy.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setEditError('Podaj prawidłową cenę.'); return; }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'finishes', editingItem.docId), {
        label: editLabel.trim(),
        brand: editBrand.trim(),
        type: editType,
        pricePerSqmPln: priceNum,
        imageBase64: editImageBase64 ?? null,
      });
      setItems(prev => prev.map(i =>
        i.docId === editingItem.docId
          ? { ...i, label: editLabel.trim(), brand: editBrand.trim(), type: editType, pricePerSqmPln: priceNum, imageBase64: editImageBase64 }
          : i
      ));
      closeEdit();
    } catch (err) {
      setEditError('Błąd zapisu. Spróbuj ponownie.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="loading">Ładowanie oklein…</div>;
  if (items.length === 0) return <div className="empty">Brak oklein. Dodaj pierwszą!</div>;

  return (
    <>
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
              <div className="item-actions">
                <button
                  className="btn-edit"
                  onClick={() => openEdit(item)}
                  title="Edytuj"
                >
                  ✎
                </button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(item.docId)}
                  disabled={deletingId === item.docId}
                  title="Usuń"
                >
                  {deletingId === item.docId ? '…' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingItem && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2 className="form-title">Edytuj okleinę</h2>
            {editError && <div className="error-msg">{editError}</div>}
            <form onSubmit={handleSave}>
              <div className="field">
                <label className="field-label">Nazwa okleiny *</label>
                <input className="field-input" type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Firma *</label>
                <input className="field-input" type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Typ</label>
                <select className="field-input" value={editType} onChange={e => setEditType(e.target.value as FinishType)}>
                  {FINISH_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Cena za m² (PLN) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Zdjęcie</label>
                <input className="field-input" type="file" accept="image/*" onChange={handleEditImageChange} />
                {editImageBase64 && <img src={editImageBase64} alt="Podgląd" className="img-preview" />}
              </div>
              <div className="modal-actions">
                <button className="btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
                <button className="btn-secondary" type="button" onClick={closeEdit}>
                  Anuluj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
