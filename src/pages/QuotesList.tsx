import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Quote, QuoteStatus } from '../types';
import QuoteForm from '../components/QuoteForm';

type StatusFilter = 'all' | QuoteStatus;

const QuotesList: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadQuotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error);
      alert('Error cargando presupuestos');
    } else {
      setQuotes((data || []) as Quote[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const handleCreateQuoteGlobal = async (values: Partial<Quote>) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('quotes').insert({
        vehicle_id: null,
        vehiculo_referencia: values.vehiculo_referencia || null,
        cliente_nombre: values.cliente_nombre,
        cliente_telefono: values.cliente_telefono,
        monto_presupuestado: values.monto_presupuestado,
        fecha_presupuesto: values.fecha_presupuesto,
        vendedor: values.vendedor,
        estado: values.estado || 'enviado',
        notas: values.notas,
      });

      if (error) {
        console.error(error);
        alert('Error guardando presupuesto');
        return;
      }

      await loadQuotes();
    } finally {
      setSaving(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    let list = quotes;

    if (statusFilter !== 'all') {
      list = list.filter((q) => q.estado === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((item) => {
        const cliente = item.cliente_nombre.toLowerCase();
        const ref = (item.vehiculo_referencia || '').toLowerCase();
        const vendedor = (item.vendedor || '').toLowerCase();
        return (
          cliente.includes(q) ||
          ref.includes(q) ||
          vendedor.includes(q)
        );
      });
    }

    return list;
  }, [quotes, statusFilter, searchTerm]);

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Presupuestos</h2>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Nuevo presupuesto</h3>

        <QuoteForm onSubmit={handleCreateQuoteGlobal} />

        {saving && (
          <div style={{ marginTop: 4, fontSize: 12, color: '#9ca3af' }}>
            Guardando presupuesto...
          </div>
        )}
      </div>

      <div className="filter-row">
        <span className="filter-label">Estado:</span>
        {(['all', 'enviado', 'aceptado', 'perdido'] as StatusFilter[]).map((v) => (
          <button
            key={v}
            type="button"
            className={`filter-chip ${statusFilter === v ? 'active' : ''}`}
            onClick={() => setStatusFilter(v)}
          >
            {v === 'all'
              ? 'Todos'
              : v === 'enviado'
              ? 'Enviados'
              : v === 'aceptado'
              ? 'Aceptados'
              : 'Perdidos'}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <input
          placeholder="Buscar por cliente, referencia o vendedor"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      {loading ? (
        <div>Cargando presupuestos...</div>
      ) : filteredQuotes.length === 0 ? (
        <div>No hay presupuestos con ese filtro.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Fecha</th>
              <th style={{ textAlign: 'left' }}>Cliente</th>
              <th style={{ textAlign: 'left' }}>Vehículo / referencia</th>
              <th style={{ textAlign: 'left' }}>Monto</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th style={{ textAlign: 'left' }}>Vendedor</th>
            </tr>
          </thead>
          <tbody>
            {filteredQuotes.map((q) => (
              <tr key={q.id}>
                <td>{new Date(q.fecha_presupuesto).toLocaleDateString('es-AR')}</td>
                <td>{q.cliente_nombre}</td>
                <td>{q.vehiculo_referencia || '—'}</td>
                <td>
                  {q.monto_presupuestado
                    ? `$ ${q.monto_presupuestado.toLocaleString('es-AR')}`
                    : '-'}
                </td>
                <td>{q.estado}</td>
                <td>{q.vendedor || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default QuotesList;
