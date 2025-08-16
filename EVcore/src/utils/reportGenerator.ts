import jsPDF from 'jspdf';
import { TripSummary } from '../types/vehicle';

export const generateTripReport = (summary: TripSummary): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Vehicle Trip Summary Report', 20, 20);
  
  // Vehicle details
  doc.setFontSize(12);
  doc.text(`Vehicle Number: ${summary.vehicleNumber}`, 20, 40);
  doc.text(`Purpose: ${summary.purpose}`, 20, 50);
  doc.text(`OUT Date & Time: ${summary.outDateTime}`, 20, 60);
  doc.text(`IN Date & Time: ${summary.inDateTime}`, 20, 70);
  doc.text(`Total Duration: ${summary.totalDuration}`, 20, 80);
  doc.text(`Total KMs Run: ${summary.totalKms} km`, 20, 90);
  doc.text(`OUT Supervisor: ${summary.outSupervisor}`, 20, 100);
  doc.text(`IN Supervisor: ${summary.inSupervisor}`, 20, 110);
  
  // Mismatches section
  if (summary.mismatches.length > 0) {
    doc.setFontSize(14);
    doc.text('Checklist Mismatches:', 20, 130);
    doc.setFontSize(12);
    
    summary.mismatches.forEach((mismatch, index) => {
      doc.text(`• ${mismatch}`, 25, 140 + (index * 10));
    });
  } else {
    doc.setFontSize(12);
    doc.text('No checklist mismatches detected.', 20, 130);
  }
  
  // Footer
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
  
  // Save the PDF
  doc.save(`Trip-Report-${summary.vehicleNumber}-${Date.now()}.pdf`);
};

export const calculateDuration = (outTime: string, inTime: string): string => {
  const outDate = new Date(outTime);
  const inDate = new Date(inTime);
  const diffMs = inDate.getTime() - outDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${diffHours}h ${diffMinutes}m`;
};


