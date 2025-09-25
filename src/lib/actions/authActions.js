'use server';

import { AuthService } from '../services/authService';
import connectDB from '../database/connection';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export async function checkUser(email) {
  try {
    await connectDB();
    const result = await AuthService.checkUserExists(email);
    
    // Convertir a objeto plano usando JSON.parse(JSON.stringify())
    return JSON.parse(JSON.stringify({
      exists: result.exists,
      needsPassword: result.needsPassword,
      user: result.user
    }));
  } catch (error) {
    return JSON.parse(JSON.stringify({ 
      exists: false, 
      error: error.message,
      user: null 
    }));
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return null;
    }

    await connectDB();
    const decoded = AuthService.verifyToken(token);
    const user = await AuthService.getUserById(decoded.userId);
    
    // Convertir a objeto plano
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    return null;
  }
}

export async function registerUser(formData) {
  try {
    await connectDB();

    const userData = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      deviceId: formData.get('deviceId'),
    };

    // Validaciones
    if (!userData.name || !userData.email || !userData.password || !userData.deviceId) {
      return { success: false, error: 'Todos los campos son requeridos' };
    }

    if (userData.password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
    }

    const result = await AuthService.register(userData);

    // Guardar token en cookies
    const cookieStore = await cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return JSON.parse(JSON.stringify({ 
      success: true, 
      message: result.isNewPassword ? 
        'Contraseña registrada exitosamente' : 
        'Usuario registrado exitosamente' 
    }));
  } catch (error) {
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function loginUser(formData) {
  try {
    await connectDB();

    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      return JSON.parse(JSON.stringify({ success: false, error: 'Email y contraseña son requeridos' }));
    }

    // Primero verificar si el usuario existe y necesita contraseña
    const userCheck = await checkUser(email);
    
    if (userCheck.exists && userCheck.needsPassword) {
      return JSON.parse(JSON.stringify({ 
        success: false, 
        error: 'Este usuario necesita registrar una contraseña primero.',
        needsRegistration: true 
      }));
    }

    const result = await AuthService.login(email, password);

    // Guardar token en cookies
    const cookieStore = await cookies();
    cookieStore.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return JSON.parse(JSON.stringify({ success: true, message: 'Login exitoso' }));
  } catch (error) {
    return JSON.parse(JSON.stringify({ success: false, error: error.message }));
  }
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  redirect('/login');
}