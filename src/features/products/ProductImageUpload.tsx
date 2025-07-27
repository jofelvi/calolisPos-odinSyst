import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ProductFormData } from '@/features/types/schemaYup/productSchema';

interface ProductImageUploadProps {
  imagePreview: string | null;
  setImageFile: Dispatch<SetStateAction<File | null>>;
  setImagePreview: Dispatch<SetStateAction<string | null>>;
  register: UseFormRegister<ProductFormData>;
}

export default function ProductImageUpload({
  imagePreview,
  setImageFile,
  setImagePreview,
  register,
}: ProductImageUploadProps) {
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="md:col-span-2">
      <label
        htmlFor="imageFile"
        className="block text-sm font-semibold text-cyan-700 mb-3"
      >
        Imagen del Producto
      </label>
      <div className="space-y-4">
        {/* File Input Container */}
        <div className="relative">
          <input
            type="file"
            id="imageFile"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-600 bg-white/90 backdrop-blur-sm border border-cyan-200 rounded-xl shadow-sm transition-all duration-200 ease-in-out
                        file:mr-4 file:py-3 file:px-4
                        file:rounded-xl file:border-0
                        file:text-sm file:font-semibold
                        file:bg-gradient-to-r file:from-cyan-50 file:to-teal-50 file:text-cyan-700
                        hover:file:from-cyan-100 hover:file:to-teal-100
                        focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500
                        hover:border-cyan-300"
          />
        </div>
        <input type="hidden" {...register('imageUrl')} />

        {imagePreview && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-cyan-700">Vista previa:</p>
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-4 rounded-xl border border-gray-200">
              <img
                src={imagePreview}
                alt="Vista previa del producto"
                className="h-48 w-full object-contain rounded-lg shadow-sm bg-white"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
