import React, { useState } from 'react';
import type { Vehicle, VehicleStatus } from '../types';

type Props = {
  initial?: Partial<Vehicle>;
  onSubmit: (values: Partial<Vehicle>) => Promise<void> | void;
  mode?: 'create' | 'edit';
};

const defaultValues: Partial<Vehicle> = {
  marca: '',
  modelo: '',
  anio: null,
  patente: '',
  precio_publicado: null,
  fecha_ingreso: new Date().toISOString().slice(0, 10),
  fecha_egreso: null,
  estado: 'en_stock',
  observaciones: '',
};

const VehicleForm: React.FC<Props> = ({ initial, onSubmit, mode = 'create' }) => {
  const [values, setValues] = useState<Partial<Vehicle>>({
    ...defaultValues,
    ...initial,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Vehicle, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Vehicle, value: string) => {
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
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          required
          placeholder="Marca"
          value={values.marca || ''}
          onChange={(e) => handleChange('marca', e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          required
          placeholder="Modelo"
          value={values.modelo || ''}
          onChange={(e) => handleChange('modelo', e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Patente"
          value={values.patente || ''}
          onChange={(e) => handleChange('patente', e.target.value)}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          placeholder="Año"
          value={values.anio ?? ''}
          onChange={(e) => handleNumberChange('anio', e.target.value)}
          style={{ width: 120 }}
        />
        <input
          type="number"
          placeholder="Precio publicado"
          value={values.precio_publicado ?? ''}
          onChange={(e) => handleNumberChange('precio_publicado', e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 12 }}>
          Fecha ingreso:
          <input
            type="date"
            required
            value={values.fecha_ingreso || ''}
            onChange={(e) => handleChange('fecha_ingreso', e.target.value)}
            style={{ marginLeft: 4 }}
          />
        </label>

        <label style={{ fontSize: 12 }}>
          Fecha egreso:
          <input
            type="date"
            value={values.fecha_egreso || ''}
            onChange={(e) => handleChange('fecha_egreso', e.target.value)}
            style={{ marginLeft: 4 }}
          />
        </label>

        <select
          value={values.estado || 'en_stock'}
          onChange={(e) => handleChange('estado', e.target.value as VehicleStatus)}
          style={{ padding: 6 }}
        >
          <option value="en_stock">En stock</option>
          <option value="vendido">Vendido</option>
          <option value="retirado">Retirado</option>
        </select>
      </div>

      <textarea
        placeholder="Observaciones"
        value={values.observaciones || ''}
        onChange={(e) => handleChange('observaciones', e.target.value)}
        style={{ minHeight: 60 }}
      />

      <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
        {loading ? 'Guardando...' : mode === 'create' ? 'Agregar auto' : 'Guardar cambios'}
      </button>
    </form>
  );
};

export default VehicleForm;
