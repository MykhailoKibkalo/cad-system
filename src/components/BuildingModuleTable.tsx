import React, { useState } from 'react';
import { useFloorStore } from '../state/floorStore';
import { Module } from '@/types/geometry';

interface ModuleTableRow {
  type: 'module' | 'opening' | 'balcony' | 'bathroomPod';
  moduleName?: string;
  width: number;
  length: number;
  height: number;
  x0: number;
  y0: number;
  zOffset: number;
  rotation: number;
  numberOfModulesStacked: number;
  // For sub-rows
  wallSide?: 1 | 2 | 3 | 4;
  distanceAlongWall?: number;
  yOffset?: number;
  identifier?: string;
  xOffset?: number;
}

interface CorridorTableRow {
  name: string;
  direction: 'Horizontal' | 'Vertical';
  floor: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface RoofTableRow {
  name: string;
  direction: 'H' | 'V';
  rooftype: string;
  angle: number;
  level: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  parapetHeight: number;
}

const BuildingModuleTable: React.FC = () => {
  const floors = useFloorStore(state => state.floors);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  // Generate module summary with attachments
  const generateModuleSummary = (): ModuleTableRow[] => {
    const moduleConfigs = new Map<string, { module: Module, attachments: any[], floors: string[], baseZOffset: number }>();

    // Calculate cumulative floor heights to determine actual z_offset
    let cumulativeHeight = 0;
    const floorHeights = new Map<string, number>();

    floors.forEach((floor, index) => {
      if (index === 0) {
        floorHeights.set(floor.id, 0); // First floor starts at 0
      } else {
        cumulativeHeight += floors[index - 1].height;
        floorHeights.set(floor.id, cumulativeHeight);
      }
    });

    floors.forEach((floor) => {
      const floorBaseHeight = floorHeights.get(floor.id) || 0;

      floor.gridState.modules.forEach(module => {
        // Get all attachments for this module
        const moduleOpenings = floor.gridState.openings.filter(o => o.moduleId === module.id);
        const moduleBalconies = floor.gridState.balconies.filter(b => b.moduleId === module.id);
        const moduleBathroomPods = floor.gridState.bathroomPods.filter(bp => bp.moduleId === module.id);

        // Create a signature based on MODULE CONFIGURATION ONLY (not position or z_offset)
        const attachmentSignature = [
          ...moduleOpenings.map(o => `o_${o.wallSide}_${o.width}_${o.height}_${o.distanceAlongWall}_${o.yOffset}`),
          ...moduleBalconies.map(b => `b_${b.wallSide}_${b.width}_${b.length}_${b.distanceAlongWall}`),
          ...moduleBathroomPods.map(bp => `bp_${bp.width}_${bp.length}_${bp.x_offset}_${bp.y_offset}`)
        ].sort().join('|');

        // Module signature includes dimensions, rotation, and attachments - NOT position or z_offset
        const moduleSignature = `${module.width}_${module.length}_${module.height}_${module.rotation}_${attachmentSignature}`;

        if (moduleConfigs.has(moduleSignature)) {
          const existing = moduleConfigs.get(moduleSignature)!;
          existing.floors.push(floor.name);
          // Keep the lowest z_offset as the base level
          const currentZOffset = floorBaseHeight + module.zOffset;
          if (currentZOffset < existing.baseZOffset) {
            existing.baseZOffset = currentZOffset;
            existing.module = module; // Update to use the module with lowest z_offset
          }
        } else {
          moduleConfigs.set(moduleSignature, {
            module,
            attachments: [
              ...moduleOpenings.map(o => ({ ...o, type: 'opening' })),
              ...moduleBalconies.map(b => ({ ...b, type: 'balcony' })),
              ...moduleBathroomPods.map(bp => ({ ...bp, type: 'bathroomPod' }))
            ],
            floors: [floor.name],
            baseZOffset: floorBaseHeight + module.zOffset
          });
        }
      });
    });

    // Convert to table rows
    const tableRows: ModuleTableRow[] = [];

    // Generate sequential names for modules
    const moduleEntries = Array.from(moduleConfigs.values())
      .sort((a, b) => {
        // Sort by base z_offset first, then by x0, then by y0
        if (a.baseZOffset !== b.baseZOffset) {
          return a.baseZOffset - b.baseZOffset;
        }
        if (a.module.x0 !== b.module.x0) {
          return a.module.x0 - b.module.x0;
        }
        return a.module.y0 - b.module.y0;
      });

    moduleEntries.forEach(({ module, attachments, floors, baseZOffset }, moduleIndex) => {
        // Generate sequential module name
        const moduleName = `M${moduleIndex + 1}`;

        // Add module row
        tableRows.push({
          type: 'module',
          moduleName: moduleName,
          width: module.width,
          length: module.length,
          height: module.height,
          x0: module.x0,
          y0: module.y0,
          zOffset: baseZOffset,
          rotation: module.rotation,
          numberOfModulesStacked: floors.length
        });

        // Add attachment rows with sequential naming
        let balconyCount = 1;
        let bathroomPodCount = 1;

        attachments.forEach(attachment => {
          if (attachment.type === 'opening') {
            tableRows.push({
              type: 'opening',
              width: attachment.width,
              length: attachment.height, // Height goes to length column for openings
              height: 0,
              x0: attachment.distanceAlongWall,
              y0: attachment.yOffset,
              zOffset: 0,
              rotation: 0,
              numberOfModulesStacked: 0,
              wallSide: attachment.wallSide,
              identifier: attachment.wallSide.toString()
            });
          } else if (attachment.type === 'balcony') {
            tableRows.push({
              type: 'balcony',
              width: attachment.width,
              length: attachment.length,
              height: 0,
              x0: attachment.distanceAlongWall,
              y0: 0,
              zOffset: 0,
              rotation: 0,
              numberOfModulesStacked: 0,
              wallSide: attachment.wallSide,
              identifier: `BC${balconyCount++}`
            });
          } else if (attachment.type === 'bathroomPod') {
            tableRows.push({
              type: 'bathroomPod',
              width: attachment.width,
              length: attachment.length,
              height: 0,
              x0: attachment.x_offset,
              y0: attachment.y_offset,
              zOffset: 0,
              rotation: 0,
              numberOfModulesStacked: 0,
              identifier: `BPF${bathroomPodCount++}`
            });
          }
        });
      });

    return tableRows;
  };

  // Generate corridors summary
  const generateCorridorsSummary = (): CorridorTableRow[] => {
    const corridors: CorridorTableRow[] = [];
    let corridorCount = 1;

    floors.forEach((floor, floorIndex) => {
      floor.gridState.corridors.forEach((corridor) => {
        const width = Math.abs(corridor.x2 - corridor.x1);
        const height = Math.abs(corridor.y2 - corridor.y1);
        const direction = width > height ? 'Horizontal' : 'Vertical';

        corridors.push({
          name: `C${corridorCount++}`,
          direction,
          floor: floorIndex + 1,
          x1: Math.min(corridor.x1, corridor.x2),
          y1: Math.min(corridor.y1, corridor.y2),
          x2: Math.max(corridor.x1, corridor.x2),
          y2: Math.max(corridor.y1, corridor.y2)
        });
      });
    });

    return corridors;
  };

  // Generate roofs summary (placeholder since we don't have roof objects yet)
  const generateRoofsSummary = (): RoofTableRow[] => {
    // Return empty array for now - roofs would be implemented similar to corridors
    return [];
  };

  // Export functions
  const convertToCSV = (data: any[], headers: string[]) => {
    const csvRows = [];
    csvRows.push(headers.join(','));

    data.forEach(row => {
      const values = headers.map(header => {
        const keys = header.toLowerCase().replace(/ /g, '');
        const value = row[keys] || row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && value.includes(',')
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  };

  const exportData = () => {
    const moduleData = moduleRows.map(row => ({
      moduleName: row.moduleName || row.identifier || '',
      width: row.width,
      length: row.length,
      height: row.height,
      x0: row.x0,
      y0: row.y0,
      zOffset: row.zOffset,
      rotation: row.rotation,
      numberOfModulesStacked: row.numberOfModulesStacked,
      type: row.type,
      wallSide: row.wallSide || '',
      distanceAlongWall: row.distanceAlongWall || '',
      yOffset: row.yOffset || '',
      xOffset: row.xOffset || ''
    }));

    const corridorData = corridorRows.map(row => ({
      name: row.name,
      direction: row.direction,
      floor: row.floor,
      x1: row.x1,
      y1: row.y1,
      x2: row.x2,
      y2: row.y2
    }));

    // const roofData = roofRows.map(row => ({
    //   name: row.name,
    //   direction: row.direction,
    //   rooftype: row.rooftype,
    //   angle: row.angle,
    //   level: row.level,
    //   x1: row.x1,
    //   y1: row.y1,
    //   x2: row.x2,
    //   y2: row.y2,
    //   parapetHeight: row.parapetHeight
    // }));

    let content = '';
    let filename = '';

    if (exportFormat === 'json') {
      const exportObj = {
        modules: moduleData,
        corridors: corridorData,
        // roofs: roofData
      };
      content = JSON.stringify(exportObj, null, 2);
      filename = 'building-data.json';
    } else {
      // CSV format - export each table separately
      const moduleHeaders = ['Module Name', 'Width', 'Length', 'Height', 'x0', 'y0', 'z_offset', 'Rotation', 'Number of modules stacked', 'Type', 'Wall Side', 'Distance Along Wall', 'Y Offset', 'X Offset'];
      const corridorHeaders = ['Name', 'Direction', 'Floor', 'x1', 'y1', 'x2', 'y2'];
      // const roofHeaders = ['Name', 'Direction', 'Rooftype', 'Angle', 'Level', 'x1', 'y1', 'x2', 'y2', 'Parapet Height'];

      // content = '=== MODULES ===\n' + convertToCSV(moduleData, moduleHeaders) +
      //           '\n\n=== CORRIDORS ===\n' + convertToCSV(corridorData, corridorHeaders) +
      //           '\n\n=== ROOFS ===\n' + convertToCSV(roofData, roofHeaders);
      content = '=== MODULES ===\n' + convertToCSV(moduleData, moduleHeaders) +
          '\n\n=== CORRIDORS ===\n' + convertToCSV(corridorData, corridorHeaders)
      filename = 'building-data.csv';
    }

    // Create download
    const blob = new Blob([content], { type: exportFormat === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const moduleRows = generateModuleSummary();
  const corridorRows = generateCorridorsSummary();

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      {/* Export Controls */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>Export as:</label>
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
          style={{
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ddd',
            fontSize: '14px'
          }}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
        <button
          onClick={exportData}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          Export Data
        </button>
      </div>
      {/* Modules Table */}
      <h2>Modules</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '1200px', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={headerStyle}>Module Name</th>
            <th style={headerStyle}>Width</th>
            <th style={headerStyle}>Length (Width for openings)</th>
            <th style={headerStyle}>Height</th>
            <th style={headerStyle}>x0 (distance along wall)</th>
            <th style={headerStyle}>y0 (y_offset)</th>
            <th style={headerStyle}>z_offset</th>
            <th style={headerStyle}>Rotation</th>
            <th style={headerStyle}>Number of modules stacked</th>
          </tr>
        </thead>
        <tbody>
          {moduleRows.map((row, index) => {
            const isSubRow = row.type !== 'module';

            return (
              <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit',
                  fontWeight: isSubRow ? 'normal' : 'bold'
                }}>
                  {row.moduleName || row.identifier || ''}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.width}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.length}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.height || (isSubRow ? '' : row.height)}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.x0}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.y0}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.zOffset}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.rotation}
                </td>
                <td style={{
                  ...cellStyle,
                  color: isSubRow ? '#e74c3c' : 'inherit'
                }}>
                  {row.numberOfModulesStacked || ''}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {moduleRows.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No modules found in any floor.
        </p>
      )}

      {/* Corridors Table */}
      <h2>Corridors</h2>
      <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '800px', marginBottom: '40px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={headerStyle}>Name</th>
            <th style={headerStyle}>Direction</th>
            <th style={headerStyle}>Floor</th>
            <th style={headerStyle}>x1</th>
            <th style={headerStyle}>y1</th>
            <th style={headerStyle}>x2</th>
            <th style={headerStyle}>y2</th>
          </tr>
        </thead>
        <tbody>
          {corridorRows.map((row, index) => (
            <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={cellStyle}>{row.name}</td>
              <td style={cellStyle}>{row.direction}</td>
              <td style={cellStyle}>{row.floor}</td>
              <td style={cellStyle}>{row.x1}</td>
              <td style={cellStyle}>{row.y1}</td>
              <td style={cellStyle}>{row.x2}</td>
              <td style={cellStyle}>{row.y2}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {corridorRows.length === 0 && (
        <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No corridors found in any floor.
        </p>
      )}

      {/* Roofs Table */}
      {/*<h2>Roofs</h2>*/}
      {/*<table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '900px', marginBottom: '40px' }}>*/}
      {/*  <thead>*/}
      {/*    <tr style={{ backgroundColor: '#f5f5f5' }}>*/}
      {/*      <th style={headerStyle}>Name</th>*/}
      {/*      <th style={headerStyle}>Direction</th>*/}
      {/*      <th style={headerStyle}>Rooftype</th>*/}
      {/*      <th style={headerStyle}>Angle</th>*/}
      {/*      <th style={headerStyle}>Level</th>*/}
      {/*      <th style={headerStyle}>x1</th>*/}
      {/*      <th style={headerStyle}>y1</th>*/}
      {/*      <th style={headerStyle}>x2</th>*/}
      {/*      <th style={headerStyle}>y2</th>*/}
      {/*      <th style={headerStyle}>Parapet Height</th>*/}
      {/*    </tr>*/}
      {/*  </thead>*/}
      {/*  <tbody>*/}
      {/*    {roofRows.map((row, index) => (*/}
      {/*      <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>*/}
      {/*        <td style={cellStyle}>{row.name}</td>*/}
      {/*        <td style={cellStyle}>{row.direction}</td>*/}
      {/*        <td style={cellStyle}>{row.rooftype}</td>*/}
      {/*        <td style={cellStyle}>{row.angle}</td>*/}
      {/*        <td style={cellStyle}>{row.level}</td>*/}
      {/*        <td style={cellStyle}>{row.x1}</td>*/}
      {/*        <td style={cellStyle}>{row.y1}</td>*/}
      {/*        <td style={cellStyle}>{row.x2}</td>*/}
      {/*        <td style={cellStyle}>{row.y2}</td>*/}
      {/*        <td style={cellStyle}>{row.parapetHeight}</td>*/}
      {/*      </tr>*/}
      {/*    ))}*/}
      {/*  </tbody>*/}
      {/*</table>*/}

      {/*{roofRows.length === 0 && (*/}
      {/*  <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>*/}
      {/*    No roofs defined yet.*/}
      {/*  </p>*/}
      {/*)}*/}
    </div>
  );
};

// Styles
const headerStyle: React.CSSProperties = {
  padding: '12px 8px',
  textAlign: 'left',
  borderBottom: '2px solid #ddd',
  fontWeight: 'bold',
  whiteSpace: 'nowrap'
};

const cellStyle: React.CSSProperties = {
  padding: '8px',
  textAlign: 'left',
  whiteSpace: 'nowrap'
};

export default BuildingModuleTable;
