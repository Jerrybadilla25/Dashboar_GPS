'use server';

import { LocationService } from '../services/locationService';
import connectDB from '../database/connection';
import { getCurrentUser } from './authActions';

export async function getAllLocations() {
  try {
    console.log('🔍 Obteniendo todas las ubicaciones...');
    
    // Verificar autenticación
    const user = await getCurrentUser();
    console.log('Usuario actual:', user);
    
    if (!user) {
      throw new Error('No autenticado');
    }

    await connectDB();
    console.log('✅ Conectado a la base de datos');
    
    const locations = await LocationService.getAllLocations();
    console.log('📍 Ubicaciones obtenidas:', locations?.length);
    
    // Convertir a objetos planos
    return JSON.parse(JSON.stringify({ 
      success: true, 
      data: locations 
    }));
  } catch (error) {
    console.error('❌ Error en getAllLocations:', error);
    return JSON.parse(JSON.stringify({ 
      success: false, 
      error: error.message 
    }));
  }
}

export async function getRecentLocations(hours = 24) {
  try {
    console.log(`🔍 Obteniendo ubicaciones recientes (últimas ${hours} horas)...`);
    
    const user = await getCurrentUser();
    const emailId = user.email
    if (!user) {
      throw new Error('No autenticado');
    }

    await connectDB();
    console.log('✅ Conectado a la base de datos');
    const locations = await LocationService.getRecentLocations(hours, emailId);
    console.log('📍 Ubicaciones recientes obtenidas:', locations?.length);
    
    return JSON.parse(JSON.stringify({ 
      success: true, 
      data: locations 
    }));
  } catch (error) {
    console.error('❌ Error en getRecentLocations:', error);
    return JSON.parse(JSON.stringify({ 
      success: false, 
      error: error.message 
    }));
  }
}

export async function getActiveUsers() {
  try {
    console.log('🔍 Obteniendo usuarios activos...');
    
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('No autenticado');
    }

    await connectDB();
    console.log('✅ Conectado a la base de datos');

    const users = await LocationService.getActiveUsers();
    console.log('👥 Usuarios activos obtenidos:', users?.length);
    
    return JSON.parse(JSON.stringify({ 
      success: true, 
      data: users 
    }));
  } catch (error) {
    console.error('❌ Error en getActiveUsers:', error);
    return JSON.parse(JSON.stringify({ 
      success: false, 
      error: error.message 
    }));
  }
}