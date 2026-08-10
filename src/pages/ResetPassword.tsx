import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import Input from "../components/Input";
import Button from "../components/Button";
import { useToast } from "../hooks/useToast";
import { useAuth } from "../hooks/useAuth";
import { passwordChangeSchema } from "../schemas/authSchema";
import type { PasswordChangeFormData } from "../schemas/authSchema";
import { supabase } from "../lib/supabase";

function ResetPassword() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    async function initialize() {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          setReady(true);
          return;
        }

        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            setReady(true);
            return;
          }
        }

        showToast("This reset link is invalid or expired.", "error");
      } catch (error) {
        console.error(error);
        showToast("Unable to verify your reset link.", "error");
      }
    }

    initialize();
  }, [showToast]);

  async function onSubmit(data: PasswordChangeFormData) {
    try {
      await updatePassword(data.password);
      reset({ password: "", confirmPassword: "" });
      showToast("Password updated successfully", "success");
      navigate("/");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unable to update your password.";
      showToast(message, "error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-paper dark:bg-ink relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-ember/20 blur-3xl dark:bg-ember/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-signal/20 blur-3xl dark:bg-signal/10" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-surface-dark/70 backdrop-blur-xl shadow-xl p-8"
      >
        <h1 className="font-display text-3xl font-bold text-center text-slate-900 dark:text-white">
          Choose a new password
        </h1>

        <p className="text-center text-slate-500 dark:text-slate-400 mt-2">
          Create a strong password to secure your account.
        </p>

        {!ready ? (
          <div className="mt-6 flex justify-center">
            <div className="h-8 w-8 rounded-full border-2 border-ember border-t-transparent animate-spin" />
          </div>
        ) : (
          <form className="mt-6" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="New Password"
              type="password"
              error={errors.password?.message}
              {...register("password")}
            />

            <Input
              label="Confirm Password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register("confirmPassword")}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="Updating..."
            >
              Update password
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

export default ResetPassword;
