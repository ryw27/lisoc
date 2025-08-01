import { createContext, useContext, type ReactNode } from 'react';
import { 
    type selectOptions, 
    type IdMaps,
    type threeSeasons
} from "./types";


type RegistrationContextType = {
    seasons: threeSeasons;
    selectOptions: selectOptions;
    idMaps: IdMaps;
}

const RegistrationContext = createContext<RegistrationContextType | null>(null);

// Provider component
interface RegistrationProviderProps {
    children: ReactNode;
    value: RegistrationContextType;
}

export function RegistrationProvider({ children, value }: RegistrationProviderProps) {
    return (
        <RegistrationContext.Provider value={value}>
            {children}
        </RegistrationContext.Provider>
    );
}

// Custom hook with proper error handling
export function useRegistrationContext() {
    const context = useContext(RegistrationContext);
    if (!context) {
        throw new Error('useRegistrationContext must be used within a RegistrationProvider');
    }
    return context;
}

export default RegistrationContext;