import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SweetAlert } from '../sweetAlert';
import Swal from 'sweetalert2';

// Mock SweetAlert2
vi.mock('sweetalert2', () => ({
  default: {
    fire: vi.fn(),
    showLoading: vi.fn(),
    close: vi.fn(),
  },
}));

describe('SweetAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('confirm', () => {
    it('should show confirm dialog', async () => {
      (Swal.fire as any).mockResolvedValueOnce({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false,
      });

      const result = await SweetAlert.confirm('Test Title', 'Test Message');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          text: 'Test Message',
          icon: 'question',
          showCancelButton: true,
        })
      );
      expect(result.isConfirmed).toBe(true);
    });

    it('should handle confirmed action', async () => {
      (Swal.fire as any).mockResolvedValueOnce({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false,
      });

      const result = await SweetAlert.confirm('Delete?', 'Are you sure?');

      expect(result.isConfirmed).toBe(true);
      expect(result.isDenied).toBe(false);
      expect(result.isDismissed).toBe(false);
    });

    it('should handle cancelled action', async () => {
      (Swal.fire as any).mockResolvedValueOnce({
        isConfirmed: false,
        isDenied: false,
        isDismissed: true,
      });

      const result = await SweetAlert.confirm('Delete?', 'Are you sure?');

      expect(result.isConfirmed).toBe(false);
      expect(result.isDismissed).toBe(true);
    });

    it('should use custom button texts', async () => {
      (Swal.fire as any).mockResolvedValueOnce({
        isConfirmed: true,
        isDenied: false,
        isDismissed: false,
      });

      await SweetAlert.confirm('Test', 'Message', 'Yes', 'No');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
        })
      );
    });

    it('should handle different icon types', async () => {
      const icons = ['warning', 'error', 'info', 'question'] as const;
      
      for (const icon of icons) {
        vi.clearAllMocks();
        (Swal.fire as any).mockResolvedValueOnce({
          isConfirmed: true,
          isDenied: false,
          isDismissed: false,
        });

        await SweetAlert.confirm('Test', 'Message', 'Yes', 'No', icon);

        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon,
          })
        );
      }
    });
  });

  describe('success', () => {
    it('should show success alert', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.success('Success!', 'Operation completed');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success!',
          text: 'Operation completed',
          icon: 'success',
        })
      );
    });

    it('should handle success without text', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.success('Success!');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Success!',
          text: undefined,
          icon: 'success',
        })
      );
    });
  });

  describe('error', () => {
    it('should show error alert', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.error('Error!', 'Something went wrong');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error!',
          text: 'Something went wrong',
          icon: 'error',
        })
      );
    });

    it('should handle error without text', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.error('Error!');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error!',
          text: undefined,
          icon: 'error',
        })
      );
    });
  });

  describe('warning', () => {
    it('should show warning alert', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.warning('Warning!', 'Please be careful');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Warning!',
          text: 'Please be careful',
          icon: 'warning',
        })
      );
    });
  });

  describe('info', () => {
    it('should show info alert', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.info('Info', 'Here is some information');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Info',
          text: 'Here is some information',
          icon: 'info',
        })
      );
    });
  });

  describe('loading', () => {
    it('should show loading alert', () => {
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
      expect(Swal.showLoading).toHaveBeenCalled();
    });

    it('should handle loading without text', () => {
      SweetAlert.loading('Loading...');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Loading...',
          text: undefined,
        })
      );
    });
  });

  describe('close', () => {
    it('should close alert', () => {
      SweetAlert.close();

      expect(Swal.close).toHaveBeenCalled();
    });
  });

  describe('alert', () => {
    it('should show alert with default icon', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.alert('Alert', 'Message');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Alert',
          text: 'Message',
          icon: 'info',
        })
      );
    });

    it('should show alert with custom icon', async () => {
      (Swal.fire as any).mockResolvedValueOnce({});

      await SweetAlert.alert('Alert', 'Message', 'success');

      expect(Swal.fire).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Alert',
          text: 'Message',
          icon: 'success',
        })
      );
    });

    it('should handle all icon types', async () => {
      const icons = ['success', 'error', 'warning', 'info', 'question'] as const;
      
      for (const icon of icons) {
        vi.clearAllMocks();
        (Swal.fire as any).mockResolvedValueOnce({});

        await SweetAlert.alert('Alert', 'Message', icon);

        expect(Swal.fire).toHaveBeenCalledWith(
          expect.objectContaining({
            icon,
          })
        );
      }
    });
  });
});
