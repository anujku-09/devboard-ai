import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import ToastContext from "./ToastContext";
import Toast from "../components/Toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

function ToastProvider({ children }: ToastProviderProps) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"success" | "error">("success");

  function showToast(
    message: string,
    type: "success" | "error"
  ) {
    setMessage(message);
    setType(type);
    setShow(true);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <AnimatePresence>
        {show && (
          <Toast
            message={message}
            type={type}
            onClose={() => setShow(false)}
          />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export default ToastProvider;