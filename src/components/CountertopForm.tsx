import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FileInput } from './FileInput';

interface Props {
  onSaved: () => void;
}

export function CountertopForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [thickness, setThickness] = useState('');
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
    const thicknessNum = parseFloat(thickness.replace(',', '.'));
    if (!label.trim()) { setError('Podaj nazwę blatu.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (isNaN(thicknessNum) || thicknessNum <= 0) { setError('Podaj prawidłową grubość.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (!imageBase64) { setError('Dodaj zdjęcie blatu.'); return; }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'countertops'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        thicknessMm: thicknessNum,
        pricePerSqmPln: priceNum,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setThickness('');
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
      <h2 className="form-title">Dodaj blat kuchenny</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Blat dębowy"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Firma *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Kronospan"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Grubość (mm) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 38"
          value={thickness}
          onChange={e => setThickness(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Cena (PLN/m²) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 250.00"
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
        {saving ? 'Zapisywanie…' : 'Zapisz blat'}
      </button>
    </form>
  );
}
