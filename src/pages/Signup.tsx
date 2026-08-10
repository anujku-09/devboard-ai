import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MailCheck, Sparkles } from "lucide-react";

import Input from "../components/Input";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { signupSchema } from "../schemas/authSchema";
import type { SignupFormData } from "../schemas/authSchema";

import logoSvg from "../assets/logo.svg";

function Signup() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { username: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: SignupFormData) {
    try {
      const result = await signUp(data.email, data.password, data.username);

      if (result.requiresEmailConfirmation) {
        setConfirmationSentTo(data.email);
        showToast("Check your email to confirm your account", "success");
      } else {
        showToast("Account created successfully", "success");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to create your account right now.";
      showToast(message.includes("already registered") ? "An account with this email already exists." : message, "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-paper dark:bg-ink relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-ember/20 blur-3xl dark:bg-ember/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-signal/20 blur-3xl dark:bg-signal/10" />

      <AnimatePresence mode="wait">
        {confirmationSentTo ? (
          <motion.div
            key="confirmation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-surface-dark/85 backdrop-blur-xl shadow-2xl p-5 sm:p-8 text-center space-y-4"
          >
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-2xl bg-signal/15 text-signal border border-signal/20 shadow-xs">
              <MailCheck size={28} />
            </div>

            <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Check your email
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              We've sent a confirmation link to{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200 break-all">
                {confirmationSentTo}
              </span>
              . Confirm your account, then log in to start building.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ember text-ink text-xs sm:text-sm font-semibold hover:bg-ember-dark transition-colors shadow-xs"
            >
              Back to Login
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white/85 dark:bg-surface-dark/85 backdrop-blur-xl shadow-2xl p-5 sm:p-8"
          >
            {/* Brand Header */}
            <div className="text-center space-y-2 mb-5">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-slate-100 dark:bg-white/10 p-2 flex items-center justify-center border border-slate-200/60 dark:border-white/10 shadow-xs">
                <img src={logoSvg} alt="DevBoard AI Logo" className="h-full w-full object-contain" />
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center justify-center">
                DevBoard<span className="brand-cursor h-6 align-middle" />
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                <span>Create your developer workspace</span>
                <Sparkles size={12} className="text-ember shrink-0" />
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <Input
                label="Username"
                type="text"
                placeholder="alex_dev"
                error={errors.username?.message}
                {...register("username")}
              />

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
                placeholder="At least 6 characters"
                error={errors.password?.message}
                {...register("password")}
              />

              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Creating account..."
              >
                Create Free Account
              </Button>
            </form>

            <p className="text-center text-slate-500 dark:text-slate-400 mt-5 pt-4 border-t border-slate-200/60 dark:border-white/10 text-xs sm:text-sm">
              Already have an account?{" "}
              <Link to="/" className="text-ember font-semibold hover:underline">
                Log in
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Signup;
