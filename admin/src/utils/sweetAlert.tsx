"use client";

import Swal from 'sweetalert2';

interface ConfirmResult {
  isConfirmed: boolean;
  isDenied: boolean;
  isDismissed: boolean;
}

interface SweetAlertContextType {
  confirm: (
    title: string,
    text: string,
    confirmButtonText?: string,
    cancelButtonText?: string,
    icon?: 'warning' | 'error' | 'info' | 'question'
  ) => Promise<ConfirmResult>;
  success: (title: string, text?: string) => Promise<void>;
  error: (title: string, text?: string) => Promise<void>;
  warning: (title: string, text?: string) => Promise<void>;
  info: (title: string, text?: string) => Promise<void>;
  loading: (title: string, text?: string) => void;
  close: () => void;
  alert: (title: string, text?: string, icon?: 'success' | 'error' | 'warning' | 'info' | 'question') => Promise<void>;
}

// Static API for SweetAlert
export const SweetAlert: SweetAlertContextType = {
  confirm: async (title, text, confirmButtonText = 'Yes', cancelButtonText = 'Cancel', icon = 'question') => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      reverseButtons: true,
    });

    return {
      isConfirmed: result.isConfirmed,
      isDenied: result.isDenied,
      isDismissed: result.isDismissed,
    };
  },
  success: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonColor: '#3085d6',
    });
  },
  error: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#d33',
    });
  },
  warning: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#f59e0b',
    });
  },
  info: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#3085d6',
    });
  },
  loading: (title, text) => {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },
  close: () => {
    Swal.close();
  },
  alert: async (title, text, icon = 'info') => {
    await Swal.fire({
      title,
      text,
      icon,
      confirmButtonColor: '#3085d6',
    });
  },
};
