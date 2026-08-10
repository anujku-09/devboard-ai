import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import Input from "../components/Input";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { loginSchema } from "../schemas/authSchema";
import type { LoginFormData } from "../schemas/authSchema";

import logoSvg from "../assets/logo.svg";

function Login() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormData) {
    try {
      await login(data.email, data.password);
      showToast("Login successful", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to log in right now.";
      const friendlyMessage = message.includes("Email not confirmed")
        ? "Please confirm your email before signing in."
        : message.includes("Invalid login credentials")
          ? "Invalid email or password."
          : message;
      showToast(friendlyMessage, "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper dark:bg-ink relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ember/20 blur-3xl dark:bg-ember/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-signal/20 blur-3xl dark:bg-signal/10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-surface-dark/85 backdrop-blur-xl shadow-2xl p-5 sm:p-8"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 p-2 flex items-center justify-center border border-slate-200/60 dark:border-white/10 shadow-xs">
            <img src={logoSvg} alt="DevBoard AI Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center">
            DevBoard<span className="brand-cursor h-6 align-middle" />
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <span>Welcome back — let's ship something</span>
            <Sparkles size={12} className="text-ember shrink-0" />
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="developer@workspace.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register("password")}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Logging in..."
          >
            Log in to Workspace
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          <Link to="/forgot-password" className="text-ember font-medium hover:underline">
            Forgot password?
          </Link>
          <p className="text-slate-500 dark:text-slate-400">
            Don't have an account?{" "}
            <Link to="/signup" className="text-ember font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default Login;
