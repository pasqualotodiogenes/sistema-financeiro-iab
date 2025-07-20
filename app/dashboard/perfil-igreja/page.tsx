"use client";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { useChurchProfile } from '@/components/ui/church-profile-context';
import Image from 'next/image';

export default function PerfilIgrejaPage() {
  const { user } = useAuth();
  const { image, setImage, refreshImage } = useChurchProfile();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const canEdit = user && ['root', 'admin', 'editor'].includes(user.role);

  useEffect(() => {
    setLocalPreview(null);
  }, [image]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setLocalPreview(URL.createObjectURL(e.target.files[0]));
      setSuccess(false);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setSuccess(false);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/church/avatar', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      setImage(data.image);
      setSuccess(true);
      setFile(null);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      await refreshImage();
    } else {
      setError(data.error || 'Erro ao enviar imagem');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    const res = await fetch('/api/church/avatar', { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      setImage(null);
      setSuccess(true);
      setFile(null);
      setLocalPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      await refreshImage();
    } else {
      setError(data.error || 'Erro ao remover imagem');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 flex flex-col gap-8 items-center justify-center min-h-[60vh]">
      <h1 className="text-3xl font-bold mb-2 text-center">Perfil da Igreja</h1>
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="relative w-44 h-44 rounded-full overflow-hidden border-4 border-cream-400 bg-gray-100 flex items-center justify-center shadow-lg">
          {localPreview ? (
            <Image src={localPreview} alt="Preview" fill className="object-cover" sizes="176px" />
          ) : image ? (
            <Image src={image} alt="Logo da igreja" fill className="object-cover" sizes="176px" />
          ) : (
            <span className="text-gray-400 text-lg">Sem imagem</span>
          )}
        </div>
        {canEdit && (
          <div className="flex flex-col items-center gap-3 w-full">
            <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cream-200 file:text-primary-700 hover:file:bg-cream-300" />
            <div className="flex gap-2 w-full max-w-xs">
              <Button onClick={handleUpload} disabled={loading || !file} className="flex-1">
                {loading ? 'Enviando...' : 'Trocar imagem'}
              </Button>
              <Button onClick={handleDelete} disabled={loading || (!image && !localPreview)} variant="destructive" className="flex-1">
                Remover imagem
              </Button>
            </div>
            {success && <span className="text-green-600 text-sm mt-1">Ação realizada com sucesso!</span>}
            {error && <span className="text-red-600 text-sm mt-1">{error}</span>}
          </div>
        )}
      </div>
    </div>
  );
} 