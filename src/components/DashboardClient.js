'use client';

import { useState, useEffect } from 'react';
import { getLatestLocation, getRecentLocations } from '@/lib/actions/locationActions';
import MapComponent from './MapComponent';

export default function DashboardClient({ initialLocations = [] }) {
  const [viewMode, setViewMode] = useState('24hours'); // '24hours' o 'live'
  const [currentLocations, setCurrentLocations] = useState(initialLocations || []);
  const [isLoading, setIsLoading] = useState(false);

  // Función para obtener la última ubicación
  const fetchLatestLocation = async () => {
    try {
      setIsLoading(true);
      const result = await getLatestLocation();
      if (result.success && result.data) {
        setCurrentLocations([result.data]);
      } else {
        setCurrentLocations([]);
      }
    } catch (error) {
      console.error('Error obteniendo ubicación en vivo:', error);
      setCurrentLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Función para obtener ubicaciones de 24 horas
  const fetchRecentLocations = async () => {
    try {
      setIsLoading(true);
      const result = await getRecentLocations(24);
      if (result.success && result.data) {
        setCurrentLocations(result.data);
      } else {
        setCurrentLocations([]);
      }
    } catch (error) {
      console.error('Error obteniendo ubicaciones recientes:', error);
      setCurrentLocations([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Efecto para actualizar según el modo
  useEffect(() => {
    let interval;
    
    if (viewMode === 'live') {
      // Obtener inmediatamente al cambiar a modo live
      fetchLatestLocation();
      
      // Configurar intervalo de 3 segundos
      interval = setInterval(fetchLatestLocation, 3000);
    } else {
      // Al volver a modo 24h, obtener las ubicaciones recientes
      fetchRecentLocations();
    }

    // Limpiar intervalo al desmontar o cambiar de modo
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [viewMode]);

  const toggleView = () => {
    setViewMode(prev => prev === '24hours' ? 'live' : '24hours');
  };

  return (
    <>
      {/* Grid con el botón */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Modo de vista</h3>
          <button
            onClick={toggleView}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
              viewMode === '24hours'
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {viewMode === '24hours' ? '📊 Últimas 24h' : '🔴 EN VIVO'}
          </button>
          {viewMode === 'live' && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500">
                {isLoading ? '🔄 Actualizando...' : '✓ Actualiza cada 3 seg'}
              </p>
              {currentLocations?.[0]?.timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(currentLocations[0].timestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mapa único */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {viewMode === 'live' ? '🔴 Ubicación en vivo' : `Mapa en tiempo real (${currentLocations?.length || 0} ubicaciones)`}
          </h3>
          {viewMode === 'live' && currentLocations?.[0]?.timestamp && (
            <span className="text-sm text-gray-500">
              Última actualización: {new Date(currentLocations[0].timestamp).toLocaleString()}
            </span>
          )}
        </div>
        {currentLocations && currentLocations.length > 0 ? (
          <MapComponent 
            locations={currentLocations} 
            isLiveMode={viewMode === 'live'}
          />
        ) : (
          <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {isLoading ? 'Cargando ubicaciones...' : 'No hay ubicaciones disponibles'}
            </p>
          </div>
        )}
      </div>
    </>
  );
}