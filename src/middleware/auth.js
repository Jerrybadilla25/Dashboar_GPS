import { AuthService } from '../services/authService';

export function authenticateToken(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    throw new Error('Token de acceso requerido');
  }

  return AuthService.verifyToken(token);
}

export async function requireAuth(req) {
  const decoded = authenticateToken(req);
  const user = await AuthService.getUserById(decoded.userId);
  
  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
}