import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import axios from 'axios';

interface FileUploadProps {
    onUploadSuccess: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        await uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // Success
            onUploadSuccess();
            setIsOpen(false);
            const { processed, skipped } = response.data;
            alert(`Importación completada.\n\n✅ Procesados: ${processed}\n⏭️ Saltados (Duplicados/Erróneos): ${skipped}`);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al procesar el archivo');
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await uploadFile(file);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
                <FileSpreadsheet className="w-5 h-5" />
                Importar Excel / CSV
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1E1E1E] rounded-xl border border-[#333] shadow-2xl w-full max-w-lg p-6 relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className="text-xl font-bold text-slate-100 mb-2">Importar Transacciones</h3>
                        <p className="text-slate-400 mb-6 text-sm">Soporta múltiples hojas, archivos .xlsx y .csv</p>

                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-lg p-10 text-center transition-colors ${isDragOver
                                ? 'border-indigo-500 bg-indigo-500/10'
                                : 'border-[#444] hover:border-indigo-400 hover:bg-[#2A2A2A]'
                                }`}
                        >
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".xlsx,.xls,.csv"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />

                            {uploading ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <Upload className="w-12 h-12 text-indigo-400 mb-4" />
                                    <p className="text-indigo-300 font-medium">Procesando archivo...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                    <p className="text-slate-300 font-medium">
                                        Arrastra tu archivo aquí o haz clic
                                    </p>
                                    <p className="text-sm text-slate-500 mt-2">.xlsx, .xls, .csv</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
