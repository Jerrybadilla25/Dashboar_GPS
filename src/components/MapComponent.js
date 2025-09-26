'use client';

import { useEffect, useRef, useState } from 'react';

// Componente mejorado con rutas avanzadas
export default function MapComponent({ locations = [] }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef({});
  const [showControls, setShowControls] = useState(true);
  const [routeStyle, setRouteStyle] = useState({
    color: '#3B82F6',
    weight: 4,
    opacity: 0.8
  });

  useEffect(() => {
    const loadMap = async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      // ✅ CONFIGURAR ICONOS DE LEAFLET
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Icono personalizado para el punto de inicio
      const startIcon = L.divIcon({
        html: '<div style="background-color: #10B981; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'start-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Icono personalizado para el punto final
      const endIcon = L.divIcon({
        html: '<div style="background-color: #EF4444; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        className: 'end-marker',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Eliminar mapa anterior si existe
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Inicializar mapa
      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current).setView([9.9281, -84.0907], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstanceRef.current);
      }

      // Limpiar elementos anteriores
      markersRef.current.forEach(marker => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.removeLayer(marker);
        }
      });
      markersRef.current = [];

      Object.values(polylinesRef.current).forEach(polyline => {
        if (mapInstanceRef.current && polyline) {
          mapInstanceRef.current.removeLayer(polyline);
        }
      });
      polylinesRef.current = {};

      // Procesar ubicaciones
      if (locations.length > 0 && mapInstanceRef.current) {
        const validLocations = locations.filter(loc => loc.lat && loc.lng);
        
        // Agrupar por dispositivo
        const locationsByDevice = {};
        validLocations.forEach(location => {
          if (!locationsByDevice[location.deviceId]) {
            locationsByDevice[location.deviceId] = [];
          }
          locationsByDevice[location.deviceId].push(location);
        });

        // Colores diferentes por dispositivo
        const deviceColors = [
          '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
          '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
        ];

        // Crear rutas por dispositivo
        Object.keys(locationsByDevice).forEach((deviceId, index) => {
          const deviceLocations = locationsByDevice[deviceId].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
          
          const color = deviceColors[index % deviceColors.length];
          const latLngs = deviceLocations.map(loc => [loc.lat, loc.lng]);

          if (latLngs.length > 1) {
            // Crear polyline con flechas de dirección
            const polyline = L.polyline(latLngs, {
              color: color,
              weight: routeStyle.weight,
              opacity: routeStyle.opacity,
              lineJoin: 'round',
              lineCap: 'round'
            }).addTo(mapInstanceRef.current);

            // Agregar flechas de dirección cada 3 puntos
            for (let i = 0; i < latLngs.length - 1; i += 3) {
              if (i + 1 < latLngs.length) {
                const arrow = L.polylineDecorator(polyline, {
                  patterns: [
                    {
                      offset: `${(i / latLngs.length) * 100}%`,
                      repeat: 0,
                      symbol: L.Symbol.arrowHead({
                        pixelSize: 8,
                        polygon: false,
                        pathOptions: {
                          stroke: true,
                          color: color,
                          weight: 2,
                          opacity: 0.8
                        }
                      })
                    }
                  ]
                }).addTo(mapInstanceRef.current);
                polylinesRef.current[`arrow-${deviceId}-${i}`] = arrow;
              }
            }

            polylinesRef.current[deviceId] = polyline;

            // Agregar marcadores especiales para inicio y fin
            if (deviceLocations.length > 0) {
              // Marcador de inicio
              const startMarker = L.marker(latLngs[0], { icon: startIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                  <div>
                    <strong>🚀 INICIO</strong><br/>
                    <strong>${deviceLocations[0].email}</strong><br/>
                    <small>Device: ${deviceId}</small><br/>
                    <small>${new Date(deviceLocations[0].timestamp).toLocaleString()}</small>
                  </div>
                `);
              markersRef.current.push(startMarker);

              // Marcador de fin
              const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                  <div>
                    <strong>🏁 FINAL</strong><br/>
                    <strong>${deviceLocations[deviceLocations.length - 1].email}</strong><br/>
                    <small>Device: ${deviceId}</small><br/>
                    <small>${new Date(deviceLocations[deviceLocations.length - 1].timestamp).toLocaleString()}</small>
                  </div>
                `);
              markersRef.current.push(endMarker);

              // Marcadores intermedios (solo si hay muchos puntos)
              if (deviceLocations.length > 10) {
                deviceLocations.forEach((location, idx) => {
                  if (idx > 0 && idx < deviceLocations.length - 1 && idx % 5 === 0) {
                    const marker = L.marker([location.lat, location.lng])
                      .addTo(mapInstanceRef.current)
                      .bindPopup(`
                        <div>
                          <strong>📍 Punto ${idx + 1}</strong><br/>
                          <strong>${location.email}</strong><br/>
                          <small>Device: ${deviceId}</small><br/>
                          <small>${new Date(location.timestamp).toLocaleString()}</small>
                        </div>
                      `);
                    markersRef.current.push(marker);
                  }
                });
              }
            }
          }
        });

        // Ajustar vista
        const allElements = [
          ...markersRef.current,
          ...Object.values(polylinesRef.current).filter(p => p)
        ];
        
        if (allElements.length > 0) {
          const group = L.featureGroup(allElements);
          mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        }

        // Agregar leyenda
        if (Object.keys(locationsByDevice).length > 1) {
          const legend = L.control({ position: 'bottomright' });
          legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'legend');
            div.innerHTML = '<h4>Dispositivos</h4>';
            Object.keys(locationsByDevice).forEach((deviceId, index) => {
              const color = deviceColors[index % deviceColors.length];
              div.innerHTML += `
                <div style="margin: 5px 0; display: flex; align-items: center;">
                  <div style="width: 20px; height: 4px; background: ${color}; margin-right: 8px;"></div>
                  <span>${deviceId}</span>
                </div>
              `;
            });
            return div;
          };
          legend.addTo(mapInstanceRef.current);
        }
      }
    };

    // Cargar polylineDecorator para las flechas
    const loadDependencies = async () => {
      await import('leaflet-polylinedecorator');
      loadMap();
    };

    loadDependencies();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [locations, routeStyle]);

  // Función para cambiar estilo de rutas
  const changeRouteStyle = (style) => {
    setRouteStyle(style);
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      {/* Controles de estilo */}
      {showControls && (
        <div className="absolute top-4 right-4 z-1000 bg-white p-3 rounded-lg shadow-lg">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={() => changeRouteStyle({ color: '#3B82F6', weight: 4, opacity: 0.8 })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Normal
            </button>
            <button 
              onClick={() => changeRouteStyle({ color: '#EF4444', weight: 6, opacity: 0.9 })}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              Resaltado
            </button>
            <button 
              onClick={() => changeRouteStyle({ color: '#10B981', weight: 3, opacity: 0.6 })}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
            >
              Suave
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}