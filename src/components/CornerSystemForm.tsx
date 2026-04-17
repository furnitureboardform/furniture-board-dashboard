import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileInput } from './FileInput';
import type { CornerSystemType, CornerSystemModelType } from '../lib/types';

export const CORNER_SYSTEM_TYPE_OPTIONS: { value: CornerSystemType; label: string }[] = [
  { value: 'prawy', label: 'Prawy' },
  { value: 'lewy', label: 'Lewy' },
  { value: 'dwustronny', label: 'Dwustronny' },
];

export const CORNER_SYSTEM_MODEL_OPTIONS: { value: CornerSystemModelType; label: string }[] = [
  { value: 'nerka', label: 'Nerka' },
  { value: 'obrotowy', label: 'Obrotowy' },
  { value: 'wysuwany', label: 'Wysuwany' },
];

interface Props {
  onSaved: () => void;
}

export function CornerSystemForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<CornerSystemType>('prawy');
  const [modelType, setModelType] = useState<CornerSystemModelType>('nerka');
  const [heightFrom, setHeightFrom] = useState('');
  const [heightTo, setHeightTo] = useState('');
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
    let cancelled = false;
    reader.onload = () => { if (!cancelled) setImageBase64(reader.result as string); };
    reader.readAsDataURL(file);
    return () => { cancelled = true; };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const heightFromNum = parseFloat(heightFrom.replace(',', '.'));
    const heightToNum = parseFloat(heightTo.replace(',', '.'));
    const widthNum = parseFloat(width.replace(',', '.'));
    const depthNum = parseFloat(depth.replace(',', '.'));
    const priceNum = parseFloat(price.replace(',', '.'));

    if (!label.trim()) { setError('Podaj nazwę systemu narożnego.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (isNaN(heightFromNum) || heightFromNum <= 0) { setError('Podaj prawidłową wysokość od.'); return; }
    if (isNaN(heightToNum) || heightToNum <= 0) { setError('Podaj prawidłową wysokość do.'); return; }
    if (isNaN(widthNum) || widthNum <= 0) { setError('Podaj prawidłową szerokość.'); return; }
    if (isNaN(depthNum) || depthNum <= 0) { setError('Podaj prawidłową głębokość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (!imageBase64) { setError('Dodaj zdjęcie systemu narożnego.'); return; }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'cornerSystems'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        type,
        modelType,
        heightFromMm: heightFromNum,
        heightToMm: heightToNum,
        widthMm: widthNum,
        depthMm: depthNum,
        pricePln: priceNum,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setType('prawy');
      setModelType('nerka');
      setHeightFrom('');
      setHeightTo('');
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
      <h2 className="form-title">Dodaj system narożny</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Magic Corner"
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
        <label className="field-label">Wysuwanie systemu *</label>
        <select
          className="field-input"
          value={type}
          onChange={e => setType(e.target.value as CornerSystemType)}
        >
          {CORNER_SYSTEM_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label">Typ modelu *</label>
        <select
          className="field-input"
          value={modelType}
          onChange={e => setModelType(e.target.value as CornerSystemModelType)}
        >
          {CORNER_SYSTEM_MODEL_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label">Wysokość Od (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 300"
          value={heightFrom}
          onChange={e => setHeightFrom(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Wysokość Do (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 800"
          value={heightTo}
          onChange={e => setHeightTo(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Szerokość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 600"
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
          placeholder="np. 450.00"
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
        {saving ? 'Zapisywanie…' : 'Zapisz system narożny'}
      </button>
    </form>
  );
}
