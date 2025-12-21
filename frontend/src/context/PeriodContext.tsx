import React, { createContext, useContext, useState } from 'react';

type PeriodMode = 'NATURAL' | 'SCHOOL';

interface PeriodState {
    mode: PeriodMode;
    year: number; // For School mode, 2023 means 2023-2024
    startDate: string;
    endDate: string;
}

interface PeriodContextType extends PeriodState {
    setMode: (mode: PeriodMode) => void;
    setYear: (year: number) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<PeriodMode>('NATURAL');
    const [year, setYear] = useState<number>(new Date().getFullYear());

    const calculateDates = (m: PeriodMode, y: number) => {
        if (m === 'NATURAL') {
            return {
                start: `${y}-01-01`,
                end: `${y}-12-31`
            };
        } else {
            return {
                start: `${y}-09-01`,
                end: `${y + 1}-08-31`
            };
        }
    };

    const { start, end } = calculateDates(mode, year);

    return (
        <PeriodContext.Provider value={{
            mode,
            year,
            setMode,
            setYear,
            startDate: start,
            endDate: end
        }}>
            {children}
        </PeriodContext.Provider>
    );
};

export const usePeriod = () => {
    const context = useContext(PeriodContext);
    if (!context) throw new Error('usePeriod must be used within a PeriodProvider');
    return context;
};
