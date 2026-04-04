import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { FinishType } from '../lib/types';

const FINISH_TYPES: { value: FinishType; label: string }[] = [
  { value: 'okleina', label: 'Okleina' },
  { value: 'laminat', label: 'Laminat' },
  { value: 'akryl', label: 'Akryl' },
  { value: 'lakier', label: 'Lakier' },
];

interface Props {
  onSaved: () => void;
}

export function FinishForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [type, setType] = useState<FinishType>('okleina');
  const [price, setPrice] = useState('');
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const priceNum = parseFloat(price.replace(',', '.'));
    if (!label.trim()) { setError('Podaj nazwę okleiny.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (!imageBase64) { setError('Dodaj zdjęcie okleiny.'); return; }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'finishes'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        type,
        pricePerSqmPln: priceNum,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setType('okleina');
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
      <h2 className="form-title">Dodaj okleinę</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa okleiny *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Dąb Artisan"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Firma *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Pfleiderer"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Typ</label>
        <select
          className="field-input"
          value={type}
          onChange={e => setType(e.target.value as FinishType)}
        >
          {FINISH_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label className="field-label">Cena za m² (PLN) *</label>
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
        <input
          className="field-input"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />
        {imageBase64 && (
          <img src={imageBase64} alt="Podgląd" className="img-preview" />
        )}
      </div>

      <button className="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Zapisywanie…' : 'Zapisz okleinę'}
      </button>
    </form>
  );
}
