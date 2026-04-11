import { useRef, useState } from 'react';

interface Props {
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FileInput({ accept = 'image/*', onChange }: Props) {
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileName(e.target.files?.[0]?.name ?? '');
    onChange(e);
  }

  return (
    <div className="file-input-wrapper">
      <button type="button" className="btn-secondary file-input-btn" onClick={() => inputRef.current?.click()}>
        Wybierz plik
      </button>
      <span className="file-input-text">{fileName || 'Nie wybrano pliku'}</span>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} hidden />
    </div>
  );
}
