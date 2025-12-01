import React from 'react';
import type { Vehicle } from '../types';

type Props = {
  vehicles: Vehicle[];
};

function getDaysInStock(vehicle: Vehicle): number | null {
  if (!vehicle.fecha_ingreso) return null;
  const start = new Date(vehicle.fecha_ingreso);
  const end = vehicle.fecha_egreso ? new Date(vehicle.fecha_egreso) : new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

const MetricsBar: React.FC<Props> = ({ vehicles }) => {
  if (!vehicles.length) return null;

  const sold = vehicles.filter((v) => v.estado === 'vendido' && v.fecha_egreso);
  const daysSold = sold
    .map(getDaysInStock)
    .filter((d): d is number => d !== null);

  const avgDays =
    daysSold.length > 0
      ? Math.round(daysSold.reduce((a, b) => a + b, 0) / daysSold.length)
      : null;

  const inStock = vehicles.filter((v) => v.estado === 'en_stock');

  return (
    <div className="card" style={{ marginBottom: 16, display: 'flex', gap: 24, fontSize: 14 }}>
      <div>
        <div style={{ fontWeight: 600 }}>Autos en stock</div>
        <div>{inStock.length}</div>
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>Autos vendidos (histórico)</div>
        <div>{sold.length}</div>
      </div>
      <div>
        <div style={{ fontWeight: 600 }}>Promedio días en venta</div>
        <div>{avgDays !== null ? `${avgDays} días` : '—'}</div>
      </div>
    </div>
  );
};

export default MetricsBar;
