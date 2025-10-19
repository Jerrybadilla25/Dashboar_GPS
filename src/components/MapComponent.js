'use client';

import { useEffect, useRef, useState } from 'react';

export default function MapComponent({ locations = [], isLiveMode = false }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylinesRef = useRef({});
  const liveMarkerRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [routeStyle, setRouteStyle] = useState({
    color: '#3B82F6',
    weight: 4,
    opacity: 0.8
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Efecto para inicializar el mapa solo una vez
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        if (!isMounted || !mapRef.current || mapInitialized) {
          return;
        }

        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        await new Promise(resolve => setTimeout(resolve, 100));

        if (!isMounted || !mapRef.current) {
          return;
        }

        // ✅ CONFIGURAR ICONOS DE LEAFLET
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        // Inicializar mapa solo si no existe
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = L.map(mapRef.current).setView([9.9281, -84.0907], 10);

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current);

          setMapInitialized(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error al inicializar el mapa:', error);
        setIsLoading(false);
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, []); // Solo se ejecuta una vez

  // Efecto separado para actualizar el contenido del mapa
  useEffect(() => {
    if (!mapInitialized || !mapInstanceRef.current) {
      return;
    }

    const updateMapContent = async () => {
      try {
        const L = (await import('leaflet')).default;

        // Validar ubicaciones
        const validLocations = locations.filter(loc => 
          loc && 
          typeof loc.lat === 'number' && 
          typeof loc.lng === 'number' &&
          !isNaN(loc.lat) && 
          !isNaN(loc.lng)
        );

        if (validLocations.length === 0) {
          return;
        }

        // MODO LIVE: Solo actualizar el marcador sin recargar todo
        if (isLiveMode && validLocations.length === 1) {
          const location = validLocations[0];
          const latLng = [location.lat, location.lng];

          const endIcon = L.divIcon({
            html: '<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); animation: pulse 2s infinite;"></div><style>@keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }</style>',
            className: 'live-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          // Si ya existe el marcador live, solo actualizar posición
          if (liveMarkerRef.current) {
            liveMarkerRef.current.setLatLng(latLng);
            liveMarkerRef.current.setPopupContent(`
              <div>
                <strong>📍 Ubicación Actual</strong><br/>
                <strong>${location.email || 'Usuario'}</strong><br/>
                <small>Device: ${location.deviceId || 'N/A'}</small><br/>
                <small>${new Date(location.timestamp).toLocaleString()}</small>
              </div>
            `);
            // Animar suavemente hacia la nueva posición
            mapInstanceRef.current.panTo(latLng, {
              animate: true,
              duration: 0.5
            });
          } else {
            // Crear el marcador por primera vez
            liveMarkerRef.current = L.marker(latLng, { icon: endIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div>
                  <strong>📍 Ubicación Actual</strong><br/>
                  <strong>${location.email || 'Usuario'}</strong><br/>
                  <small>Device: ${location.deviceId || 'N/A'}</small><br/>
                  <small>${new Date(location.timestamp).toLocaleString()}</small>
                </div>
              `);
            mapInstanceRef.current.setView(latLng, 15);
          }
          return;
        }

        // MODO 24 HORAS: Recargar todo el contenido
        // Limpiar marcador live si existe
        if (liveMarkerRef.current) {
          mapInstanceRef.current.removeLayer(liveMarkerRef.current);
          liveMarkerRef.current = null;
        }

        // Limpiar elementos anteriores
        markersRef.current.forEach(marker => {
          try {
            mapInstanceRef.current.removeLayer(marker);
          } catch (error) {
            console.error('Error eliminando marcador:', error);
          }
        });
        markersRef.current = [];

        Object.values(polylinesRef.current).forEach(polyline => {
          if (polyline) {
            try {
              mapInstanceRef.current.removeLayer(polyline);
            } catch (error) {
              console.error('Error eliminando polyline:', error);
            }
          }
        });
        polylinesRef.current = {};

        // Iconos personalizados
        const startIcon = L.divIcon({
          html: '<div style="background-color: #10B981; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'start-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const endIcon = L.divIcon({
          html: '<div style="background-color: #EF4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4);"></div>',
          className: 'end-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        // Agrupar por dispositivo
        const locationsByDevice = {};
        validLocations.forEach(location => {
          const deviceId = location.deviceId || 'unknown';
          if (!locationsByDevice[deviceId]) {
            locationsByDevice[deviceId] = [];
          }
          locationsByDevice[deviceId].push(location);
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
            // Crear polyline
            const polyline = L.polyline(latLngs, {
              color: color,
              weight: routeStyle.weight,
              opacity: routeStyle.opacity,
              lineJoin: 'round',
              lineCap: 'round'
            }).addTo(mapInstanceRef.current);

            polylinesRef.current[deviceId] = polyline;

            // Agregar flechas cada 3 puntos
            for (let i = 0; i < latLngs.length - 1; i += 3) {
              if (i + 1 < latLngs.length) {
                const start = latLngs[i];
                const end = latLngs[i + 1];
                
                const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI;
                
                const arrowIcon = L.divIcon({
                  html: `<div style="transform: rotate(${angle + 90}deg); color: ${color}; font-size: 14px;">▲</div>`,
                  className: 'arrow-icon',
                  iconSize: [14, 14],
                  iconAnchor: [7, 7]
                });

                const arrowMarker = L.marker([start[0], start[1]], { 
                  icon: arrowIcon,
                  interactive: false
                }).addTo(mapInstanceRef.current);
                
                markersRef.current.push(arrowMarker);
              }
            }

            // Marcador de INICIO (VERDE)
            const startMarker = L.marker(latLngs[0], { icon: startIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div>
                  <strong>🚀 INICIO</strong><br/>
                  <strong>${deviceLocations[0].email || 'Usuario'}</strong><br/>
                  <small>Device: ${deviceId}</small><br/>
                  <small>${new Date(deviceLocations[0].timestamp).toLocaleString()}</small>
                </div>
              `);
            markersRef.current.push(startMarker);

            // Marcador de FIN (ROJO)
            const endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon })
              .addTo(mapInstanceRef.current)
              .bindPopup(`
                <div>
                  <strong>🏁 FINAL</strong><br/>
                  <strong>${deviceLocations[deviceLocations.length - 1].email || 'Usuario'}</strong><br/>
                  <small>Device: ${deviceId}</small><br/>
                  <small>${new Date(deviceLocations[deviceLocations.length - 1].timestamp).toLocaleString()}</small>
                </div>
              `);
            markersRef.current.push(endMarker);
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

        // Agregar leyenda solo si hay múltiples dispositivos
        if (Object.keys(locationsByDevice).length > 1) {
          const legend = L.control({ position: 'bottomright' });
          legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'legend');
            div.style.background = 'white';
            div.style.padding = '10px';
            div.style.borderRadius = '5px';
            div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            div.innerHTML = '<h4 style="margin: 0 0 8px 0;">Dispositivos</h4>';
            Object.keys(locationsByDevice).forEach((deviceId, index) => {
              const color = deviceColors[index % deviceColors.length];
              div.innerHTML += `
                <div style="margin: 5px 0; display: flex; align-items: center;">
                  <div style="width: 20px; height: 4px; background: ${color}; margin-right: 8px;"></div>
                  <span style="font-size: 12px;">${deviceId}</span>
                </div>
              `;
            });
            return div;
          };
          legend.addTo(mapInstanceRef.current);
        }
      } catch (error) {
        console.error('Error al actualizar el mapa:', error);
      }
    };

    updateMapContent();
  }, [locations, routeStyle, isLiveMode, mapInitialized]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          setMapInitialized(false);
        } catch (error) {
          console.error('Error en cleanup:', error);
        }
      }
    };
  }, []);

  // Función para cambiar estilo de rutas
  const changeRouteStyle = (style) => {
    setRouteStyle(style);
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      {/* Controles de estilo */}
      {showControls && !isLiveMode && locations.length > 1 && (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-lg shadow-lg">
          <div className="flex gap-2 mb-2">
            <button 
              onClick={() => changeRouteStyle({ color: '#3B82F6', weight: 4, opacity: 0.8 })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Normal
            </button>
            <button 
              onClick={() => changeRouteStyle({ color: '#EF4444', weight: 6, opacity: 0.9 })}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Resaltado
            </button>
            <button 
              onClick={() => changeRouteStyle({ color: '#10B981', weight: 3, opacity: 0.6 })}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Suave
            </button>
          </div>
        </div>
      )}
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
          <div className="text-gray-600">Cargando mapa...</div>
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