// Message Export Service
// This service handles exporting messages to PDF and CSV formats

export interface ExportOptions {
  format: 'pdf' | 'csv';
  includeAttachments?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  threadIds?: string[];
}

export class MessageExportService {
  public async exportToCSV(
    messages: Array<{
      id: string;
      sender: string;
      content: string;
      timestamp: string;
      threadId: string;
      applicationId: string;
    }>,
    filename: string = 'messages.csv'
  ): Promise<void> {
    // Create CSV header
    const headers = ['ID', 'Thread ID', 'Application ID', 'Sender', 'Content', 'Timestamp', 'Is Read'];
    const rows = messages.map(msg => [
      msg.id,
      msg.threadId,
      msg.applicationId,
      `"${msg.sender.replace(/"/g, '""')}"`,
      `"${msg.content.replace(/"/g, '""')}"`,
      msg.timestamp,
      'false' // You can add isRead if available
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  public async exportToPDF(
    messages: Array<{
      id: string;
      sender: string;
      content: string;
      timestamp: string;
      threadId: string;
      applicationId: string;
      subject?: string;
    }>,
    threadInfo?: {
      id: string;
      applicationId: string;
      applicantName?: string;
    },
    filename: string = 'messages.pdf'
  ): Promise<void> {
    // For PDF export, we'll use a simple HTML to PDF approach
    // In production, you might want to use a library like jsPDF or pdfkit
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Messages Export</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              color: #f76834;
              border-bottom: 2px solid #f76834;
              padding-bottom: 10px;
            }
            .thread-info {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .message {
              border-left: 3px solid #3182ce;
              padding: 15px;
              margin-bottom: 15px;
              background: #fafafa;
            }
            .message-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              font-weight: bold;
              color: #666;
            }
            .message-content {
              color: #333;
              white-space: pre-wrap;
            }
            .timestamp {
              color: #999;
              font-size: 0.9em;
            }
          </style>
        </head>
        <body>
          <h1>Messages Export</h1>
          ${threadInfo ? `
            <div class="thread-info">
              <strong>Thread ID:</strong> ${threadInfo.id}<br>
              <strong>Application ID:</strong> ${threadInfo.applicationId}<br>
              ${threadInfo.applicantName ? `<strong>Applicant:</strong> ${threadInfo.applicantName}<br>` : ''}
            </div>
          ` : ''}
          ${messages.map(msg => `
            <div class="message">
              <div class="message-header">
                <span>From: ${msg.sender}</span>
                <span class="timestamp">${new Date(msg.timestamp).toLocaleString()}</span>
              </div>
              <div class="message-content">${msg.content.replace(/\n/g, '<br>')}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  public async exportThread(
    messages: Array<{
      id: string;
      sender: string;
      content: string;
      timestamp: string;
      threadId: string;
      applicationId: string;
      subject?: string;
    }>,
    threadInfo: {
      id: string;
      applicationId: string;
      applicantName?: string;
    },
    format: 'pdf' | 'csv',
    filename?: string
  ): Promise<void> {
    if (format === 'csv') {
      await this.exportToCSV(messages, filename || `thread-${threadInfo.id}.csv`);
    } else {
      await this.exportToPDF(messages, threadInfo, filename || `thread-${threadInfo.id}.pdf`);
    }
  }
}

export const messageExportService = new MessageExportService();

