import { forwardRef } from "react";

interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
    label: string;
    error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
    { label, error, ...rest },
    ref
) {
    return (
        <div className="w-full">
            <label className="block mb-1 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>

            <input
                ref={ref}
                className={`w-full rounded-xl px-3 py-2 sm:px-4 sm:py-2 border outline-none text-xs sm:text-sm transition-colors
                    bg-white dark:bg-surface-dark-raised
                    text-slate-900 dark:text-slate-100
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    ${
                        error
                            ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                            : "border-slate-300 dark:border-white/10 focus:border-ember focus:ring-2 focus:ring-ember/20"
                    }`}
                {...rest}
            />

            {error && (
                <p className="text-danger text-xs sm:text-sm mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

export default Input;
