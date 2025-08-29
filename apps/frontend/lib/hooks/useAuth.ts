import { useMutation } from "@tanstack/react-query";
import { AuthService } from "../api/auth-service";
import type { LoginDto, AuthResultDto } from "../../types/auth";
import { SignupRequest, SendPasswordResetCodeRequest,
  VerifyPasswordResetTokenRequest,
  ResetPasswordRequest,
  AuthResponse, } from "@/types/auth";

export function useLogin() {
  return useMutation<AuthResultDto, Error, LoginDto>({
    mutationFn: async (data: LoginDto) => {
      return await AuthService.login(data);
    }
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      return await AuthService.authenticatedFetch("/api/Auth/register", {
        method: 'POST',
        data: data
      });
    }
  });
}

export function useForgot() {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      return await AuthService.authenticatedFetch("/api/Email/password-reset", {
        method: 'POST',
        data: data
      });
    }
  });
}

export function useReset() {
  return useMutation({
    mutationFn: async (data: { token: string; password: string }) => {
      // This endpoint might not exist yet - check with backend team
      return await AuthService.authenticatedFetch("/api/Auth/reset-password", {
        method: 'POST',
        data: data
      });
    }
  });
}

export function useSendPasswordResetCode() {
  return useMutation<AuthResponse, Error, SendPasswordResetCodeRequest>({
    mutationFn: async (data: SendPasswordResetCodeRequest) => {
      return await AuthService.authenticatedFetch("/api/Email/password-reset", {
        method: 'POST',
        data: data
      });
    },
  });
}

export function useVerifyPasswordResetToken() {
  return useMutation<boolean, Error, VerifyPasswordResetTokenRequest>({
    mutationFn: async (data: VerifyPasswordResetTokenRequest) => {
      // This endpoint might not exist yet - check with backend team
      return await AuthService.authenticatedFetch("/api/Auth/verify-reset-token", {
        method: 'POST',
        data: data
      });
    },
  });
}

export function useResetPassword() {
  return useMutation<AuthResponse, Error, ResetPasswordRequest>({
    mutationFn: async (data: ResetPasswordRequest) => {
      // This endpoint might not exist yet - check with backend team
      return await AuthService.authenticatedFetch("/api/Auth/reset-password", {
        method: 'POST',
        data: data
      });
    },
  });
}