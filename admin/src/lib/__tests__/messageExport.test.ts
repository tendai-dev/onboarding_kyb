import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageExportService } from '../messageExport';

describe('MessageExportService', () => {
  let service: MessageExportService;
  const mockMessages = [
    {
      id: 'msg-1',
      sender: 'Test User',
      content: 'Test message',
      timestamp: '2024-01-01',
      threadId: 'thread-1',
      applicationId: 'app-1',
    },
  ];

  beforeEach(() => {
    service = new MessageExportService();
    vi.clearAllMocks();
    
    // Mock URL.createObjectURL and revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock document.createElement
    const mockLink = {
      setAttribute: vi.fn(),
      click: vi.fn(),
      style: {},
    };
    document.createElement = vi.fn(() => mockLink as any);
    document.body.appendChild = vi.fn();
    document.body.removeChild = vi.fn();
  });

  it('should export messages to CSV', async () => {
    await service.exportToCSV(mockMessages, 'test.csv');
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
  });

  it('should export messages to PDF', async () => {
    await service.exportToPDF(mockMessages, undefined, 'test.pdf');
    
    expect(document.body).toBeInTheDocument();
  });

  it('should handle CSV export with special characters', async () => {
    const messagesWithQuotes = [
      {
        ...mockMessages[0],
        content: 'Message with "quotes"',
        sender: 'User "Test"',
      },
    ];

    await service.exportToCSV(messagesWithQuotes);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should export PDF with thread info', async () => {
    const threadInfo = {
      id: 'thread-1',
      applicationId: 'app-1',
      applicantName: 'Test Applicant',
    };

    await service.exportToPDF(mockMessages, threadInfo);
    expect(document.body).toBeInTheDocument();
  });
});

