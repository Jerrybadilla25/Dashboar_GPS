import { getRecentLocations, getActiveUsers } from '@/lib/actions/locationActions';
import { getCurrentUser, logoutUser } from '@/lib/actions/authActions';
import MapComponent from '@/components/MapComponent';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  console.log('🏠 Cargando página del dashboard...');
  
  const user = await getCurrentUser();
  
  console.log('👤 Usuario en dashboard:', user);
  
  // Redirigir si no está autenticado
  if (!user) {
    console.log('❌ Usuario no autenticado, redirigiendo a login...');
    redirect('/login');
  }

  // Obtener datos del servidor
  console.log('📊 Obteniendo datos del servidor...');
  const locationsResult = await getRecentLocations(24);
  const usersResult = await getActiveUsers();

  console.log('📍 Resultado de ubicaciones:', locationsResult);
  console.log('👥 Resultado de usuarios:', usersResult);

  const locations = locationsResult.success ? locationsResult.data : [];
  const users = usersResult.success ? usersResult.data : [];

  console.log(`📍 ${locations.length} ubicaciones cargadas`);
  console.log(`👥 ${users.length} usuarios cargados`);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard GPS</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Hola, {user.name}</span>
            <form action={logoutUser}>
              <button 
                type="submit"
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Usuarios activos</h3>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Ubicaciones (24h)</h3>
            <p className="text-3xl font-bold text-green-600">{locations.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold">Tu dispositivo</h3>
            <p className="text-sm text-gray-600">{user.deviceId}</p>
          </div>
        </div>

        {/* Mapa */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Mapa en tiempo real ({locations.length} ubicaciones)
          </h3>
          <MapComponent locations={locations} />
        </div>

        {/* Tabla de ubicaciones para debugging */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h3 className="text-lg font-semibold mb-4">Últimas ubicaciones (DEBUG)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Device ID</th>
                  <th className="px-4 py-2">Latitud</th>
                  <th className="px-4 py-2">Longitud</th>
                  <th className="px-4 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {locations.slice(0, 5).map((location, index) => (
                  <tr key={index} className="border-t">
                    <td className="px-4 py-2">{location.email}</td>
                    <td className="px-4 py-2">{location.deviceId}</td>
                    <td className="px-4 py-2">{location.lat}</td>
                    <td className="px-4 py-2">{location.lng}</td>
                    <td className="px-4 py-2">
                      {new Date(location.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}