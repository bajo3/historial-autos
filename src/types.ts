export type VehicleStatus = 'en_stock' | 'vendido' | 'retirado';
export type QuoteStatus = 'enviado' | 'aceptado' | 'perdido';

export interface Vehicle {
  id: string;
  patente: string | null;
  marca: string;
  modelo: string;
  anio: number | null;
  precio_publicado: number | null;
  fecha_ingreso: string;
  fecha_egreso: string | null;
  estado: VehicleStatus;
  observaciones: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleDocument {
  id: string;
  vehicle_id: string;
  tipo: string;
  file_path: string;
  uploaded_at: string;
}

export interface Quote {
  id: string;
  vehicle_id: string | null;
  vehiculo_referencia?: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  monto_presupuestado: number | null;
  fecha_presupuesto: string;
  vendedor: string | null;
  estado: QuoteStatus;
  notas: string | null;
  created_at?: string;
}
