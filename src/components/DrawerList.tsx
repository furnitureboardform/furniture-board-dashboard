import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { DrawerOption } from '../lib/types';
import { FileInput } from './FileInput';

type Item = DrawerOption & { docId: string };

interface Props {
  refreshKey: number;
}

export function DrawerList({ refreshKey }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [editLabel, setEditLabel] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editType, setEditType] = useState('');
  const [editDepth, setEditDepth] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'drawers'), orderBy('createdAt')))
      .then(snap => {
        setItems(snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as DrawerOption),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(docId: string) {
    if (!confirm('Usunąć tę szufladę?')) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, 'drawers', docId));
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
    setEditDepth(String(item.depthMm));
    setEditHeight(String(item.heightMm));
    setEditPrice(String(item.pricePln));
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
    const depthNum = parseFloat(editDepth.replace(',', '.'));
    const heightNum = parseFloat(editHeight.replace(',', '.'));
    if (!editLabel.trim()) { setEditError('Podaj nazwę szuflady.'); return; }
    if (!editBrand.trim()) { setEditError('Podaj nazwę firmy.'); return; }
    if (!editType.trim()) { setEditError('Podaj typ szuflady.'); return; }
    if (isNaN(depthNum) || depthNum <= 0) { setEditError('Podaj prawidłową głębokość.'); return; }
    if (isNaN(heightNum) || heightNum <= 0) { setEditError('Podaj prawidłową wysokość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setEditError('Podaj prawidłową cenę.'); return; }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'drawers', editingItem.docId), {
        label: editLabel.trim(),
        brand: editBrand.trim(),
        type: editType.trim(),
        depthMm: depthNum,
        heightMm: heightNum,
        pricePln: priceNum,
        imageBase64: editImageBase64 ?? null,
      });
      setItems(prev => prev.map(i =>
        i.docId === editingItem.docId
          ? { ...i, label: editLabel.trim(), brand: editBrand.trim(), type: editType.trim(), depthMm: depthNum, heightMm: heightNum, pricePln: priceNum, imageBase64: editImageBase64 }
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

  if (loading) return <div className="loading">Ładowanie szuflad…</div>;
  if (items.length === 0) return <div className="empty">Brak szuflad. Dodaj pierwszą!</div>;

  return (
    <>
      <div className="list">
        <h2 className="list-title">Szuflady ({items.length})</h2>
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
                  <span className="badge">{item.type}</span>
                  <span className="badge">{item.depthMm}×{item.heightMm} mm</span>
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
            <h2 className="form-title">Edytuj szufladę</h2>
            {editError && <div className="error-msg">{editError}</div>}
            <form onSubmit={handleSave}>
              <div className="field">
                <label className="field-label">Nazwa szuflady *</label>
                <input className="field-input" type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Firma *</label>
                <input className="field-input" type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Typ *</label>
                <input className="field-input" type="text" value={editType} onChange={e => setEditType(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Głębokość (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editDepth} onChange={e => setEditDepth(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Wysokość (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editHeight} onChange={e => setEditHeight(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Cena (PLN/szt.) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editPrice} onChange={e => setEditPrice(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Zdjęcie</label>
                <FileInput onChange={handleEditImageChange} />
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
