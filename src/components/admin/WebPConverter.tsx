import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Download, Zap } from 'lucide-react';
import { 
  batchConvertImages, 
  calculateBandwidthSavings, 
  generateConversionReport,
  formatFileSize,
  type ConversionResult 
} from '@/utils/imageConverter';

interface WebPConverterProps {
  imageUrls?: string[];
  onConversionComplete?: (results: ConversionResult[]) => void;
}

export const WebPConverter: React.FC<WebPConverterProps> = ({
  imageUrls = [],
  onConversionComplete
}) => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ConversionResult[]>([]);
  const [currentImage, setCurrentImage] = useState('');
  const [showReport, setShowReport] = useState(false);

  // Default demo URLs if none provided
  const defaultImageUrls = [
    '/hero-image.jpg',
    '/ragdoll-logo.png',
    '/radanov-pride-logo.png',
    '/featured-cat-1.jpg',
    '/featured-cat-2.jpg'
  ];

  const urlsToProcess = imageUrls.length > 0 ? imageUrls : defaultImageUrls;

  const handleConversion = async () => {
    setIsConverting(true);
    setProgress(0);
    setResults([]);
    setShowReport(false);

    try {
      const conversionResults = await batchConvertImages(
        urlsToProcess,
        {
          maxSizeBytes: 800 * 1024, // 800KB for Convex
          quality: 0.85,
          outputFormat: 'webp',
          forceWebP: true
        },
        (completed, total, result) => {
          setProgress((completed / total) * 100);
          setCurrentImage(urlsToProcess[completed - 1]);
          
          // Add result to state
          setResults(prev => [...prev, result]);
        }
      );

      setResults(conversionResults);
      setShowReport(true);
      onConversionComplete?.(conversionResults);
      
    } catch (error) {
      console.error('Batch conversion failed:', error);
    } finally {
      setIsConverting(false);
      setCurrentImage('');
    }
  };

  const downloadReport = () => {
    const report = generateConversionReport(results);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webp-conversion-report.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = results.length > 0 ? calculateBandwidthSavings(results) : null;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          WebP Image Converter
        </CardTitle>
        <CardDescription>
          Convert existing images to WebP format for optimal bandwidth usage.
          This tool can reduce image sizes by 25-35% while maintaining quality.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Image URLs Preview */}
        <div className="space-y-2">
          <h4 className="font-medium">Images to Convert ({urlsToProcess.length})</h4>
          <div className="bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
            {urlsToProcess.map((url, index) => (
              <div key={index} className="text-sm text-gray-600 truncate">
                {index + 1}. {url}
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Progress */}
        {isConverting && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Converting images...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
            {currentImage && (
              <div className="text-xs text-gray-500 truncate">
                Current: {currentImage}
              </div>
            )}
          </div>
        )}

        {/* Results Summary */}
        {stats && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="font-medium">Conversion Summary</div>
                  <div className="text-sm text-gray-600">
                    ✅ Successful: {stats.successCount}<br/>
                    ❌ Failed: {stats.failureCount}<br/>
                    📉 Avg. Reduction: {stats.averageReduction}%
                  </div>
                </div>
                <div>
                  <div className="font-medium">Bandwidth Savings</div>
                  <div className="text-sm text-gray-600">
                    Original: {formatFileSize(stats.totalOriginalSize)}<br/>
                    Converted: {formatFileSize(stats.totalConvertedSize)}<br/>
                    <span className="text-green-600 font-medium">
                      Saved: {formatFileSize(stats.totalSavings)}
                    </span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Individual Results */}
        {showReport && results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Conversion Results</h4>
            <div className="bg-gray-50 p-3 rounded-md max-h-40 overflow-y-auto space-y-1">
              {results.map((result, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="truncate flex-1">
                    {result.success ? (
                      <span className="text-green-600">✅</span>
                    ) : (
                      <span className="text-red-600">❌</span>
                    )} {urlsToProcess[index]}
                  </span>
                  <span className="ml-2 text-gray-600">
                    {result.success ? `${result.reductionPercentage}%` : 'Failed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={handleConversion} 
            disabled={isConverting || urlsToProcess.length === 0}
            className="flex-1"
          >
            {isConverting ? 'Converting...' : 'Start WebP Conversion'}
          </Button>
          
          {showReport && (
            <Button 
              variant="outline" 
              onClick={downloadReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {/* Information Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> This tool converts images client-side for preview purposes. 
            For production use, ensure your upload system automatically converts images to WebP format.
            New uploads will now automatically use WebP compression.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default WebPConverter;
