import Location from "../models/position";
import User from "../models/user";

export class LocationService {
  // Obtener todas las ubicaciones
  static async getAllLocations() {
    try {
      //console.log('📋 Buscando todas las ubicaciones de las últimas 24 horas...');

      // Calcular la fecha de hace 24 horas
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      // Intentar obtener ubicaciones de las últimas 24 horas
      let locations = await Location.find({
        timestamp: {
          $gte: twentyFourHoursAgo, // Mayor o igual a hace 24 horas
        },
      })
        .populate("userId", "email deviceId name")
        .sort({ timestamp: -1 })
        .limit(1000);

      // Si no hay datos en las últimas 24 horas, buscar los más recientes disponibles
      if (locations.length === 0) {
        console.log(
          "⚠️ No se encontraron ubicaciones en las últimas 24 horas. Buscando datos más recientes..."
        );

        locations = await Location.find()
          .populate("userId", "email deviceId name")
          .sort({ timestamp: -1 })
          .limit(100); // Limitar a los 100 más recientes como fallback

        //console.log(`🔄 Fallback activado: Encontradas ${locations.length} ubicaciones más recientes`);
      } else {
        //console.log(`✅ Encontradas ${locations.length} ubicaciones de las últimas 24 horas`);
      }

      return locations;
    } catch (error) {
      console.error("❌ Error en getAllLocations service:", error);
      throw new Error(`Error fetching locations: ${error.message}`);
    }
  }

  // Obtener ubicaciones recientes (últimas horas)
  static async getRecentLocations(hours = 24, emailId) {
    try {
      //console.log(`⏰ Buscando ubicaciones de las últimas ${hours} horas...`);
      //console.log({emailId});
      const date = new Date();
      date.setHours(date.getHours() - hours);
      //console.log('Fecha límite:', date);

      const locations = await Location.find({
        email: emailId,
      })
        .sort({ timestamp: -1 })
        .limit(500);
      //console.log({locations});
      //console.log(`✅ Encontradas ${locations.length} ubicaciones recientes`);
      return locations;
    } catch (error) {
      console.error("❌ Error en getRecentLocations service:", error);
      throw new Error(`Error fetching recent locations: ${error.message}`);
    }
  }

  // Obtener todos los usuarios activos
  static async getActiveUsers() {
    try {
      //console.log('👥 Buscando usuarios activos...');
      const users = await User.find({
        isActive: true,
      }).sort({ lastActive: -1 });

      //console.log(`✅ Encontrados ${users.length} usuarios activos`);
      return users;
    } catch (error) {
      console.error("❌ Error en getActiveUsers service:", error);
      throw new Error(`Error fetching active users: ${error.message}`);
    }
  }

  // Obtener la última ubicación de un usuario
  static async getLatestLocation(emailId) {
    try {
      console.log(`📍 Buscando última ubicación para: ${emailId}`);

      const location = await Location.findOne({
        email: emailId,
      })
        .sort({ timestamp: -1 })
        .limit(1);

      console.log(`✅ Última ubicación encontrada:`, location ? "Sí" : "No");
      return location;
    } catch (error) {
      console.error("❌ Error en getLatestLocation service:", error);
      throw new Error(`Error fetching latest location: ${error.message}`);
    }
  }
}
