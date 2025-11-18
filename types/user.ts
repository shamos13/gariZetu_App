export interface User {
  id: string;
  email: string;
  password: string; // Hashed password
  fullName: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  password: string; // Plain password - will be hashed
  fullName: string;
  phoneNumber?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
}

