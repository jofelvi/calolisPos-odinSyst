import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ProductFormData } from '@/app/components/types/schemaYup/productSchema';

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
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Imagen del Producto
      </label>
      <div className="flex flex-col space-y-2">
        <input
          type="file"
          id="imageFile"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
        />
        <input type="hidden" {...register('imageUrl')} />

        {imagePreview && (
          <div className="mt-2">
            <p className="text-sm text-gray-500 mb-1">Vista previa:</p>
            <img
              src={imagePreview}
              alt="Vista previa"
              className="h-40 object-contain border border-gray-200 rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
}
