import { describe, it, expect, vi, beforeEach } from 'vitest';
import Swal from 'sweetalert2';
import { SweetAlert } from '../sweetAlert';

// Mock sweetalert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    question: vi.fn(),
    close: vi.fn(),
  },
}));

describe('SweetAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('success', () => {
    it('should call Swal.fire with success configuration', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
      await SweetAlert.success('Success!', 'Operation completed');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'success',
          title: 'Success!',
          text: 'Operation completed',
        })
      );
    });
  });

  describe('error', () => {
    it('should call Swal.fire with error configuration', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
      await SweetAlert.error('Error!', 'Something went wrong');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'error',
          title: 'Error!',
          text: 'Something went wrong',
        })
      );
    });
  });

  describe('warning', () => {
    it('should call Swal.fire with warning configuration', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
      await SweetAlert.warning('Warning!', 'Please be careful');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'warning',
          title: 'Warning!',
          text: 'Please be careful',
        })
      );
    });
  });

  describe('info', () => {
    it('should call Swal.fire with info configuration', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
      await SweetAlert.info('Info', 'Here is some information');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'info',
          title: 'Info',
          text: 'Here is some information',
        })
      );
    });
  });

  describe('confirm', () => {
    it('should call Swal.fire with confirm configuration', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: true });
      const result = await SweetAlert.confirm('Confirm', 'Are you sure?');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: 'question',
          title: 'Confirm',
          text: 'Are you sure?',
          showCancelButton: true,
        })
      );
      expect(result.isConfirmed).toBe(true);
    });

    it('should return false when user cancels', async () => {
      (Swal.fire as any).mockResolvedValue({ isConfirmed: false });
      const result = await SweetAlert.confirm('Confirm', 'Are you sure?');
      expect(result.isConfirmed).toBe(false);
    });
  });

  describe('loading', () => {
    it('should call Swal.fire with loading configuration', () => {
      SweetAlert.loading('Loading...', 'Please wait');
      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Loading...',
          text: 'Please wait',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
        })
      );
    });
  });

  describe('close', () => {
    it('should call Swal.close', () => {
      SweetAlert.close();
      expect(Swal.close).toHaveBeenCalled();
    });
  });
});

