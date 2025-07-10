import { JSX } from 'react';

export interface CustomToasterProps {
  variant: 'success' | 'error' | 'warning' | 'information';
  isVisible: boolean;
  title: string;
  description: string;
}

const CustomToaster = ({
  variant,
  description,
  isVisible,
  title,
}: CustomToasterProps): JSX.Element => {
  const VARIANTS = {
    success: {
      icon: 'icon-check bg-success-400 text-success-200',
    },
    error: {
      icon: 'icon-x-circle bg-warning-300 text-warning-100',
    },
    warning: {
      icon: 'bg-caution-200  text-caution-100 icon-warning',
    },
    information: {
      icon: 'bg-info-200 text-info-100 icon-info',
    },
  };

  return (
    <div
      className={`bg-white px-2.5 py-4 shadow-md rounded-[1.25rem] min-w-[18.75rem] md:min-w-[29.1875rem] ${
        isVisible ? 'animate-enter' : 'animate-leave'
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 md:h-16 md:w-16 text-lg md:text-2xl flex items-center  justify-center rounded-[1.25rem] ${VARIANTS[variant].icon}`}
        />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium">{title}</h2>
          <p className="text-xs font-normal text-base-200 max-w-80">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomToaster;
