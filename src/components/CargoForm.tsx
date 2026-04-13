import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileInput } from './FileInput';
import type { CargoType } from '../lib/types';

interface Props {
  onSaved: () => void;
}

export function CargoForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<CargoType>('niskie');
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');
  const [depth, setDepth] = useState('');
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

    const heightNum = parseFloat(height.replace(',', '.'));
    const widthNum = parseFloat(width.replace(',', '.'));
    const depthNum = parseFloat(depth.replace(',', '.'));
    const priceNum = parseFloat(price.replace(',', '.'));

    if (!label.trim()) { setError('Podaj nazwę cargo.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (isNaN(heightNum) || heightNum <= 0) { setError('Podaj prawidłową wysokość.'); return; }
    if (isNaN(widthNum) || widthNum <= 0) { setError('Podaj prawidłową szerokość.'); return; }
    if (isNaN(depthNum) || depthNum <= 0) { setError('Podaj prawidłową głębokość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (!imageBase64) { setError('Dodaj zdjęcie cargo.'); return; }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'cargo'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        type,
        heightMm: heightNum,
        widthMm: widthNum,
        depthMm: depthNum,
        pricePln: priceNum,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setType('niskie');
      setHeight('');
      setWidth('');
      setDepth('');
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
      <h2 className="form-title">Dodaj cargo</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Cargo Classic"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Firma *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Häfele"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Typ *</label>
        <select
          className="field-input"
          value={type}
          onChange={e => setType(e.target.value as CargoType)}
        >
          <option value="niskie">Niskie</option>
          <option value="wysokie">Wysokie</option>
        </select>
      </div>

      <div className="field">
        <label className="field-label">Wysokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 500"
          value={height}
          onChange={e => setHeight(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Szerokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 300"
          value={width}
          onChange={e => setWidth(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Głębokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 450"
          value={depth}
          onChange={e => setDepth(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Cena (PLN) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 350.00"
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
        {saving ? 'Zapisywanie…' : 'Zapisz cargo'}
      </button>
    </form>
  );
}
