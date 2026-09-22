import zunaLogo from "../assets/zuna-logo.png";

/**
 * Adds an executive, highly attractive standard header to any jsPDF document.
 * Includes top accent bar, modern corporate branding, company logo, Zuna badge,
 * document title banner with accent badge, metadata, and divider line.
 * 
 * @param {jsPDF} doc - The jsPDF instance
 * @param {string} titleText - The main document title
 * @param {string} subtitleText - Optional subtitle or description
 * @param {boolean} isLandscape - Whether the document is in landscape mode
 * @returns {Promise<number>} - The Y-coordinate where subsequent content (e.g. table) should start
 */
export const addStandardPDFHeader = async (doc, titleText, subtitleText, isLandscape = false) => {
  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Top Decorative Brand Bar (Indigo & Sky Blue dual accent ribbons)
  doc.setFillColor(79, 70, 229); // Royal Indigo #4F46E5
  doc.rect(0, 0, pageWidth, 3.5, "F");
  
  doc.setFillColor(59, 130, 246); // Accent Sky Blue #3B82F6
  doc.rect(0, 3.5, pageWidth, 0.8, "F");

  // 2. Company Brand Emblem (Geometric rounded icon with checkmark)
  const emblemX = 14;
  const emblemY = 9;
  
  // Outer soft rounded square / circle
  doc.setFillColor(79, 70, 229);
  doc.roundedRect(emblemX, emblemY, 11, 11, 2.8, 2.8, "F");
  
  // Inner checkmark in crisp white
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1.1);
  doc.line(emblemX + 2.8, emblemY + 5.5, emblemX + 4.8, emblemY + 7.8);
  doc.line(emblemX + 4.8, emblemY + 7.8, emblemX + 8.4, emblemY + 3.4);

  // 3. Company Typography
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("CARREZZA GLOBAL SOLUTIONS", emblemX + 14, emblemY + 5.2);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("Enterprise Workforce & Project Management Suite", emblemX + 14, emblemY + 9.2);

  // 4. Right-side: Zuna Logo & Timestamp Pill
  const rightMargin = 14;
  
  // Load Zuna Logo
  try {
    const img = new Image();
    img.src = zunaLogo;
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });

    if (img.complete && img.naturalWidth > 0) {
      const logoWidth = 18;
      const logoHeight = logoWidth * (img.naturalHeight / img.naturalWidth);
      const logoX = pageWidth - logoWidth - rightMargin;
      doc.addImage(img, "PNG", logoX, emblemY, logoWidth, logoHeight);

      // Zuna sub-caption
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(148, 163, 184); // Slate-400
      doc.text("POWERED BY ZUNA", logoX + logoWidth, emblemY + logoHeight + 3.2, { align: "right" });
    }
  } catch (e) {
    // Fallback if image fails
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(79, 70, 229);
    doc.text("ZUNA", pageWidth - rightMargin, emblemY + 5, { align: "right" });
  }

  // 5. Document Title Banner Section
  let currentY = 26;

  // Background subtle card for title
  doc.setFillColor(248, 250, 252); // Slate-50
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.3);
  
  const titleBoxHeight = subtitleText ? 15 : 11;
  doc.roundedRect(14, currentY, pageWidth - 28, titleBoxHeight, 2, 2, "FD");

  // Vertical Accent Indicator Bar
  doc.setFillColor(79, 70, 229); // Royal Indigo
  doc.roundedRect(14, currentY, 3, titleBoxHeight, 1, 1, "F");

  // Main Title Text
  if (titleText) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text(titleText.toUpperCase(), 21, currentY + 6.2);
  }

  // Subtitle / Description Text
  if (subtitleText) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(subtitleText, 21, currentY + 11.2);
  }

  // Generated date tag on the right side of the title banner
  const dateStr = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`DATE: ${dateStr}`, pageWidth - rightMargin - 4, currentY + 6.2, { align: "right" });

  // Return the Y coordinate where the content/table should start
  return currentY + titleBoxHeight + 6;
};

/**
 * Adds an executive footer with confidentiality notice and page numbering (Page X of Y)
 * to all pages of the document.
 * 
 * @param {jsPDF} doc - The jsPDF instance
 */
export const addPDFFooter = (doc) => {
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    // Left: Company Confidentiality Notice
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text("Carrezza Global Solutions Pvt Ltd · Official Internal Document · Confidential", 14, pageHeight - 6.5);

    // Right: Page Numbers Badge
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6.5, { align: "right" });
  }
};
