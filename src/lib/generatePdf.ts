import { toPng } from 'html-to-image';
import jsPDF from "jspdf";

export const generatePdfFromElement = async (
  elementId: string,
  filename: string
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return false;
    }

    // Capture the element using html-to-image (supports modern CSS colors like lab/oklch via SVG foreignObject)
    const imgData = await toPng(element, {
      pixelRatio: 2, // 2x scale for better quality on retina displays
      backgroundColor: "#ffffff",
    });

    // Initialize jsPDF with A4 size
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Calculate dimensions to fit the A4 page perfectly
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // A4 height is 297mm, but we'll calculate based on aspect ratio
    const rect = element.getBoundingClientRect();
    const pdfHeight = (rect.height * pdfWidth) / rect.width;

    // Add the image to the PDF
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    // Trigger download
    pdf.save(filename);
    
    return true;
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return false;
  }
};
