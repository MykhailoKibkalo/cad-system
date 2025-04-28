import { GlobalWorkerOptions } from 'pdfjs-dist';

// Configure pdf.js worker
const configurePdfWorker = () => {
    // In production, the worker would be served from a static path
    GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
};

export default configurePdfWorker;
