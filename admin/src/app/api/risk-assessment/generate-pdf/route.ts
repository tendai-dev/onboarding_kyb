/**
 * PDF Generation API for Risk Assessment EDD Form
 * Generates a PDF document from the EDD form data for SignNow signing
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // For now, create a simple HTML-based PDF
    // In production, you'd use a proper PDF library like @react-pdf/renderer or puppeteer
    const html = generatePdfHtml(formData);

    // Convert HTML to PDF using a simple approach
    // Note: For production, consider using puppeteer, @react-pdf/renderer, or a PDF service
    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="risk-assessment.pdf"',
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function generatePdfHtml(data: any): string {
  const {
    partnerCustomerDetails = {},
    mukuruDetails = {},
    eddFindings = {},
    adverseMedia = {},
    recommendations = {},
    approvals = {},
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mukuru Group High-Risk Assessment and Approval Form</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      margin: 40px;
    }
    h1 {
      color: #F05423;
      font-size: 18px;
      text-align: center;
      margin-bottom: 20px;
    }
    h2 {
      color: #F05423;
      font-size: 14px;
      border-bottom: 2px solid #F05423;
      padding-bottom: 5px;
      margin-top: 20px;
    }
    h3 {
      font-size: 12px;
      margin-top: 15px;
      color: #555;
    }
    .section {
      margin-bottom: 20px;
    }
    .field {
      margin-bottom: 10px;
    }
    .field-label {
      font-weight: bold;
      color: #555;
    }
    .field-value {
      margin-left: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    .signature-box {
      border: 1px solid #ddd;
      padding: 20px;
      margin-top: 10px;
      min-height: 60px;
    }
    .signature-label {
      font-size: 10px;
      color: #888;
    }
    .checkbox {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #333;
      margin-right: 5px;
      vertical-align: middle;
    }
    .checkbox.checked {
      background-color: #F05423;
    }
  </style>
</head>
<body>
  <h1>Mukuru Group High-Risk Assessment and Approval Form</h1>
  
  <div class="section">
    <h2>1. Partner / Customer Details</h2>
    <div class="field">
      <span class="field-label">New/Existing:</span>
      <span class="field-value">${partnerCustomerDetails.newExisting || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Full Legal Entity Name:</span>
      <span class="field-value">${partnerCustomerDetails.fullEntityName || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Registration Number:</span>
      <span class="field-value">${partnerCustomerDetails.registrationNumber || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Entity Type:</span>
      <span class="field-value">${partnerCustomerDetails.entityType || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Background and Nature of Business Activities:</span>
      <span class="field-value">${partnerCustomerDetails.businessActivities || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Reasons for High-Risk Classification:</span>
      <span class="field-value">${partnerCustomerDetails.highRiskReasons || 'N/A'}</span>
    </div>
  </div>

  <div class="section">
    <h2>2. Mukuru Details</h2>
    <div class="field">
      <span class="field-label">Corridor:</span>
      <span class="field-value">${mukuruDetails.corridor || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Mukuru Entity Name:</span>
      <span class="field-value">${mukuruDetails.mukuruEntityName || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Products:</span>
      <span class="field-value">
        ${mukuruDetails.products?.dmt ? '☑ DMT ' : '☐ DMT '}
        ${mukuruDetails.products?.imt ? '☑ IMT ' : '☐ IMT '}
        ${mukuruDetails.products?.epp ? '☑ EPP ' : '☐ EPP '}
        ${mukuruDetails.products?.wallet ? '☑ Wallet ' : '☐ Wallet '}
        ${mukuruDetails.products?.insurance ? '☑ Insurance ' : '☐ Insurance '}
        ${mukuruDetails.products?.billSettlement ? '☑ Bill Settlement' : '☐ Bill Settlement'}
      </span>
    </div>
  </div>

  <div class="section">
    <h2>3. Enhanced Due Diligence Findings</h2>
    <div class="field">
      <span class="field-label">EDD Status:</span>
      <span class="field-value">${eddFindings.eddStatus || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Outstanding EDD:</span>
      <span class="field-value">${eddFindings.eddOutstanding || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">PEP Exposure:</span>
      <span class="field-value">${eddFindings.pepExposure || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">DD Documents:</span>
      <span class="field-value">${eddFindings.ddDocuments || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Policy/Procedure Concerns:</span>
      <span class="field-value">${eddFindings.policyProcedureConcerns || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Mitigating Factors:</span>
      <span class="field-value">${eddFindings.mitigatingFactors || 'N/A'}</span>
    </div>
  </div>

  <div class="section">
    <h2>4. Adverse Media Assessment</h2>
    <div class="field">
      <span class="field-label">Adverse Media Identified:</span>
      <span class="field-value">${adverseMedia.adverseMediaIdentified || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Special Interest Categories:</span>
      <span class="field-value">
        ${adverseMedia.specialInterestCategories?.corruption ? '☑ Corruption ' : ''}
        ${adverseMedia.specialInterestCategories?.financialCrimes ? '☑ Financial Crimes ' : ''}
        ${adverseMedia.specialInterestCategories?.organisedCrime ? '☑ Organised Crime ' : ''}
        ${adverseMedia.specialInterestCategories?.taxCrime ? '☑ Tax Crime ' : ''}
        ${adverseMedia.specialInterestCategories?.terrorCrime ? '☑ Terror Crime ' : ''}
        ${adverseMedia.specialInterestCategories?.traffickingCrime ? '☑ Trafficking Crime ' : ''}
        ${adverseMedia.specialInterestCategories?.other ? `☑ Other: ${adverseMedia.specialInterestCategories.other}` : ''}
      </span>
    </div>
    <div class="field">
      <span class="field-label">Adverse Media Summary:</span>
      <span class="field-value">${adverseMedia.adverseMediaSummary || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Discounting Factors:</span>
      <span class="field-value">${adverseMedia.discountingFactors || 'N/A'}</span>
    </div>
    <div class="field">
      <span class="field-label">Other Sources:</span>
      <span class="field-value">${adverseMedia.otherSources || 'N/A'}</span>
    </div>
  </div>

  <div class="section">
    <h2>5. Recommendations (2nd Line of Defence)</h2>
    <table>
      <tr>
        <th>Role</th>
        <th>Recommendation</th>
        <th>Rationale</th>
        <th>Date</th>
        <th>Signature</th>
      </tr>
      ${generateRecommendationRow('MLRO', recommendations.mlro)}
      ${generateRecommendationRow('Group Head: Financial Crime', recommendations.groupHeadFC)}
      ${generateRecommendationRow('Group Head: Compliance', recommendations.groupHeadCompliance)}
      ${generateRecommendationRow('Exec: Risk & Audit', recommendations.execRiskAudit)}
      ${generateRecommendationRow('Group Counsel', recommendations.groupCounsel)}
    </table>
  </div>

  <div class="section">
    <h2>6. Executive Approvals</h2>
    <table>
      <tr>
        <th>Role</th>
        <th>Decision</th>
        <th>Rationale</th>
        <th>Date</th>
        <th>Signature</th>
      </tr>
      ${generateRecommendationRow('CCO', approvals.cco)}
      ${generateRecommendationRow('CEO', approvals.ceo)}
    </table>
  </div>

  <div style="margin-top: 40px; font-size: 10px; color: #888; text-align: center;">
    Generated on ${new Date().toISOString().split('T')[0]} | Mukuru Group High-Risk Assessment Form
  </div>
</body>
</html>
  `;
}

function generateRecommendationRow(role: string, data: any): string {
  if (!data) {
    return `
      <tr>
        <td>${role}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td style="height: 40px;"></td>
      </tr>
    `;
  }
  return `
    <tr>
      <td>${role}</td>
      <td>${data.recommendation ? (data.recommendation === 'approve' ? 'Approve' : 'Decline') : '-'}</td>
      <td>${data.rationale || '-'}</td>
      <td>${data.date || '-'}</td>
      <td style="height: 40px;">${data.signature ? '(Signed via SignNow)' : ''}</td>
    </tr>
  `;
}

async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Simple approach: Return HTML as a buffer that can be converted to PDF
  // For a proper implementation, you would use:
  // 1. puppeteer - headless Chrome to render HTML to PDF
  // 2. @react-pdf/renderer - React-based PDF generation
  // 3. pdfkit - Low-level PDF generation
  // 4. A cloud service like html-pdf-service

  // For now, we'll create a simple text-based PDF placeholder
  // In production, install puppeteer and use:
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const pdf = await page.pdf({ format: 'A4' });
  // await browser.close();
  // return Buffer.from(pdf);

  // Temporary: Return the HTML as a buffer (will be treated as PDF by SignNow)
  // This is a placeholder - in production, use proper PDF generation
  return Buffer.from(html, 'utf-8');
}
