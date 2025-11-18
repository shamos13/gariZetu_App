import { carService } from '@/database/carService';
import { initDatabase } from '@/database/database';
import { seedCars } from '@/database/seed';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface DatabaseContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  refreshCars: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Initialize database schema
        await initDatabase();
        
        // Seed initial data
        await seedCars();
        
        setIsInitialized(true);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        console.error('Database initialization error:', err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDatabase();
  }, []);

  const refreshCars = async () => {
    // This function can be used to refresh car data if needed
    // For now, it's a placeholder for future use
    try {
      await carService.findAll();
    } catch (err) {
      console.error('Error refreshing cars:', err);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        isInitialized,
        isLoading,
        error,
        refreshCars,
      }}>
      {children}
    </DatabaseContext.Provider>
  );
};

