import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Vehicle, VehicleDocument } from '../types';
import VehicleForm from '../components/VehicleForm';
import DocumentUpload from '../components/DocumentUpload';

const VehicleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [docs, setDocs] = useState<VehicleDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    const [
      { data: vData, error: vError },
      { data: dData, error: dError },
    ] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', id)
        .order('uploaded_at', { ascending: false }),
    ] as const);

    if (vError) {
      console.error(vError);
      alert('Error cargando auto');
    } else {
      setVehicle(vData as Vehicle | null);
    }

    if (dError) {
      console.error(dError);
    }
    setDocs((dData || []) as VehicleDocument[]);

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateVehicle = async (values: Partial<Vehicle>) => {
    if (!id) return;

    const { error } = await supabase
      .from('vehicles')
      .update({
        marca: values.marca,
        modelo: values.modelo,
        patente: values.patente,
        anio: values.anio,
        precio_publicado: values.precio_publicado,
        fecha_ingreso: values.fecha_ingreso,
        fecha_egreso: values.fecha_egreso || null,
        estado: values.estado,
        observaciones: values.observaciones,
      })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Error actualizando auto');
      return;
    }

    await loadData();
  };

  const handleDeleteVehicle = async () => {
    if (!vehicle) return;

    const confirmed = window.confirm(
      '¿Seguro que querés eliminar este auto? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      // 1) Borrar documentos del storage (si hay)
      if (docs.length > 0) {
        const paths = docs.map((d) => d.file_path);
        const { error: storageError } = await supabase.storage
          .from('vehicle_docs')
          .remove(paths);

        if (storageError) {
          console.error(storageError);
          alert('Error borrando documentos del storage (revisá la consola).');
          // Podés decidir seguir o no; acá sigo.
        }
      }

      // 2) Borrar documentos de la tabla
      const { error: docsError } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('vehicle_id', vehicle.id);

      if (docsError) {
        console.error(docsError);
        alert('Error borrando documentos asociados al auto.');
        return;
      }

      // 3) Borrar el vehículo
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicle.id);

      if (vehicleError) {
        console.error(vehicleError);
        alert('Error borrando el auto.');
        return;
      }

      alert('Auto eliminado correctamente');
      navigate('/vehicles');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error inesperado al eliminar el auto.');
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('vehicle_docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) return <div>Cargando...</div>;
  if (!vehicle) return <div>No se encontró el auto.</div>;

  return (
    <div>
      <Link to="/vehicles" style={{ fontSize: 14 }}>
        ← Volver a autos
      </Link>

      <h2 style={{ margin: '8px 0 16px' }}>
        {vehicle.marca} {vehicle.modelo}{' '}
        {vehicle.patente ? `(${vehicle.patente})` : ''}
      </h2>

      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.7fr)',
          alignItems: 'flex-start',
        }}
      >
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Datos del auto</h3>
          <VehicleForm initial={vehicle} onSubmit={handleUpdateVehicle} mode="edit" />

          {/* Botón para eliminar el auto */}
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={handleDeleteVehicle}
              className="btn-danger"
              style={{
                background: '#dc2626',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 13,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              🗑 Eliminar auto
            </button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Documentación (PDF)</h3>
          <DocumentUpload vehicleId={vehicle.id} onUploaded={loadData} />

          <ul style={{ marginTop: 12, paddingLeft: 0, listStyle: 'none' }}>
            {docs.length === 0 && <li>No hay documentos.</li>}
            {docs.map((d) => {
              const url = getPublicUrl(d.file_path);
              const fecha = new Date(d.uploaded_at).toLocaleDateString('es-AR');
              return (
                <li key={d.id} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid var(--border-subtle)',
                      background: 'rgba(15, 23, 42, 0.9)',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>{d.tipo}</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: 12 }}
                      >
                        Abrir en pestaña nueva
                      </a>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(d)}
                        className="btn-secondary"
                        style={{ padding: '2px 8px', fontSize: 12 }}
                      >
                        Ver aquí
                      </button>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {fecha}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {previewDoc && (
            <div className="pdf-preview">
              <iframe
                src={getPublicUrl(previewDoc.file_path)}
                title={previewDoc.tipo}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
