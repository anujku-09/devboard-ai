import { motion } from "framer-motion";

interface ButtonProps {
  children: React.ReactNode;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  className?: string;
}

const variantStyles: Record<string, string> = {
  primary:
    "bg-ember text-ink hover:bg-ember-dark disabled:hover:bg-ember",
  secondary:
    "bg-transparent border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5",
  danger:
    "bg-danger text-white hover:bg-danger/90",
};

function Button({
  children,
  type = "button",
  disabled = false,
  isLoading = false,
  loadingText = "Loading...",
  variant = "primary",
  onClick,
  className = "",
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={disabled ? undefined : { scale: 1.015 }}
      whileTap={disabled ? undefined : { scale: 0.985 }}
      transition={{ duration: 0.15 }}
      className={`w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 px-4 rounded-xl mt-3 sm:mt-4 text-xs sm:text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {isLoading ? loadingText : children}
    </motion.button>
  );
}

export default Button;
