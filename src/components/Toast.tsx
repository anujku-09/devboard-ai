import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

function Toast({
  message,
  type,
  onClose,
}: ToastProps) {

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = type === "success" ? CheckCircle2 : XCircle;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl text-white shadow-xl backdrop-blur-sm ${
        type === "success" ? "bg-signal" : "bg-danger"
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{message}</span>
    </motion.div>
  );
}

export default Toast;
