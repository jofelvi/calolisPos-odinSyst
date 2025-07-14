import { Button } from '@/components/shared/button/Button';

interface FormActionsProps {
  isSubmitting: boolean;
  isNew: boolean;
  onCancel: () => void;
}

export default function FormActions({
  isSubmitting,
  isNew,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex justify-end space-x-3 pt-6 border-t border-cyan-100">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        disabled={isSubmitting}
        className="bg-white/80 border-cyan-200 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-300"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-lg"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {isNew ? 'Creando...' : 'Actualizando...'}
          </span>
        ) : isNew ? (
          'Crear Producto'
        ) : (
          'Actualizar Producto'
        )}
      </Button>
    </div>
  );
}
