import { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [version, setVersion] = useState(0);
  const invalidate = useCallback(() => setVersion(v => v + 1), []);
  return (
    <DataContext.Provider value={{ version, invalidate }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDataContext() {
  return useContext(DataContext);
}
