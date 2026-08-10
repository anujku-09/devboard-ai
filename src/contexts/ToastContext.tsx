import {createContext} from "react";

interface ToastContextType{
    showToast:(message:string,            type:"success"|"error")=>void;
}


const ToastContext = createContext<ToastContextType | null>(null);

export default ToastContext;