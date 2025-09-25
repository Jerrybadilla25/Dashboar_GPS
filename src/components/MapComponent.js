'use client';

import { useEffect, useRef } from 'react';

// Componente simple con Leaflet (opción gratuita)
export default function MapComponent({ locations = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Cargar Leaflet dinámicamente para evitar problemas SSR
    const loadMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // ✅ CONFIGURAR ICONOS DE LEAFLET (SOLUCIÓN AL ERROR 404)
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Eliminar mapa anterior si existe
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Inicializar mapa
      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([9.9281, -84.0907], 10); // Centro en Costa Rica

        // Agregar tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      // Limpiar marcadores anteriores
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      // Agregar nuevos marcadores
      if (locations.length > 0 && mapInstanceRef.current) {
        locations.forEach(location => {
          if (location.lat && location.lng) {
            const marker = L.marker([location.lat, location.lng])
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div>
                  <strong>${location.email}</strong><br/>
                  <small>Device: ${location.deviceId}</small><br/>
                  <small>${new Date(location.timestamp).toLocaleString()}</small>
                </div>
              `);
                     
            markersRef.current.push(marker);
          }
        });

        // Ajustar vista para mostrar todos los marcadores
        if (markersRef.current.length > 0) {
          const group = new L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }
      }
    };

    loadMap();

    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden">
      <div 
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}