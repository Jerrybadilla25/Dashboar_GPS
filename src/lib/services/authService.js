import User from '../models/user';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  // Registrar nuevo usuario
  static async register(userData) {
  try {
    //console.log('Registrando usuario:', userData);

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [
        { email: userData.email },
        { deviceId: userData.deviceId }
      ]
    });

    //console.log('Usuario existente encontrado:', existingUser);

    if (existingUser) {
      // Si el usuario existe pero no tiene contraseña, actualizarlo
      if (!existingUser.password) {
        //console.log('Actualizando usuario existente con contraseña');
        existingUser.name = userData.name;
        existingUser.password = userData.password;
        await existingUser.save();
        
        const token = this.generateToken(existingUser);
        return {
          user: existingUser,
          token,
          isNewPassword: true
        };
      }
      throw new Error('El email o deviceId ya está registrado');
    }

    //console.log('Creando nuevo usuario');
    // Crear nuevo usuario
    const user = new User(userData);
    await user.save();

    // Generar token
    const token = this.generateToken(user);

    return {
      user,
      token
    };
  } catch (error) {
    console.error('Error en AuthService.register:', error);
    throw new Error(`Error en registro: ${error.message}`);
  }
}

  // Login de usuario
  static async login(email, password) {
    try {
      // Buscar usuario por email
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar si el usuario tiene contraseña
      if (!user.password) {
        throw new Error('Este usuario necesita registrar una contraseña. Por favor, regístrate primero.');
      }

      // Verificar contraseña
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        throw new Error('Cuenta desactivada');
      }

      // Actualizar lastActive
      user.lastActive = new Date();
      await user.save();

      // Generar token
      const token = this.generateToken(user);

      return {
        user,
        token
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Verificar si usuario necesita registro
  static async checkUserExists(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return { exists: false };
      }
      
      return {
        exists: true,
        needsPassword: !user.password,
        user: user
      };
    } catch (error) {
      throw new Error(`Error verificando usuario: ${error.message}`);
    }
  }

  // Generar token JWT
  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  // Verificar token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Obtener usuario por ID
  static async getUserById(userId) {
    try {
      return await User.findById(userId);
    } catch (error) {
      throw new Error('Usuario no encontrado');
    }
  }
}