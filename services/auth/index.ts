import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/shared/db/connection';
import User, { IUser } from './models/User';
import { UserPayload } from '@/shared/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const TOKEN_EXPIRY = '7d';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: 'patient' | 'doctor';
  specialization?: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: UserPayload;
  token?: string;
}

/**
 * AUTH MICROSERVICE
 * Handles user authentication, registration, and token management
 */
class AuthService {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResult> {
    try {
      await connectDB();

      // Check if email exists
      const existingUser = await User.findOne({ email: input.email.toLowerCase() });
      if (existingUser) {
        return { success: false, message: 'Email already registered' };
      }

      // Validate doctor specialization
      if (input.role === 'doctor' && !input.specialization) {
        return { success: false, message: 'Specialization required for doctors' };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const user = await User.create({
        email: input.email.toLowerCase(),
        password: hashedPassword,
        name: input.name,
        role: input.role,
        specialization: input.specialization,
        phone: input.phone,
      });

      // Generate token
      const token = this.generateToken(user);
      const userPayload = this.toUserPayload(user);

      console.log(`[AuthService] User registered: ${user.email}`);

      return {
        success: true,
        message: 'Registration successful',
        user: userPayload,
        token,
      };
    } catch (error: any) {
      console.error('[AuthService] Register error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResult> {
    try {
      await connectDB();

      // Find user
      const user = await User.findOne({ email: input.email.toLowerCase() });
      if (!user) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const isValid = await bcrypt.compare(input.password, user.password);
      if (!isValid) {
        return { success: false, message: 'Invalid email or password' };
      }

      // Generate token
      const token = this.generateToken(user);
      const userPayload = this.toUserPayload(user);

      console.log(`[AuthService] User logged in: ${user.email}`);

      return {
        success: true,
        message: 'Login successful',
        user: userPayload,
        token,
      };
    } catch (error: any) {
      console.error('[AuthService] Login error:', error);
      return { success: false, message: error.message || 'Login failed' };
    }
  }

  /**
   * Verify JWT token and return user payload
   */
  verifyToken(token: string): UserPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
      return decoded;
    } catch (error) {
      console.error('[AuthService] Token verification failed');
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserPayload | null> {
    try {
      await connectDB();
      const user = await User.findById(userId);
      if (!user) return null;
      return this.toUserPayload(user);
    } catch (error) {
      console.error('[AuthService] Get user error:', error);
      return null;
    }
  }

  /**
   * Get all doctors
   */
  async getAllDoctors(): Promise<UserPayload[]> {
    try {
      await connectDB();
      const doctors = await User.find({ role: 'doctor' }).select('-password');
      return doctors.map((doc: IUser) => this.toUserPayload(doc));
    } catch (error) {
      console.error('[AuthService] Get doctors error:', error);
      return [];
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(user: IUser): string {
    const payload: UserPayload = this.toUserPayload(user);
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  /**
   * Convert User document to UserPayload
   */
  private toUserPayload(user: IUser): UserPayload {
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      specialization: user.specialization,
    };
  }
}

// Export singleton instance
const authService = new AuthService();
export default authService;
