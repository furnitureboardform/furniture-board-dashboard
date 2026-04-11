import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileInput } from './FileInput';

interface Props {
  onSaved: () => void;
}

export function DrawerForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [depth, setDepth] = useState('');
  const [height, setHeight] = useState('');
  const [price, setPrice] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(price.replace(',', '.'));
    const depthNum = parseFloat(depth.replace(',', '.'));
    const heightNum = parseFloat(height.replace(',', '.'));
    if (!label.trim()) { setError('Podaj nazwę szuflady.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (!type.trim()) { setError('Podaj typ szuflady.'); return; }
    if (isNaN(depthNum) || depthNum <= 0) { setError('Podaj prawidłową głębokość.'); return; }
    if (isNaN(heightNum) || heightNum <= 0) { setError('Podaj prawidłową wysokość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (!imageBase64) { setError('Dodaj zdjęcie szuflady.'); return; }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'drawers'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        type: type.trim(),
        depthMm: depthNum,
        heightMm: heightNum,
        pricePln: priceNum,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setType('');
      setDepth('');
      setHeight('');
      setPrice('');
      setImageBase64(undefined);
      onSaved();
    } catch (err) {
      setError('Błąd zapisu. Spróbuj ponownie.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2 className="form-title">Dodaj szufladę</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa szuflady *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Szuflada cicha domykania"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Firma *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Blum"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Typ *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Tandembox"
          value={type}
          onChange={e => setType(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Głębokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 500"
          value={depth}
          onChange={e => setDepth(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Wysokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 83"
          value={height}
          onChange={e => setHeight(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Cena (PLN/szt.) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 120.00"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Zdjęcie *</label>
        <FileInput onChange={handleImageChange} />
        {imageBase64 && (
          <img src={imageBase64} alt="Podgląd" className="img-preview" />
        )}
      </div>

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Zapisywanie…' : 'Zapisz szufladę'}
      </button>
    </form>
  );
}
