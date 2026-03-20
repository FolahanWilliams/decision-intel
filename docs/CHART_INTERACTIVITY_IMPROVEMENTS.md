# Chart Interactivity Improvements

## Current State Analysis

The Decision Intel platform has several visualization components that could benefit from enhanced interactivity:

1. **BiasNetwork** (1160 LOC) - Complex force-directed graph
2. **DashboardCharts** - Bar and line charts
3. **DecisionRadar** - Radar chart for decision factors
4. **SentimentGauge** - Sentiment visualization
5. **BiasTreemap** - Hierarchical bias breakdown
6. **BiasHeatmap** - Temporal bias intensity
7. **SwotQuadrant** - SWOT analysis visualization

## Proposed Enhancements

### 1. BiasNetwork Graph Improvements

#### Current Capabilities
- Force-directed layout
- Node size based on bias severity
- Color coding by bias type
- Basic hover tooltips

#### Proposed Interactive Features

**A. Advanced Navigation**
```typescript
interface NetworkInteractions {
  // Zoom controls
  zoomToFit: () => void;
  zoomToNode: (nodeId: string) => void;
  resetZoom: () => void;

  // Pan & zoom with mouse
  enablePanZoom: boolean;
  minZoom: number;
  maxZoom: number;

  // Minimap for large graphs
  showMinimap: boolean;
  minimapPosition: 'top-right' | 'bottom-right';
}
```

**B. Node Interactions**
- **Click to Focus**: Clicking a node highlights it and dims others
- **Expand/Collapse**: Group related biases, click to expand clusters
- **Drag to Reposition**: Allow manual node positioning with physics pause
- **Right-click Context Menu**:
  - View bias details
  - See all occurrences
  - Compare with other documents
  - Add to watchlist

**C. Edge Interactions**
- **Hover to Highlight Path**: Show connection strength
- **Click to Filter**: Show only connected nodes
- **Animated Flow**: Visualize influence direction

**D. Search & Filter**
```typescript
interface NetworkFilters {
  searchQuery: string;
  severityThreshold: number;
  biasTypes: string[];
  timeRange?: [Date, Date];
  showOnlyConnected: boolean;
  clusterBySimilarity: boolean;
}
```

**E. Visual Enhancements**
- **Particle Effects**: For active connections
- **Glow Effects**: For high-severity biases
- **Animated Transitions**: Smooth layout changes
- **3D Mode Toggle**: Optional WebGL rendering

**F. Data Export**
- **Save as Image**: PNG/SVG export
- **Export Graph Data**: JSON/CSV format
- **Share Interactive View**: Generate shareable link

### 2. DashboardCharts Enhancements

**Interactive Features:**
```typescript
interface ChartInteractions {
  // Click handlers
  onBarClick: (category: string, value: number) => void;
  onPointClick: (dataPoint: DataPoint) => void;

  // Drill-down navigation
  drillDown: (category: string) => void;
  breadcrumbs: string[];

  // Crossfiltering
  selectedCategories: Set<string>;
  onSelectionChange: (selected: Set<string>) => void;

  // Annotations
  annotations: ChartAnnotation[];
  onAddAnnotation: (point: DataPoint, note: string) => void;
}
```

**Specific Improvements:**
- **Brush Selection**: Drag to select multiple bars
- **Zoom Timeline**: For temporal data
- **Compare Mode**: Overlay multiple datasets
- **Trend Lines**: Show regression/moving average
- **Export Options**: Download chart as image or data

### 3. DecisionRadar Enhancements

**Interactive Axes:**
- Click axis label to see detailed breakdown
- Drag axis points to simulate "what-if" scenarios
- Double-click to maximize/minimize axis

**Comparison Mode:**
- Overlay multiple radars with transparency
- Animate between different time periods
- Show delta/change indicators

### 4. BiasHeatmap Improvements

**Cell Interactions:**
- **Click for Details**: Show bias instances for that cell
- **Hover Preview**: Mini card with key metrics
- **Selection Mode**: Click-drag to select regions
- **Time Scrubbing**: Animated playback over time

**Advanced Features:**
- **Clustering**: Auto-group similar patterns
- **Anomaly Detection**: Highlight unusual patterns
- **Correlation Matrix**: Show bias relationships

### 5. Cross-Chart Interactions

**Linked Highlighting:**
```typescript
interface CrossChartLink {
  source: ChartInstance;
  target: ChartInstance;
  linkType: 'filter' | 'highlight' | 'zoom';
  bidirectional: boolean;
}
```

When interacting with one chart:
- Other charts highlight related data
- Filters propagate across visualizations
- Maintain selection state globally

### 6. Gesture Support

**Touch/Mobile Interactions:**
- Pinch to zoom
- Two-finger pan
- Long-press for context menu
- Swipe to navigate time periods

### 7. Accessibility Enhancements

**Keyboard Navigation:**
- Tab through chart elements
- Arrow keys for selection
- Enter to activate
- Escape to deselect

**Screen Reader Support:**
- ARIA labels for all interactive elements
- Sonification option (data to sound)
- High contrast mode
- Pattern fills instead of colors

## Implementation Priority

### Phase 1: Quick Wins (1-2 days)
1. ✅ Click handlers for bar charts → drill-down
2. ✅ Hover effects with detailed tooltips
3. ✅ Basic zoom controls for BiasNetwork
4. ✅ Export chart as image

### Phase 2: Core Interactivity (3-5 days)
1. Node search/filter for BiasNetwork
2. Brush selection for charts
3. Cross-chart highlighting
4. Context menus

### Phase 3: Advanced Features (1 week)
1. What-if scenarios for radar
2. Time animation for heatmap
3. 3D network visualization
4. Clustering and anomaly detection

## Technical Implementation

### React Hooks for Chart State

```typescript
// useChartInteractions.ts
export function useChartInteractions(chartId: string) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const [zoom, setZoom] = useState({ scale: 1, x: 0, y: 0 });
  const [filters, setFilters] = useState<ChartFilters>({});

  // Publish interactions to other charts
  const broadcast = useChartBroadcast();

  const handleSelect = (id: string, multi = false) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (multi) {
        next.has(id) ? next.delete(id) : next.add(id);
      } else {
        next.clear();
        next.add(id);
      }
      broadcast({ type: 'select', chartId, selected: next });
      return next;
    });
  };

  return {
    selected,
    hovered,
    zoom,
    filters,
    handleSelect,
    handleHover: setHovered,
    handleZoom: setZoom,
    handleFilter: setFilters,
  };
}
```

### D3.js Integration

```typescript
// BiasNetworkInteractive.tsx
import * as d3 from 'd3';
import { useChartInteractions } from '@/hooks/useChartInteractions';

export function BiasNetworkInteractive({ data }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { selected, handleSelect, zoom } = useChartInteractions('bias-network');

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.append('g');

    // Add zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Force simulation with interactions
    const simulation = d3.forceSimulation(data.nodes)
      .force('link', d3.forceLink(data.links))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Drag behavior
    const drag = d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);

    // Node selection
    nodes.on('click', (event, d) => {
      event.stopPropagation();
      handleSelect(d.id, event.shiftKey);
    });

    // Contextual menu
    nodes.on('contextmenu', (event, d) => {
      event.preventDefault();
      showContextMenu(event, d);
    });

  }, [data, selected]);

  return <svg ref={svgRef} />;
}
```

### Performance Optimizations

1. **Virtualization**: For large datasets, render only visible nodes
2. **WebGL Rendering**: Use Three.js for 3D and large graphs
3. **Web Workers**: Offload force calculations
4. **Debounced Updates**: Batch state changes
5. **Memoization**: Cache expensive calculations

### User Experience Guidelines

1. **Progressive Disclosure**: Start simple, reveal complexity on demand
2. **Consistent Interactions**: Same gestures across all charts
3. **Visual Feedback**: Immediate response to all interactions
4. **Undo/Redo**: Allow reverting accidental changes
5. **Help Overlay**: '?' key shows interaction hints
6. **Mobile-First**: Touch interactions work seamlessly

## Measurement & Analytics

Track interaction metrics:
- Most used features
- Click patterns
- Zoom/pan behavior
- Filter combinations
- Export frequency

This data informs future improvements and helps optimize default views.