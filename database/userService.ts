import { CreateUserInput, UpdateUserInput, User } from '@/types/user';
import { hashPassword } from '@/utils/password';
import { getDatabase } from './database';

export const userService = {
  /**
   * Create a new user
   */
  create: async (input: CreateUserInput): Promise<User> => {
    const database = await getDatabase();
    const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const hashedPassword = await hashPassword(input.password);

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `INSERT INTO users (id, email, password, fullName, phoneNumber, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          input.email.toLowerCase().trim(),
          hashedPassword,
          input.fullName,
          input.phoneNumber || null,
          now,
          now,
        ]
      );
    });

    const user: User = {
      id,
      email: input.email.toLowerCase().trim(),
      password: hashedPassword,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      createdAt: now,
      updatedAt: now,
    };

    return user;
  },

  /**
   * Find user by email
   */
  findByEmail: async (email: string): Promise<User | null> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );
    return result || null;
  },

  /**
   * Find user by ID
   */
  findById: async (id: string): Promise<User | null> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<User>(
      `SELECT * FROM users WHERE id = ?`,
      [id]
    );
    return result || null;
  },

  /**
   * Update user information
   */
  update: async (id: string, input: UpdateUserInput): Promise<User> => {
    const database = await getDatabase();
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: unknown[] = [];

    if (input.fullName !== undefined) {
      updates.push('fullName = ?');
      values.push(input.fullName);
    }
    if (input.phoneNumber !== undefined) {
      updates.push('phoneNumber = ?');
      values.push(input.phoneNumber);
    }
    if (input.email !== undefined) {
      updates.push('email = ?');
      values.push(input.email.toLowerCase().trim());
    }

    if (updates.length === 0) {
      // No updates, return current user
      const user = await userService.findById(id);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    updates.push('updatedAt = ?');
    values.push(now);
    values.push(id);

    await database.withTransactionAsync(async () => {
      await database.runAsync(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    });

    const user = await userService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  /**
   * Delete user
   */
  delete: async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync(`DELETE FROM users WHERE id = ?`, [id]);
    });
  },
};
