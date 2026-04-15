'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Search,
  RefreshCw,
  Camera,
  Layers,
  Info,
  X,
  FileText,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClientLogger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { useDensity } from '@/components/DensityProvider';
// Lazy-loaded to keep out of initial bundle (~150KB)
const loadHtml2Canvas = () => import('html2canvas').then(m => m.default);

const log = createClientLogger('ChartWrapper');

interface ChartToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}

interface InteractiveChartWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onReset?: () => void;
  onFilter?: () => void;
  onSearch?: (query: string) => void;
  onExport?: (format: 'png' | 'svg' | 'csv' | 'json') => void;
  enableZoom?: boolean;
  enableExport?: boolean;
  enableFilter?: boolean;
  enableSearch?: boolean;
  enableFullscreen?: boolean;
  customActions?: ChartToolbarAction[];
  showLegend?: boolean;
  legend?: React.ReactNode;
}

export function InteractiveChartWrapper({
  children,
  title,
  description,
  className,
  onZoomIn,
  onZoomOut,
  onReset,
  onFilter,
  onSearch,
  onExport,
  enableZoom = true,
  enableExport = true,
  enableFilter = false,
  enableSearch = false,
  enableFullscreen = true,
  customActions = [],
  showLegend = false,
  legend,
}: InteractiveChartWrapperProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const chartRef = useRef<HTMLDivElement>(null);
  const { density } = useDensity();

  const isCompact = density !== 'comfortable';

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoomLevel + 25, 200);
    setZoomLevel(newZoom);
    onZoomIn?.();
  }, [zoomLevel, onZoomIn]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoomLevel - 25, 50);
    setZoomLevel(newZoom);
    onZoomOut?.();
  }, [zoomLevel, onZoomOut]);

  const handleReset = useCallback(() => {
    setZoomLevel(100);
    setSearchQuery('');
    onReset?.();
  }, [onReset]);

  // Handle export
  const handleExport = useCallback(
    async (format: 'png' | 'svg' | 'csv' | 'json') => {
      if (format === 'png' && chartRef.current) {
        try {
          const html2canvas = await loadHtml2Canvas();
          const canvas = await html2canvas(chartRef.current, {
            backgroundColor: null,
            scale: 2,
          });
          const url = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = url;
          a.download = `${title || 'chart'}-${Date.now()}.png`;
          a.click();
        } catch (error) {
          log.error('Failed to export chart:', error);
        }
      } else if (format === 'svg' && chartRef.current) {
        try {
          const svgElement = chartRef.current.querySelector('svg');
          if (svgElement) {
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title || 'chart'}-${Date.now()}.svg`;
            a.click();
            URL.revokeObjectURL(url);
          } else {
            onExport?.(format);
          }
        } catch (error) {
          log.error('Failed to export SVG:', error);
        }
      } else {
        if (!onExport) {
          log.warn(
            `No export handler provided for format: ${format}. Pass an onExport callback to handle ${format} exports.`
          );
        }
        onExport?.(format);
      }
      setShowExportMenu(false);
    },
    [title, onExport]
  );

  // Handle search
  useEffect(() => {
    if (searchQuery && onSearch) {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchQuery, onSearch]);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      chartRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div
      ref={chartRef}
      className={cn(
        'relative group',
        'liquid-glass border rounded-xl',
        isCompact ? 'p-3' : 'p-4',
        isFullscreen && 'fixed inset-0 z-50 m-0 rounded-none',
        className
      )}
      style={{ borderColor: 'var(--border-color)' }}
    >
      {/* Header */}
      <div className={cn('flex items-start justify-between mb-4', isCompact && 'mb-2')}>
        <div className="flex-1">
          {title && (
            <h3 className={cn('font-semibold', isCompact ? 'text-sm' : 'text-base')}>{title}</h3>
          )}
          {description && (
            <p className={cn('text-muted mt-1', isCompact ? 'text-xs' : 'text-sm')}>
              {description}
            </p>
          )}
        </div>

        {/* Toolbar */}
        <div
          className={cn(
            'flex items-center gap-1',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            isFullscreen && 'opacity-100'
          )}
        >
          {/* Search */}
          {enableSearch && (
            <>
              {showSearch ? (
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="px-3 py-1.5 pr-8 border rounded-md text-xs focus:outline-none"
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderColor: 'var(--border-active)',
                      color: 'var(--text-primary)',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowSearch(false);
                      setSearchQuery('');
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSearch(true)}
                  className="h-8 w-8"
                  title="Search"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </>
          )}

          {/* Filter */}
          {enableFilter && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onFilter}
              className="h-8 w-8"
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </Button>
          )}

          {/* Zoom controls */}
          {enableZoom && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 50}
                className="h-8 w-8"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-xs text-muted px-1">{zoomLevel}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 200}
                className="h-8 w-8"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Reset */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleReset}
            className="h-8 w-8"
            title="Reset view"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>

          {/* Export menu */}
          {enableExport && (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="h-8 w-8"
                title="Export"
              >
                <Download className="w-4 h-4" />
              </Button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-10 right-0 z-10 border rounded-lg p-2 min-w-[120px]"
                    style={{
                      background: 'var(--bg-card)',
                      backdropFilter: 'blur(12px)',
                      borderColor: 'var(--border-active)',
                    }}
                  >
                    <button
                      onClick={() => handleExport('png')}
                      className="w-full text-left px-3 py-1.5 text-xs rounded"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Camera className="w-3 h-3 inline mr-2" />
                      PNG Image
                    </button>
                    <button
                      onClick={() => handleExport('svg')}
                      className="w-full text-left px-3 py-1.5 text-xs rounded"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Layers className="w-3 h-3 inline mr-2" />
                      SVG Vector
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full text-left px-3 py-1.5 text-xs rounded"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <FileText className="w-3 h-3 inline mr-2" />
                      CSV Data
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full text-left px-3 py-1.5 text-xs rounded"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <Code className="w-3 h-3 inline mr-2" />
                      JSON Data
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Fullscreen */}
          {enableFullscreen && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="h-8 w-8"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          )}

          {/* Custom actions */}
          {customActions.map(action => (
            <Button
              key={action.id}
              variant="ghost"
              size="icon"
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-8 w-8"
              title={action.label}
            >
              {action.icon}
            </Button>
          ))}

          {/* Info */}
          {description && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowInfo(!showInfo)}
              className="h-8 w-8"
              title="Info"
            >
              <Info className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 rounded-lg border text-xs"
            style={{
              background: 'var(--bg-secondary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)',
            }}
          >
            {description}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart content with zoom */}
      <div
        className={cn('relative transition-transform duration-300', 'origin-top-left')}
        style={{
          transform: `scale(${zoomLevel / 100})`,
          width: zoomLevel > 100 ? `${(100 / zoomLevel) * 100}%` : '100%',
        }}
      >
        {children}
      </div>

      {/* Legend */}
      {showLegend && legend && (
        <div className={cn('mt-4 pt-4 border-t', isCompact && 'mt-2 pt-2')} style={{ borderColor: 'var(--border-color)' }}>
          {legend}
        </div>
      )}
    </div>
  );
}
