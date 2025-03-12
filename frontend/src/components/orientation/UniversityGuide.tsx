import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';
import PDFViewer from './PDFViewer';

interface PDFFile {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: string;
  date: string;
}

const pdfFiles: PDFFile[] = [
  {
    id: '1',
    title: 'Guide des Études Supérieures 2024',
    description: 'Guide complet des filières et établissements universitaires en Tunisie',
    filename: 'guide-etudes-2024.pdf',
    category: 'Guides généraux',
    date: '2024-01-15'
  },
  {
    id: '2',
    title: 'Orientation Post-Bac',
    description: 'Informations sur le processus d\'orientation universitaire',
    filename: 'orientation-post-bac.pdf',
    category: 'Orientation',
    date: '2024-01-10'
  }
];

const UniversityGuide: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title'>('recent');
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    // Get the authentication token from localStorage
    const token = localStorage.getItem('token');
    setAuthToken(token);
  }, []);

  const getPdfUrl = (filename: string) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    return `${baseUrl}/api/pdf/${filename}${authToken ? `?token=${authToken}` : ''}`;
  };

  const categories = ['all', ...new Set(pdfFiles.map(file => file.category))];

  const filteredPdfs = pdfFiles
    .filter(pdf => 
      (selectedCategory === 'all' || pdf.category === selectedCategory) &&
      (pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       pdf.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'recent') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  const handlePdfSelect = (pdf: PDFFile) => {
    if (!authToken) {
      // Handle unauthenticated user
      alert('Veuillez vous connecter pour accéder aux guides');
      return;
    }
    setSelectedPdf(pdf);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Guides Universitaires
        </h1>
        <p className="text-lg text-gray-600">
          Consultez notre collection de guides pour vous aider dans votre orientation universitaire
        </p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un guide..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        </div>

        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'Toutes les catégories' : category}
              </option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'title')}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Plus récents</option>
            <option value="title">Ordre alphabétique</option>
          </select>

          <button
            onClick={() => setViewMode(mode => mode === 'grid' ? 'list' : 'grid')}
            className="p-2 border rounded-lg hover:bg-gray-50"
          >
            <ArrowsPointingOutIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PDF Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPdfs.map(pdf => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-blue-600 font-medium mb-2">
                      {pdf.category}
                    </p>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {pdf.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {pdf.description}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(pdf.date).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePdfSelect(pdf)}
                  className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Ouvrir le guide
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPdfs.map(pdf => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-4 sm:p-6 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <p className="text-sm text-blue-600 font-medium">
                        {pdf.category}
                      </p>
                      <h3 className="text-lg font-semibold text-gray-900 mt-1">
                        {pdf.title}
                      </h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {pdf.description}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(pdf.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePdfSelect(pdf)}
                      className="flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <DocumentTextIcon className="h-5 w-5 mr-2" />
                      Ouvrir
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {selectedPdf && (
        <PDFViewer
          pdfUrl={getPdfUrl(selectedPdf.filename)}
          onClose={() => setSelectedPdf(null)}
        />
      )}
    </div>
  );
};

export default UniversityGuide;
