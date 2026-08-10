import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import Input from "../components/Input";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { forgotPasswordSchema } from "../schemas/authSchema";
import type { ForgotPasswordFormData } from "../schemas/authSchema";

function ForgotPassword() {
  const { showToast } = useToast();
  const { sendPasswordResetEmail } = useAuth();
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    try {
      await sendPasswordResetEmail(data.email);
      setEmailSentTo(data.email);
      reset({ email: "" });
      showToast("Password reset email sent", "success");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to send a password reset email.";
      showToast(message, "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-paper dark:bg-ink relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ember/20 blur-3xl dark:bg-ember/10" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-signal/20 blur-3xl dark:bg-signal/10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-surface-dark/70 backdrop-blur-xl shadow-xl p-8"
      >
        <h1 className="font-display text-3xl font-bold text-center text-slate-900 dark:text-white">
          Reset password
        </h1>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-2">
          Enter your email and we’ll send a secure link to continue.
        </p>

        {emailSentTo ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            We sent a reset link to <span className="font-semibold">{emailSentTo}</span>. Check your inbox and follow the instructions.
          </div>
        ) : (
          <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="Email"
              type="email"
              error={errors.email?.message}
              {...register("email")}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="Sending..."
            >
              Send reset link
            </Button>
          </form>
        )}

        <p className="text-center text-slate-500 dark:text-slate-400 mt-6 text-sm">
          <Link to="/" className="text-ember font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default ForgotPassword;
