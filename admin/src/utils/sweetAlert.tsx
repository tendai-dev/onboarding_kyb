'use client';

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
  alert: (
    title: string,
    text?: string,
    icon?: 'success' | 'error' | 'warning' | 'info' | 'question'
  ) => Promise<void>;
}

// Static API for SweetAlert
export const SweetAlert: SweetAlertContextType = {
  confirm: async (
    title,
    text,
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    icon = 'question'
  ) => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      confirmButtonColor: '#F05423', // Mukuru primary
      cancelButtonColor: '#6B7280', // Mukuru grey-medium
      reverseButtons: true,
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        cancelButton: 'mukuru-swal-cancel',
        icon: 'mukuru-swal-icon',
      },
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
      confirmButtonColor: '#F05423', // Mukuru primary
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        icon: 'mukuru-swal-icon',
      },
    });
  },
  error: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonColor: '#F05423', // Mukuru primary
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        icon: 'mukuru-swal-icon',
      },
    });
  },
  warning: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'warning',
      confirmButtonColor: '#F05423', // Mukuru primary
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        icon: 'mukuru-swal-icon',
      },
    });
  },
  info: async (title, text) => {
    await Swal.fire({
      title,
      text,
      icon: 'info',
      confirmButtonColor: '#F05423', // Mukuru primary
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        icon: 'mukuru-swal-icon',
      },
    });
  },
  loading: (title, text) => {
    Swal.fire({
      title,
      text,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        icon: 'mukuru-swal-icon',
      },
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
      confirmButtonColor: '#F05423', // Mukuru primary
      customClass: {
        popup: 'mukuru-swal-popup',
        title: 'mukuru-swal-title',
        htmlContainer: 'mukuru-swal-html',
        confirmButton: 'mukuru-swal-confirm',
        icon: 'mukuru-swal-icon',
      },
    });
  },
};
