import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Props = {
  vehicleId: string;
  onUploaded: () => void;
};

const DocumentUpload: React.FC<Props> = ({ vehicleId, onUploaded }) => {
  const [tipo, setTipo] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !tipo) return;

    setLoading(true);
    try {
      const fileName = `${vehicleId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('vehicle_docs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('vehicle_documents').insert({
        vehicle_id: vehicleId,
        tipo,
        file_path: fileName,
      });

      if (insertError) throw insertError;

      setTipo('');
      setFile(null);
      onUploaded();
    } catch (err) {
      console.error(err);
      alert('Error subiendo documento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        alignItems: 'center',
        marginTop: 4,
      }}
    >
      <input
        placeholder="Tipo de documento (Título, Cédula...)"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        style={{ flex: 1, minWidth: 200 }}
      />
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ maxWidth: 260, fontSize: 12 }}
      />
      <button type="submit" disabled={loading} className="btn-secondary">
        {loading ? 'Subiendo...' : 'Subir'}
      </button>
    </form>
  );
};

export default DocumentUpload;
