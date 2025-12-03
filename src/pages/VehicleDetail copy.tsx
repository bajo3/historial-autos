import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Vehicle, VehicleDocument, VehicleLog } from '../types';
import VehicleForm from '../components/VehicleForm';
import DocumentUpload from '../components/DocumentUpload';
import ConfirmModal from '../components/ConfirmModal';

const VehicleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [docs, setDocs] = useState<VehicleDocument[]>([]);
  const [logs, setLogs] = useState<VehicleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewDoc, setPreviewDoc] = useState<VehicleDocument | null>(null);

  const [deleteVehicleOpen, setDeleteVehicleOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<VehicleDocument | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);

    const [
      { data: vData, error: vError },
      { data: dData, error: dError },
      { data: lData, error: lError },
    ] = await Promise.all([
      supabase.from('vehicles').select('*').eq('id', id).maybeSingle(),
      supabase
        .from('vehicle_documents')
        .select('*')
        .eq('vehicle_id', id)
        .order('uploaded_at', { ascending: false }),
      supabase
        .from('vehicle_logs')
        .select('*')
        .eq('vehicle_id', id)
        .order('created_at', { ascending: false }),
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

    if (lError) {
      // Si la tabla no existe, simplemente lo logueamos y seguimos
      console.error('[vehicle_logs] Error cargando logs', lError);
    } else {
      setLogs((lData || []) as VehicleLog[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateVehicle = async (values: Partial<Vehicle>) => {
    if (!id || !vehicle) return;

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

    // Log de actualización
    const { error: logError } = await supabase.from('vehicle_logs').insert({
      vehicle_id: id,
      action: 'update',
      description: 'Datos del vehículo actualizados',
      diff: values,
    });

    if (logError) {
      console.error('[vehicle_logs] Error insertando log de update', logError);
    }

    await loadData();
  };

  const handleSoftDeleteConfirm = async () => {
    if (!vehicle) return;
    setActionLoading(true);

    try {
      const nowIso = new Date().toISOString();

      const { error } = await supabase
        .from('vehicles')
        .update({ deleted_at: nowIso })
        .eq('id', vehicle.id);

      if (error) {
        console.error(error);
        alert('Error enviando el auto a la papelera');
        return;
      }

      const { error: logError } = await supabase.from('vehicle_logs').insert({
        vehicle_id: vehicle.id,
        action: 'soft_delete',
        description: 'Vehículo enviado a la papelera',
        diff: null,
      });

      if (logError) {
        console.error('[vehicle_logs] Error insertando log de soft_delete', logError);
      }

      setDeleteVehicleOpen(false);
      navigate('/vehicles');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al enviar a la papelera.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDocDeleteConfirm = async () => {
    if (!docToDelete) return;
    setActionLoading(true);

    try {
      // 1) borrar del storage
      const { error: storageError } = await supabase.storage
        .from('vehicle_docs')
        .remove([docToDelete.file_path]);

      if (storageError) {
        console.error(storageError);
        alert('Error borrando archivo del storage');
        // seguimos igual intentando borrar el registro
      }

      // 2) borrar de la tabla
      const { error } = await supabase
        .from('vehicle_documents')
        .delete()
        .eq('id', docToDelete.id);

      if (error) {
        console.error(error);
        alert('Error borrando registro del documento');
        return;
      }

      // 3) actualizar estado local
      setDocs((prev) => prev.filter((d) => d.id !== docToDelete.id));

      // 4) log
      if (vehicle) {
        const { error: logError } = await supabase.from('vehicle_logs').insert({
          vehicle_id: vehicle.id,
          action: 'delete_document',
          description: `Documento eliminado: ${docToDelete.tipo}`,
          diff: { file_path: docToDelete.file_path },
        });
        if (logError) {
          console.error('[vehicle_logs] Error insertando log de delete_document', logError);
        }
      }

      setDocToDelete(null);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al eliminar el documento.');
    } finally {
      setActionLoading(false);
    }
  };

  const getPublicUrl = (filePath: string) => {
    const { data } = supabase.storage.from('vehicle_docs').getPublicUrl(filePath);
    return data.publicUrl;
  };

  if (loading) return <div>Cargando...</div>;
  if (!vehicle) return <div>No se encontró el auto.</div>;

  const isInTrash = !!vehicle.deleted_at;

  return (
    <div>
      <Link to="/vehicles" style={{ fontSize: 14 }}>
        ← Volver a autos
      </Link>

      <h2 style={{ margin: '8px 0 16px' }}>
        {vehicle.marca} {vehicle.modelo}{' '}
        {vehicle.patente ? `(${vehicle.patente})` : ''}
        {isInTrash && (
          <span
            style={{
              marginLeft: 8,
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 999,
              border: '1px solid #f97316',
              color: '#f97316',
            }}
          >
            En papelera
          </span>
        )}
      </h2>

      <div className="detail-grid">
        <div className="card">
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Datos del auto</h3>
          <VehicleForm
            initial={vehicle}
            onSubmit={handleUpdateVehicle}
            mode="edit"
          />

          {/* Botón para enviar a papelera (soft delete) */}
          {!isInTrash && (
            <div style={{ marginTop: 12 }}>
              <button
                type="button"
                onClick={() => setDeleteVehicleOpen(true)}
                className="btn-danger"
              >
                🗑 Enviar a papelera
              </button>
            </div>
          )}
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => setPreviewDoc(d)}
                          className="btn-secondary"
                          style={{ padding: '2px 8px', fontSize: 12 }}
                        >
                          Ver aquí
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocToDelete(d)}
                          className="btn-danger-outline"
                          style={{ padding: '2px 8px', fontSize: 12 }}
                        >
                          🗑
                        </button>
                      </div>
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
              {previewDoc.file_path.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={getPublicUrl(previewDoc.file_path)}
                  title={previewDoc.tipo}
                />
              ) : (
                <img
                  src={getPublicUrl(previewDoc.file_path)}
                  alt={previewDoc.tipo}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          )}

        </div>
      </div>

      {logs.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8 }}>Historial de cambios</h3>
          <ul
            style={{
              listStyle: 'none',
              paddingLeft: 0,
              margin: 0,
              fontSize: 13,
            }}
          >
            {logs.map((log) => (
              <li
                key={log.id}
                style={{
                  padding: '6px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{log.action}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {new Date(log.created_at).toLocaleString('es-AR')}
                  </span>
                </div>
                {log.description && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {log.description}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Modal enviar a papelera */}
      <ConfirmModal
        open={deleteVehicleOpen}
        title="Enviar a papelera"
        description="El auto no se borrará de la base de datos, pero dejará de aparecer en la lista normal y pasará a la papelera."
        confirmLabel="Sí, enviar a papelera"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleSoftDeleteConfirm}
        onCancel={() => setDeleteVehicleOpen(false)}
      />

      {/* Modal eliminar documento */}
      <ConfirmModal
        open={!!docToDelete}
        title="Eliminar documento"
        description={
          docToDelete
            ? `¿Seguro que querés eliminar el documento "${docToDelete.tipo}"?`
            : ''
        }
        confirmLabel="Eliminar documento"
        cancelLabel="Cancelar"
        confirmVariant="danger"
        loading={actionLoading}
        onConfirm={handleDocDeleteConfirm}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};

export default VehicleDetail;
