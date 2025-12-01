import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Vehicle } from '../types';
import MetricsBar from '../components/MetricsBar';
import VehicleForm from '../components/VehicleForm';

type StatusFilter = 'all' | 'en_stock' | 'vendido' | 'retirado';

function getDaysInStock(vehicle: Vehicle): number | null {
  if (!vehicle.fecha_ingreso) return null;
  const start = new Date(vehicle.fecha_ingreso);
  const end = vehicle.fecha_egreso ? new Date(vehicle.fecha_egreso) : new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

const VehiclesList: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('fecha_ingreso', { ascending: false });

    if (error) {
      console.error(error);
      alert('Error cargando autos');
    } else {
      setVehicles((data || []) as Vehicle[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleCreateVehicle = async (values: Partial<Vehicle>) => {
    const { error } = await supabase.from('vehicles').insert({
      marca: values.marca,
      modelo: values.modelo,
      patente: values.patente,
      anio: values.anio,
      precio_publicado: values.precio_publicado,
      fecha_ingreso: values.fecha_ingreso,
      fecha_egreso: values.fecha_egreso || null,
      estado: values.estado || 'en_stock',
      observaciones: values.observaciones,
    });

    if (error) {
      console.error(error);
      alert('Error guardando auto');
      return;
    }

    setShowForm(false);
    await loadVehicles();
  };

  const handleMarkSoldToday = async (vehicleId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('vehicles')
      .update({ estado: 'vendido', fecha_egreso: today })
      .eq('id', vehicleId);

    if (error) {
      console.error(error);
      alert('Error marcando como vendido');
      return;
    }

    await loadVehicles();
  };

  const filteredVehicles = useMemo(() => {
    let list = vehicles;

    if (statusFilter !== 'all') {
      list = list.filter((v) => v.estado === statusFilter);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((v) => {
        const patente = (v.patente || '').toLowerCase();
        const marca = v.marca.toLowerCase();
        const modelo = v.modelo.toLowerCase();
        return patente.includes(q) || marca.includes(q) || modelo.includes(q);
      });
    }

    return list;
  }, [vehicles, statusFilter, searchTerm]);

  const renderStatusLabel = (status: Vehicle['estado']) => {
    switch (status) {
      case 'en_stock':
        return 'En stock';
      case 'vendido':
        return 'Vendido';
      case 'retirado':
        return 'Retirado';
      default:
        return status;
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>Autos</h2>

      <MetricsBar vehicles={vehicles} />

      <div className="filter-row">
        <span className="filter-label">Filtrar por estado:</span>
        {(['all', 'en_stock', 'vendido', 'retirado'] as StatusFilter[]).map((v) => (
          <button
            key={v}
            type="button"
            className={`filter-chip ${statusFilter === v ? 'active' : ''}`}
            onClick={() => setStatusFilter(v)}
          >
            {v === 'all'
              ? 'Todos'
              : v === 'en_stock'
              ? 'En stock'
              : v === 'vendido'
              ? 'Vendidos'
              : 'Retirados'}
          </button>
        ))}

        <div style={{ flex: 1 }} />

        <input
          placeholder="Buscar por patente, marca o modelo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: 260 }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setShowForm((prev) => !prev)}
          className="btn-primary"
        >
          {showForm ? 'Cerrar formulario' : '+ Nuevo auto'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <VehicleForm onSubmit={handleCreateVehicle} mode="create" />
        </div>
      )}

      {loading ? (
        <div>Cargando autos...</div>
      ) : filteredVehicles.length === 0 ? (
        <div>No hay autos con ese filtro.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Patente</th>
              <th style={{ textAlign: 'left' }}>Marca / Modelo</th>
              <th style={{ textAlign: 'left' }}>Año</th>
              <th style={{ textAlign: 'left' }}>Precio</th>
              <th style={{ textAlign: 'left' }}>Estado</th>
              <th style={{ textAlign: 'left' }}>Ingreso</th>
              <th style={{ textAlign: 'left' }}>Egreso</th>
              <th style={{ textAlign: 'left' }}>Días en venta</th>
              <th style={{ textAlign: 'left' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((v) => {
              const days = getDaysInStock(v);
              return (
                <tr key={v.id}>
                  <td>{v.patente || '-'}</td>
                  <td>
                    {v.marca} {v.modelo}
                  </td>
                  <td>{v.anio || '-'}</td>
                  <td>
                    {v.precio_publicado
                      ? `$ ${v.precio_publicado.toLocaleString('es-AR')}`
                      : '-'}
                  </td>
                  <td>{renderStatusLabel(v.estado)}</td>
                  <td>{v.fecha_ingreso}</td>
                  <td>{v.fecha_egreso || '-'}</td>
                  <td>{days !== null ? `${days} d` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Link to={`/vehicles/${v.id}`} style={{ fontSize: 13 }}>
                        Ver detalle
                      </Link>
                      {v.estado === 'en_stock' && (
                        <button
                          type="button"
                          onClick={() => handleMarkSoldToday(v.id)}
                          className="btn-secondary"
                          style={{ fontSize: 11, padding: '4px 8px' }}
                        >
                          Marcar vendido hoy
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default VehiclesList;
