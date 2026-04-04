import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { HandleOption } from '../lib/types';

type Item = HandleOption & { docId: string };

interface Props {
  refreshKey: number;
}

export function HandleList({ refreshKey }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // edit form state
  const [editLabel, setEditLabel] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editIsEdge, setEditIsEdge] = useState(false);
  const [editEdgeWidthMm, setEditEdgeWidthMm] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

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

  function openEdit(item: Item) {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditBrand(item.brand);
    setEditPrice(String(item.pricePln));
    setEditIsEdge(item.isEdge ?? false);
    setEditEdgeWidthMm(item.edgeWidthMm ? String(item.edgeWidthMm) : '');
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
    if (!editLabel.trim()) { setEditError('Podaj nazwę uchwytu.'); return; }
    if (!editBrand.trim()) { setEditError('Podaj nazwę firmy.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setEditError('Podaj prawidłową cenę.'); return; }
    if (editIsEdge) {
      const w = parseFloat(editEdgeWidthMm.replace(',', '.'));
      if (isNaN(w) || w <= 0) { setEditError('Podaj szerokość frezowania.'); return; }
    }

    const edgeWidth = editIsEdge ? parseFloat(editEdgeWidthMm.replace(',', '.')) : 0;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'handles', editingItem.docId), {
        label: editLabel.trim(),
        brand: editBrand.trim(),
        pricePln: priceNum,
        isEdge: editIsEdge,
        edgeWidthMm: edgeWidth,
        imageBase64: editImageBase64 ?? null,
      });
      setItems(prev => prev.map(i =>
        i.docId === editingItem.docId
          ? { ...i, label: editLabel.trim(), brand: editBrand.trim(), pricePln: priceNum, isEdge: editIsEdge, edgeWidthMm: edgeWidth, imageBase64: editImageBase64 }
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

  if (loading) return <div className="loading">Ładowanie uchwytów…</div>;
  if (items.length === 0) return <div className="empty">Brak uchwytów. Dodaj pierwszy!</div>;

  return (
    <>
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
            <h2 className="form-title">Edytuj uchwyt</h2>
            {editError && <div className="error-msg">{editError}</div>}
            <form onSubmit={handleSave}>
              <div className="field">
                <label className="field-label">Nazwa uchwytu *</label>
                <input className="field-input" type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Firma *</label>
                <input className="field-input" type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Cena (PLN/szt.) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div className="field field-row">
                <input
                  id="editIsEdge"
                  type="checkbox"
                  checked={editIsEdge}
                  onChange={e => setEditIsEdge(e.target.checked)}
                  className="checkbox"
                />
                <label htmlFor="editIsEdge" className="field-label-inline">Uchwyt krawędziowy (frezowany)</label>
              </div>
              {editIsEdge && (
                <div className="field">
                  <label className="field-label">Szerokość frezowania (mm)</label>
                  <input className="field-input" type="text" inputMode="decimal" value={editEdgeWidthMm} onChange={e => setEditEdgeWidthMm(e.target.value)} />
                </div>
              )}
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
