import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Props {
  onSaved: () => void;
}

export function HandleForm({ onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [isEdge, setIsEdge] = useState(false);
  const [edgeWidthMm, setEdgeWidthMm] = useState('');
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
    if (!label.trim()) { setError('Podaj nazwę uchwytu.'); return; }
    if (!brand.trim()) { setError('Podaj nazwę firmy.'); return; }
    if (isNaN(priceNum) || priceNum <= 0) { setError('Podaj prawidłową cenę.'); return; }
    if (isEdge) {
      const w = parseFloat(edgeWidthMm.replace(',', '.'));
      if (isNaN(w) || w <= 0) { setError('Podaj szerokość frezowania dla uchwytu krawędziowego.'); return; }
    }

    setSaving(true);
    try {
      const id = `${label.trim().toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      await addDoc(collection(db, 'handles'), {
        id,
        label: label.trim(),
        brand: brand.trim(),
        pricePln: priceNum,
        isEdge,
        edgeWidthMm: isEdge ? parseFloat(edgeWidthMm.replace(',', '.')) : 0,
        imageBase64: imageBase64 ?? null,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setBrand('');
      setPrice('');
      setIsEdge(false);
      setEdgeWidthMm('');
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
      <h2 className="form-title">Dodaj uchwyt</h2>

      {error && <div className="error-msg">{error}</div>}

      <div className="field">
        <label className="field-label">Nazwa uchwytu *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Uchwyt aluminiowy 160mm"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Firma *</label>
        <input
          className="field-input"
          type="text"
          placeholder="np. Hafele"
          value={brand}
          onChange={e => setBrand(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="field-label">Cena (PLN/szt.) *</label>
        <input
          className="field-input"
          type="text"
          inputMode="decimal"
          placeholder="np. 25.00"
          value={price}
          onChange={e => setPrice(e.target.value)}
        />
      </div>

      <div className="field field-row">
        <input
          id="isEdge"
          type="checkbox"
          checked={isEdge}
          onChange={e => setIsEdge(e.target.checked)}
          className="checkbox"
        />
        <label htmlFor="isEdge" className="field-label-inline">Uchwyt krawędziowy (frezowany)</label>
      </div>

      {isEdge && (
        <div className="field">
          <label className="field-label">Szerokość frezowania (mm)</label>
          <input
            className="field-input"
            type="text"
            inputMode="decimal"
            placeholder="np. 19"
            value={edgeWidthMm}
            onChange={e => setEdgeWidthMm(e.target.value)}
          />
        </div>
      )}

      <div className="field">
        <label className="field-label">Zdjęcie (opcjonalne)</label>
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
        {saving ? 'Zapisywanie…' : 'Zapisz uchwyt'}
      </button>
    </form>
  );
}
