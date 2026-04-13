import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { CargoOption, CargoType } from '../lib/types';
import { FileInput } from './FileInput';

type Item = CargoOption & { docId: string };

interface Props {
  refreshKey: number;
}

export function CargoList({ refreshKey }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [editLabel, setEditLabel] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editType, setEditType] = useState<CargoType>('niskie');
  const [editHeightFrom, setEditHeightFrom] = useState('');
  const [editHeightTo, setEditHeightTo] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editDepth, setEditDepth] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editImageBase64, setEditImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    setLoading(true);
    getDocs(query(collection(db, 'cargo'), orderBy('createdAt')))
      .then(snap => {
        setItems(snap.docs.map(d => ({
          docId: d.id,
          ...(d.data() as CargoOption),
        })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  async function handleDelete(docId: string) {
    if (!confirm('Usunąć to cargo?')) return;
    setDeletingId(docId);
    try {
      await deleteDoc(doc(db, 'cargo', docId));
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
    setEditHeightFrom(String(item.heightFromMm));
    setEditHeightTo(String(item.heightToMm));
    setEditWidth(String(item.widthMm));
    setEditDepth(String(item.depthMm));
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

    const heightFromNum = parseFloat(editHeightFrom.replace(',', '.'));
    const heightToNum = parseFloat(editHeightTo.replace(',', '.'));
    const widthNum = parseFloat(editWidth.replace(',', '.'));
    const depthNum = parseFloat(editDepth.replace(',', '.'));
    const priceNum = parseFloat(editPrice.replace(',', '.'));

    if (!editLabel.trim()) { setEditError('Podaj nazwę cargo.'); return; }
    if (!editBrand.trim()) { setEditError('Podaj nazwę firmy.'); return; }
    if (isNaN(heightFromNum) || heightFromNum <= 0) { setEditError('Podaj prawidłową wysokość od.'); return; }
    if (isNaN(heightToNum) || heightToNum <= 0) { setEditError('Podaj prawidłową wysokość do.'); return; }
    if (isNaN(widthNum) || widthNum <= 0) { setEditError('Podaj prawidłową szerokość.'); return; }
    if (isNaN(depthNum) || depthNum <= 0) { setEditError('Podaj prawidłową głębokość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setEditError('Podaj prawidłową cenę.'); return; }
    if (!editImageBase64) { setEditError('Dodaj zdjęcie cargo.'); return; }

    setSaving(true);
    try {
      await updateDoc(doc(db, 'cargo', editingItem.docId), {
        label: editLabel.trim(),
        brand: editBrand.trim(),
        type: editType,
        heightFromMm: heightFromNum,
        heightToMm: heightToNum,
        widthMm: widthNum,
        depthMm: depthNum,
        pricePln: priceNum,
        imageBase64: editImageBase64 ?? null,
      });
      setItems(prev => prev.map(i =>
        i.docId === editingItem.docId
          ? { ...i, label: editLabel.trim(), brand: editBrand.trim(), type: editType, heightFromMm: heightFromNum, heightToMm: heightToNum, widthMm: widthNum, depthMm: depthNum, pricePln: priceNum, imageBase64: editImageBase64 }
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

  if (loading) return <div className="loading">Ładowanie cargo…</div>;
  if (items.length === 0) return <div className="empty">Brak cargo. Dodaj pierwsze!</div>;

  return (
    <>
      <div className="list">
        <h2 className="list-title">Cargo ({items.length})</h2>
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
                  <span className="badge">{item.heightFromMm}-{item.heightToMm}×{item.widthMm}×{item.depthMm} mm</span>
                  <span className="item-price">{item.pricePln?.toFixed(2)} PLN</span>
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
            <h2 className="form-title">Edytuj cargo</h2>
            {editError && <div className="error-msg">{editError}</div>}
            <form onSubmit={handleSave}>
              <div className="field">
                <label className="field-label">Nazwa *</label>
                <input className="field-input" type="text" value={editLabel} onChange={e => setEditLabel(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Firma *</label>
                <input className="field-input" type="text" value={editBrand} onChange={e => setEditBrand(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Typ *</label>
                <select className="field-input" value={editType} onChange={e => setEditType(e.target.value as CargoType)}>
                  <option value="niskie">Niskie</option>
                  <option value="wysokie">Wysokie</option>
                </select>
              </div>
              <div className="field">
                <label className="field-label">Wysokość Od (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editHeightFrom} onChange={e => setEditHeightFrom(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Wysokość Do (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editHeightTo} onChange={e => setEditHeightTo(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Szerokość (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editWidth} onChange={e => setEditWidth(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Głębokość (mm) *</label>
                <input className="field-input" type="text" inputMode="decimal" value={editDepth} onChange={e => setEditDepth(e.target.value)} />
              </div>
              <div className="field">
                <label className="field-label">Cena (PLN) *</label>
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
