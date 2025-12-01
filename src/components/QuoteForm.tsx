import React, { useState } from 'react';
import type { Quote, QuoteStatus } from '../types';

type Props = {
  initial?: Partial<Quote>;
  onSubmit: (values: Partial<Quote>) => Promise<void> | void;
};

const QuoteForm: React.FC<Props> = ({ initial, onSubmit }) => {
  const [values, setValues] = useState<Partial<Quote>>({
    vehiculo_referencia: '',
    cliente_nombre: '',
    cliente_telefono: '',
    monto_presupuestado: null,
    fecha_presupuesto: new Date().toISOString().slice(0, 10),
    vendedor: '',
    estado: 'enviado',
    notas: '',
    ...initial,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Quote, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Quote, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: value ? Number(value) : null,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
      <input
        placeholder="Vehículo / referencia (texto libre)"
        value={values.vehiculo_referencia || ''}
        onChange={(e) => handleChange('vehiculo_referencia', e.target.value)}
      />

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          required
          placeholder="Nombre del cliente"
          value={values.cliente_nombre || ''}
          onChange={(e) => handleChange('cliente_nombre', e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          placeholder="Teléfono"
          value={values.cliente_telefono || ''}
          onChange={(e) => handleChange('cliente_telefono', e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="number"
          placeholder="Monto presupuestado"
          value={values.monto_presupuestado ?? ''}
          onChange={(e) => handleNumberChange('monto_presupuestado', e.target.value)}
          style={{ flex: 1 }}
        />
        <label style={{ fontSize: 12 }}>
          Fecha:
          <input
            type="date"
            value={values.fecha_presupuesto || ''}
            onChange={(e) => handleChange('fecha_presupuesto', e.target.value)}
            style={{ marginLeft: 4 }}
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Vendedor"
          value={values.vendedor || ''}
          onChange={(e) => handleChange('vendedor', e.target.value)}
          style={{ flex: 1 }}
        />
        <select
          value={values.estado || 'enviado'}
          onChange={(e) => handleChange('estado', e.target.value as QuoteStatus)}
          style={{ padding: 6 }}
        >
          <option value="enviado">Enviado</option>
          <option value="aceptado">Aceptado</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>

      <textarea
        placeholder="Notas"
        value={values.notas || ''}
        onChange={(e) => handleChange('notas', e.target.value)}
        style={{ minHeight: 60 }}
      />

      <button type="submit" disabled={loading} className="btn-secondary" style={{ marginTop: 4 }}>
        {loading ? 'Guardando...' : 'Guardar presupuesto'}
      </button>
    </form>
  );
};

export default QuoteForm;
