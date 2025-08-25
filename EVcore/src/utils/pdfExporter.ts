import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatabaseModule, MODULE_CONFIG } from '../features/databaseManagement/services/databaseService';

interface PDFExportOptions {
  title?: string;
  subtitle?: string;
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  orientation?: 'portrait' | 'landscape';
  maxRecords?: number;
}

interface ExportOptions {
  includeMetadata?: boolean;
  includeStatistics?: boolean;
  orientation?: 'portrait' | 'landscape';
  maxRecords?: number;
}

export class DataExporter {
  private static formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.join(', ');
      if (value instanceof Date) return value.toLocaleDateString();
      return JSON.stringify(value);
    }
    return String(value);
  }

  private static getModuleDisplayName(module: DatabaseModule): string {
    return MODULE_CONFIG[module]?.displayName || module;
  }

  private static getModuleDescription(module: DatabaseModule): string {
    return MODULE_CONFIG[module]?.description || '';
  }

  static async exportModuleData(
    module: DatabaseModule, 
    data: any[], 
    format: 'pdf' | 'json' = 'pdf',
    options: ExportOptions = {}
  ): Promise<void> {
    switch (format) {
      case 'pdf':
        return this.exportToPDF(module, data, options);
      case 'json':
        return this.exportToJSON(module, data, options);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  static async exportToPDF(
    module: DatabaseModule, 
    data: any[], 
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      includeMetadata = true,
      includeStatistics = true,
      orientation = 'landscape',
      maxRecords = 1000
    } = options;

    const title = `${this.getModuleDisplayName(module)} Export Report`;
    const subtitle = this.getModuleDescription(module);
    
    // Limit data for PDF export
    const limitedData = data.slice(0, maxRecords);

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header Section
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;
    }

    // Metadata Section
    if (includeMetadata) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const exportDate = new Date().toLocaleString();
      const recordCount = data.length;
      
      doc.text(`Export Date: ${exportDate}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Records: ${recordCount}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Module: ${this.getModuleDisplayName(module)}`, margin, yPosition);
      yPosition += 15;
    }

    // Prepare table data
    if (limitedData.length === 0) {
      doc.setFontSize(14);
      doc.text('No data available for export.', pageWidth / 2, yPosition + 20, { align: 'center' });
    } else {
      // Get all unique keys from the data
      const allKeys = new Set<string>();
      limitedData.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== '_id' && key !== '__v' && !key.startsWith('_')) {
            allKeys.add(key);
          }
        });
      });

      const headers = Array.from(allKeys).map(key => 
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );

      const tableData = limitedData.map(item => {
        return Array.from(allKeys).map(key => this.formatValue(item[key]));
      });

      // Generate table
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        tableWidth: 'auto',
        columnStyles: {},
        didDrawPage: (data: any) => {
          // Footer
          const pageCount = (doc as any).internal.pages.length - 1;
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
          );
          
          // Company branding
          doc.text(
            'Generated by EVcore Platform',
            margin,
            pageHeight - 10
          );
        },
      });

      // Summary Section (if space available)
      const finalY = (doc as any).lastAutoTable?.finalY || yPosition + 20;
      if (finalY < pageHeight - 60 && data.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary', margin, finalY + 20);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`• Total ${this.getModuleDisplayName(module)}: ${data.length}`, margin, finalY + 30);
        
        // Calculate some basic statistics if possible
        const numericFields = Array.from(allKeys).filter(key => {
          return data.some(item => typeof item[key] === 'number' && !isNaN(Number(item[key])));
        });

        if (numericFields.length > 0) {
          numericFields.slice(0, 3).forEach((field, index) => {
            const values = data.map(item => item[field]).filter(val => typeof val === 'number');
            if (values.length > 0) {
              const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
              doc.text(
                `• Average ${field}: ${avg.toFixed(2)}`,
                margin,
                finalY + 36 + (index * 6)
              );
            }
          });
        }
      }
    }

    // Save the PDF
    const fileName = `${module}_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  static async exportToJSON(
    module: DatabaseModule, 
    data: any[], 
    options: ExportOptions = {}
  ): Promise<void> {
    const { includeMetadata = true, includeStatistics = true } = options;

    const exportData: any = {
      data: data.map(item => {
        // Remove internal fields
        const cleanItem = { ...item };
        delete cleanItem._id;
        delete cleanItem.__v;
        Object.keys(cleanItem).forEach(key => {
          if (key.startsWith('_')) {
            delete cleanItem[key];
          }
        });
        return cleanItem;
      })
    };

    if (includeMetadata) {
      exportData.metadata = {
        module: module,
        moduleName: this.getModuleDisplayName(module),
        description: this.getModuleDescription(module),
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        generatedBy: 'EVcore Platform'
      };
    }

    if (includeStatistics && data.length > 0) {
      // Calculate basic statistics
      const stats: any = {
        totalRecords: data.length,
        fields: {}
      };

      // Get field statistics
      const allKeys = new Set<string>();
      data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== '_id' && key !== '__v' && !key.startsWith('_')) {
            allKeys.add(key);
          }
        });
      });

      Array.from(allKeys).forEach(key => {
        const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined);
        stats.fields[key] = {
          totalValues: values.length,
          nullValues: data.length - values.length,
          dataType: values.length > 0 ? typeof values[0] : 'unknown'
        };

        // Add numeric statistics if applicable
        const numericValues = values.filter(val => typeof val === 'number' && !isNaN(val));
        if (numericValues.length > 0) {
          stats.fields[key].numeric = {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            average: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length
          };
        }
      });

      exportData.statistics = stats;
    }

    // Create and download JSON file
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${module}_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async exportMultipleModules(
    modules: { module: DatabaseModule; data: any[] }[],
    options: PDFExportOptions = {}
  ): Promise<void> {
    const {
      title = 'Database Management Export Report',
      subtitle = 'Complete database export across all modules',
      includeMetadata = true,
      orientation = 'landscape'
    } = options;

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    // Header Section
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
    }

    // Summary of all modules
    if (includeMetadata) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Export Summary', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Total Modules: ${modules.length}`, margin, yPosition);
      yPosition += 6;
      
      const totalRecords = modules.reduce((sum, mod) => sum + mod.data.length, 0);
      doc.text(`Total Records: ${totalRecords}`, margin, yPosition);
      yPosition += 15;

      // Module breakdown
      modules.forEach((mod, index) => {
        doc.text(
          `${index + 1}. ${this.getModuleDisplayName(mod.module)}: ${mod.data.length} records`,
          margin + 5,
          yPosition
        );
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Process each module
    modules.forEach((moduleData, moduleIndex) => {
      if (moduleIndex > 0) {
        doc.addPage();
        yPosition = margin;
      }

      // Module header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(
        `${moduleIndex + 1}. ${this.getModuleDisplayName(moduleData.module)}`,
        margin,
        yPosition
      );
      yPosition += 10;

      if (moduleData.data.length === 0) {
        doc.setFontSize(12);
        doc.text('No data available.', margin, yPosition);
        return;
      }

      // Prepare table for this module
      const allKeys = new Set<string>();
      moduleData.data.forEach(item => {
        Object.keys(item).forEach(key => {
          if (key !== '_id' && key !== '__v' && !key.startsWith('_')) {
            allKeys.add(key);
          }
        });
      });

      const headers = Array.from(allKeys).map(key => 
        key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
      );

      const tableData = moduleData.data.slice(0, 20).map(item => { // Limit to first 20 records per module
        return Array.from(allKeys).map(key => this.formatValue(item[key]));
      });

      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: (data: any) => {
          const pageCount = (doc as any).internal.pages.length - 1;
          doc.setFontSize(8);
          doc.text(
            `Page ${data.pageNumber}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
          );
        },
      });

      yPosition = (doc as any).lastAutoTable?.finalY || yPosition + 30;
    });

    // Save the PDF
    const fileName = `database_export_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
}

// Backward compatibility
export class PDFExporter {
  static async exportModuleData(
    module: DatabaseModule, 
    data: any[], 
    options: ExportOptions = {}
  ): Promise<void> {
    return DataExporter.exportModuleData(module, data, 'pdf', options);
  }

  static async exportMultipleModules(
    modules: { module: DatabaseModule; data: any[] }[],
    options: ExportOptions = {}
  ): Promise<void> {
    return DataExporter.exportMultipleModules(modules, options);
  }
}
