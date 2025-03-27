// src/utils/simplePdfHandler.ts
import {fabric} from 'fabric';

/**
 * A simplified approach to handle PDFs in the CAD application
 * This uses the browser's built-in PDF rendering capabilities via object tags
 */
export async function loadPdfAsImage(file: File, page: number = 1): Promise<fabric.Image | null> {
  return new Promise(resolve => {
    try {
      // Create a URL for the uploaded file
      const objectUrl = URL.createObjectURL(file);

      // Create a container for the PDF that won't be visible
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);

      // Create the object element to render the PDF
      const objectElement = document.createElement('object');
      objectElement.setAttribute('data', objectUrl);
      objectElement.setAttribute('type', 'application/pdf');
      objectElement.setAttribute('width', '1000px');
      objectElement.setAttribute('height', '1000px');
      objectElement.style.opacity = '0';

      // Add parameters to go to the specific page
      // Note: This only works in some browsers
      if (page > 1) {
        const paramPage = document.createElement('param');
        paramPage.setAttribute('name', 'page');
        paramPage.setAttribute('value', page.toString());
        objectElement.appendChild(paramPage);
      }

      container.appendChild(objectElement);

      // Use html2canvas to capture the rendered PDF after it loads
      objectElement.onload = async () => {
        try {
          // Allow time for the PDF to render
          setTimeout(() => {
            // Use fabric.js to capture as an image
            fabric.Image.fromURL(
              objectUrl + '#page=' + page,
              img => {
                // Clean up
                document.body.removeChild(container);
                URL.revokeObjectURL(objectUrl);

                // Resolve with the image
                resolve(img);
              },
              { crossOrigin: 'Anonymous' }
            );
          }, 1000);
        } catch (error) {
          console.error('Error capturing PDF:', error);
          document.body.removeChild(container);
          URL.revokeObjectURL(objectUrl);
          resolve(null);
        }
      };

      objectElement.onerror = () => {
        console.error('Error loading PDF in object element');
        document.body.removeChild(container);
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };
    } catch (error) {
      console.error('Error in loadPdfAsImage:', error);
      resolve(null);
    }
  });
}

/**
 * Alternative method using Blob URL
 */
export function createPdfBackdrop(pdfUrl: string, callback: (success: boolean) => void) {
  // Create a fabric image from the PDF URL directly
  // This uses the browser's built-in PDF rendering
  fabric.Image.fromURL(
    pdfUrl,
    img => {
      if (img.width === 0 || img.height === 0) {
        console.error('PDF loaded with zero dimensions');
        callback(false);
        return;
      }

      callback(true);
    },
    { crossOrigin: 'Anonymous' }
  );
}
