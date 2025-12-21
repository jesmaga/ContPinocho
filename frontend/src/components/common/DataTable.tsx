import React, { useState, useMemo } from 'react';
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
    sortable?: boolean;
    className?: string; // Add className for explicit width control
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    pageSizeOptions?: number[];
    defaultPageSize?: number;
    searchPlaceholder?: string;
    searchKeys?: (keyof T)[]; // Keys to search in
    hideSearch?: boolean;
}

export const DataTable = <T extends object>({
    data,
    columns,
    pageSizeOptions = [10, 25, 50],
    defaultPageSize = 10,
    searchPlaceholder = "Buscar...",
    searchKeys = [],
    hideSearch = false
}: DataTableProps<T>) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof T | null; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    // 1. Filter
    const filteredData = useMemo(() => {
        if (!searchTerm) return data;
        const lowerTerm = searchTerm.toLowerCase();
        return data.filter((item) => {
            return searchKeys.some((key) => {
                const value = item[key];
                return String(value).toLowerCase().includes(lowerTerm);
            });
        });
    }, [data, searchTerm, searchKeys]);

    // 2. Sort
    const sortedData = useMemo(() => {
        if (!sortConfig || !sortConfig.key) return filteredData;
        return [...filteredData].sort((a, b) => {
            const aValue = a[sortConfig.key!] as any;
            const bValue = b[sortConfig.key!] as any;
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredData, sortConfig]);

    // 3. Paginate
    const totalPages = Math.ceil(sortedData.length / pageSize);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, currentPage, pageSize]);

    const handleSort = (key: keyof T) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Reset page on filter change or data change
    React.useEffect(() => {
        if (currentPage > totalPages) {
            // If we are on page 5 but now there are only 4 pages, go to page 4.
            // If totalPages is 0, go to 1 (or 0? Pagination usually 1-based, let's say 1).
            setCurrentPage(Math.max(1, totalPages));
        }
    }, [totalPages, currentPage]);

    return (
        <div className="w-full space-y-4">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                {/* Search */}
                {!hideSearch && (
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-[#121212] border border-[#333] rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                )}

                {/* Page Size */}
                <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="bg-[#121212] border border-[#333] text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                    {pageSizeOptions.map(size => (
                        <option key={size} value={size}>Mostrar {size}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#1E1E1E] rounded-xl shadow-sm border border-[#333] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#2A2A2A] border-b border-[#333]">
                            <tr>
                                {columns.map((col, idx) => (
                                    <th
                                        key={idx}
                                        onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                                        className={`px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-[#333] transition-colors select-none' : ''} ${col.className || ''}`}
                                    >
                                        <div className="flex items-center space-x-1">
                                            <span>{col.header}</span>
                                            {col.sortable && sortConfig?.key === col.accessorKey && (
                                                sortConfig?.direction === 'asc'
                                                    ? <ChevronUp className="w-3 h-3 text-indigo-400" />
                                                    : <ChevronDown className="w-3 h-3 text-indigo-400" />
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#333]">
                            {paginatedData.length > 0 ? (
                                paginatedData.map((item, rowIdx) => (
                                    <tr key={rowIdx} className="hover:bg-[#2A2A2A] transition-colors">
                                        {columns.map((col, colIdx) => (
                                            <td key={colIdx} className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                {col.cell ? col.cell(item) : (col.accessorKey ? String(item[col.accessorKey]) : '')}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={columns.length} className="px-6 py-8 text-center text-slate-500">
                                        No se encontraron datos.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats */}
                <div className="bg-[#1E1E1E] px-6 py-3 border-t border-[#333] flex items-center justify-between">
                    <div className="text-sm text-slate-400">
                        Mostrando <span className="font-medium text-slate-200">{Math.min((currentPage - 1) * pageSize + 1, sortedData.length)}</span> a <span className="font-medium text-slate-200">{Math.min(currentPage * pageSize, sortedData.length)}</span> de <span className="font-medium text-slate-200">{sortedData.length}</span> resultados
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-300"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-sm font-medium text-slate-300">
                            Página {currentPage} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1 rounded hover:bg-[#333] disabled:opacity-50 disabled:hover:bg-transparent transition-colors text-slate-300"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
