import Location from '../models/position';
import User from '../models/user';


export class LocationService {
  
  // Obtener todas las ubicaciones
  static async getAllLocations() {
    try {
      console.log('📋 Buscando todas las ubicaciones en la base de datos...');
      const locations = await Location.find()
        .populate('userId', 'email deviceId name')
        .sort({ timestamp: -1 })
        .limit(1000); // Limitar para no sobrecargar
        
      console.log(`✅ Encontradas ${locations.length} ubicaciones`);
      return locations;
    } catch (error) {
      console.error('❌ Error en getAllLocations service:', error);
      throw new Error(`Error fetching locations: ${error.message}`);
    }
  }

  // Obtener ubicaciones recientes (últimas horas)
  static async getRecentLocations(hours = 24, emailId) {
    try {
      console.log(`⏰ Buscando ubicaciones de las últimas ${hours} horas...`);
      console.log({emailId});
      const date = new Date();
      date.setHours(date.getHours() - hours);
      console.log('Fecha límite:', date);

      const locations = await Location.find({
        email:emailId
      })
      .sort({ timestamp: -1 })
      .limit(500);
      console.log({locations});
      console.log(`✅ Encontradas ${locations.length} ubicaciones recientes`);
      return locations;
    } catch (error) {
      console.error('❌ Error en getRecentLocations service:', error);
      throw new Error(`Error fetching recent locations: ${error.message}`);
    }
  }

  // Obtener todos los usuarios activos
  static async getActiveUsers() {
    try {
      console.log('👥 Buscando usuarios activos...');
      const users = await User.find({ 
        isActive: true 
      }).sort({ lastActive: -1 });
      
      console.log(`✅ Encontrados ${users.length} usuarios activos`);
      return users;
    } catch (error) {
      console.error('❌ Error en getActiveUsers service:', error);
      throw new Error(`Error fetching active users: ${error.message}`);
    }
  }
}