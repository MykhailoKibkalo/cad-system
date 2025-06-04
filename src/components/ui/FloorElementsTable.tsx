// src/components/FloorElementsTable.tsx
'use client';

import React, { useMemo, useState } from 'react';
import styled from '@emotion/styled';
import { useCanvasStore } from '@/state/canvasStore';
import { useFloorStore } from '@/state/floorStore';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/InputWithAffix';
import { HiMiniXMark } from 'react-icons/hi2';
import { LuChevronDown, LuChevronUp, LuSearch } from 'react-icons/lu';
import {useFloorElements} from "@/components/Canvas/hooks/useFloorElements";

interface FloorElementsTableProps {
  onClose: () => void;
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  width: 95%;
  max-width: 1400px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const TableSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 16px 24px;
  border-bottom: 1px solid #f1f5f9;
`;

const SearchContainer = styled.div`
  width: 300px;

  @media (max-width: 768px) {
    width: 200px;
  }
`;

const TableContainer = styled.div`
  padding: 0 24px 24px 24px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

const Th = styled.th<{ sortable?: boolean }>`
  background: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  cursor: ${props => (props.sortable ? 'pointer' : 'default')};
  user-select: none;
  position: relative;

  &:hover {
    background: ${props => (props.sortable ? '#f1f5f9' : '#f8fafc')};
  }

  svg {
    margin-left: 4px;
    opacity: 0.5;
  }
`;

const Td = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
  color: #374151;

  &:first-of-type {
    font-weight: 500;
  }
`;

const Tr = styled.tr`
  &:hover {
    background: #f8fafc;
  }

  &:last-child td {
    border-bottom: none;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 48px 24px;
  color: #6b7280;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const PaginationInfo = styled(Text)`
  flex: 1;
  color: #6b7280;
  font-size: 14px;
`;

const PaginationControls = styled.div`
  display: flex;
  gap: 8px;
`;

const ITEMS_PER_PAGE = 50;

type SortField = string;
type SortDirection = 'asc' | 'desc';

export default function FloorElementsTable({ onClose }: FloorElementsTableProps) {
  const currentFloor = useFloorStore(s => s.selectedFloorId);
  const rawElements = useFloorElements(currentFloor || undefined);
  const groups = useFloorStore(s => s.getActiveGridState()?.groups || []);
  
  // Filter out individual elements that are part of groups to avoid duplication
  const filteredElements = useMemo(() => {
    return {
      modules: rawElements.modules.filter(m => !m.isGrouped),
      openings: rawElements.openings, // Openings are never grouped individually
      balconies: rawElements.balconies.filter(b => !b.isGrouped),
      bathroomPods: rawElements.bathroomPods.filter(bp => !bp.isGrouped),
      corridors: rawElements.corridors.filter(c => !c.isGrouped),
      roofs: rawElements.roofs
    };
  }, [rawElements]);
  
  const { modules, openings, balconies, bathroomPods, corridors, roofs } = filteredElements;

  // Search states for each table
  const [searchTerms, setSearchTerms] = useState({
    modules: '',
    openings: '',
    balconies: '',
    bathroomPods: '',
    corridors: '',
    roofs: '',
    groups: '',
  });

  // Sort states for each table
  const [sortStates, setSortStates] = useState<Record<string, { field: SortField; direction: SortDirection }>>({});

  // Pagination states for each table
  const [pageStates, setPageStates] = useState<Record<string, number>>({});

  const handleSort = (tableKey: string, field: string) => {
    setSortStates(prev => ({
      ...prev,
      [tableKey]: {
        field,
        direction: prev[tableKey]?.field === field && prev[tableKey]?.direction === 'asc' ? 'desc' : 'asc',
      },
    }));
  };

  const handleSearch = (tableKey: keyof typeof searchTerms, value: string) => {
    setSearchTerms(prev => ({ ...prev, [tableKey]: value }));
    setPageStates(prev => ({ ...prev, [tableKey]: 0 })); // Reset to first page
  };

  const sortData = <T extends Record<string, any>>(data: T[], tableKey: string): T[] => {
    const sortState = sortStates[tableKey];
    if (!sortState) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortState.field];
      const bValue = (b as any)[sortState.field];

      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortState.direction === 'asc' ? comparison : -comparison;
    });
  };

  const filterData = <T extends Record<string, any>>(data: T[], searchTerm: string): T[] => {
    if (!searchTerm) return data;

    return data.filter(item =>
      Object.values(item as any).some(value => String(value).toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const paginateData = <T extends any>(
    data: T[],
    tableKey: string
  ): {
    paginatedData: T[];
    totalPages: number;
    currentPage: number;
  } => {
    const currentPage = pageStates[tableKey] || 0;
    const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const paginatedData = data.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return { paginatedData, totalPages, currentPage };
  };

  const renderSortIcon = (tableKey: string, field: string) => {
    const sortState = sortStates[tableKey];
    if (sortState?.field !== field) return <LuChevronDown size={16} />;
    return sortState.direction === 'asc' ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />;
  };

  const renderTable = <T extends Record<string, any>>(
    tableKey: string,
    title: string,
    data: T[],
    columns: { key: string; label: string; sortable?: boolean }[],
    renderCell?: (item: T, key: string) => React.ReactNode
  ) => {
    const searchTerm = searchTerms[tableKey as keyof typeof searchTerms];
    const filteredData = filterData(data, searchTerm);
    const sortedData = sortData(filteredData, tableKey);
    const { paginatedData, totalPages, currentPage } = paginateData(sortedData, tableKey);

    return (
      <TableSection key={tableKey}>
        <TableHeader>
          <Text size={20} weight={700}>
            {title} ({filteredData.length})
          </Text>
          <SearchContainer>
            <Input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={searchTerm}
              onChange={e => handleSearch(tableKey as keyof typeof searchTerms, e.target.value)}
              prefix={<LuSearch size={16} />}
            />
          </SearchContainer>
        </TableHeader>

        <TableContainer>
          {paginatedData.length === 0 ? (
            <EmptyState>
              <Text size={16} color="#6b7280">
                {searchTerm
                  ? `No ${title.toLowerCase()} found matching "${searchTerm}"`
                  : `No ${title.toLowerCase()} on this floor`}
              </Text>
            </EmptyState>
          ) : (
            <>
              <Table>
                <thead>
                  <tr>
                    {columns.map(column => (
                      <Th
                        key={column.key}
                        sortable={column.sortable !== false}
                        onClick={() => column.sortable !== false && handleSort(tableKey, column.key)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {column.label}
                          {column.sortable !== false && renderSortIcon(tableKey, column.key)}
                        </div>
                      </Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((item, index) => (
                    <Tr key={item.id || index}>
                      {columns.map(column => (
                        <Td key={column.key}>
                          {renderCell ? renderCell(item, column.key) : (item as any)[column.key]}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </Table>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationInfo>
                    Showing {currentPage * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min((currentPage + 1) * ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} items
                  </PaginationInfo>
                  <PaginationControls>
                    <Button
                      variant="ghost"
                      disabled={currentPage === 0}
                      onClick={() =>
                        setPageStates(prev => ({
                          ...prev,
                          [tableKey]: currentPage - 1,
                        }))
                      }
                    >
                      Previous
                    </Button>
                    <Text size={14} weight={500}>
                      Page {currentPage + 1} of {totalPages}
                    </Text>
                    <Button
                      variant="ghost"
                      disabled={currentPage === totalPages - 1}
                      onClick={() =>
                        setPageStates(prev => ({
                          ...prev,
                          [tableKey]: currentPage + 1,
                        }))
                      }
                    >
                      Next
                    </Button>
                  </PaginationControls>
                </Pagination>
              )}
            </>
          )}
        </TableContainer>
      </TableSection>
    );
  };

  // Enhanced data with computed values
  const enhancedOpenings = useMemo(() => {
    return openings.map(opening => {
      const module = modules.find(m => m.id === opening.moduleId);
      return {
        ...opening,
        moduleName: module?.name || 'Unknown Module',
      };
    });
  }, [openings, modules]);

  const enhancedBalconies = useMemo(() => {
    return balconies.map(balcony => {
      const module = modules.find(m => m.id === balcony.moduleId);
      return {
        ...balcony,
        moduleName: module?.name || 'Unknown Module',
      };
    });
  }, [balconies, modules]);

  const enhancedBathroomPods = useMemo(() => {
    return bathroomPods.map(pod => {
      const module = modules.find(m => m.id === pod.moduleId);
      return {
        ...pod,
        moduleName: module?.name || 'Unknown Module',
      };
    });
  }, [bathroomPods, modules]);

  const enhancedCorridors = useMemo(() => {
    return corridors.map(corridor => ({
      ...corridor,
      direction: Math.abs(corridor.x2 - corridor.x1) > Math.abs(corridor.y2 - corridor.y1) ? 'H' : 'V',
    }));
  }, [corridors]);

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>
          <Text size={24} weight={700}>
            Floor Elements - Level {currentFloor}
          </Text>
          <Button variant="ghost" onClick={onClose}>
            <HiMiniXMark size={24} />
          </Button>
        </Header>

        <Content>
          {/* Groups Table */}
          {renderTable(
            'groups',
            'Groups',
            groups,
            [
              { key: 'name', label: 'Group Name' },
              { key: 'moduleCount', label: 'Modules' },
              { key: 'corridorCount', label: 'Corridors' },
              { key: 'balconyCount', label: 'Balconies' },
              { key: 'bathroomPodCount', label: 'Bathroom Pods' },
              { key: 'totalElements', label: 'Total Elements' },
              { key: 'elementDetails', label: 'Elements', sortable: false },
              { key: 'createdAt', label: 'Created', sortable: false },
            ],
            (item: any, key) => {
              if (key === 'moduleCount') return item.elements?.modules?.length || item.moduleIds?.length || 0;
              if (key === 'corridorCount') return item.elements?.corridors?.length || 0;
              if (key === 'balconyCount') return item.elements?.balconies?.length || 0;
              if (key === 'bathroomPodCount') return item.elements?.bathroomPods?.length || 0;
              if (key === 'totalElements') {
                const modules = item.elements?.modules?.length || item.moduleIds?.length || 0;
                const corridors = item.elements?.corridors?.length || 0;
                const balconies = item.elements?.balconies?.length || 0;
                const bathroomPods = item.elements?.bathroomPods?.length || 0;
                return modules + corridors + balconies + bathroomPods;
              }
              if (key === 'elementDetails') {
                const details = [];
                if (item.elements?.modules?.length || item.moduleIds?.length) {
                  const moduleIds = item.elements?.modules || item.moduleIds || [];
                  const moduleNames = moduleIds.map((id: string) => {
                    const module = rawElements.modules.find(m => m.id === id);
                    return module ? module.name : id;
                  }).join(', ');
                  details.push(`Modules: ${moduleNames}`);
                }
                if (item.elements?.corridors?.length) {
                  details.push(`Corridors: ${item.elements.corridors.join(', ')}`);
                }
                if (item.elements?.balconies?.length) {
                  details.push(`Balconies: ${item.elements.balconies.join(', ')}`);
                }
                if (item.elements?.bathroomPods?.length) {
                  details.push(`Bathroom Pods: ${item.elements.bathroomPods.join(', ')}`);
                }
                return details.join(' | ') || 'No elements';
              }
              if (key === 'createdAt') return new Date(item.createdAt).toLocaleString();
              const value = (item as any)[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Modules Table */}
          {renderTable(
            'modules',
            'Modules',
            modules,
            [
              { key: 'name', label: 'Name' },
              { key: 'width', label: 'Width (mm)' },
              { key: 'length', label: 'Length (mm)' },
              { key: 'height', label: 'Height (mm)' },
              { key: 'x0', label: 'x0' },
              { key: 'y0', label: 'y0' },
              { key: 'zOffset', label: 'z_offset' },
              { key: 'rotation', label: 'Rotation (°)' },
              { key: 'stackedFloors', label: 'Floors stacked' },
            ],
            (item, key) => {
              const value = (item as any)[key];
              // Format numeric values as integers
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Openings Table */}
          {renderTable(
            'openings',
            'Openings',
            enhancedOpenings,
            [
              { key: 'moduleName', label: 'Module Name' },
              { key: 'wallSide', label: 'Wall Side [1–4]' },
              { key: 'width', label: 'Width (mm)' },
              { key: 'height', label: 'Height (mm)' },
              { key: 'distanceAlongWall', label: 'Distance along wall (mm)' },
              { key: 'yOffset', label: 'y_offset (mm)' },
            ],
            (item, key) => {
              const value = (item as any)[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Balconies Table */}
          {renderTable(
            'balconies',
            'Balconies',
            enhancedBalconies,
            [
              { key: 'name', label: 'Identifier (BC…)' },
              { key: 'moduleName', label: 'Module Name' },
              { key: 'wallSide', label: 'Wall Side [1–4]' },
              { key: 'width', label: 'Width (mm)' },
              { key: 'length', label: 'Length (mm)' },
              { key: 'distanceAlongWall', label: 'Distance along wall (mm)' },
            ],
            (item, key) => {
              const value = (item as any)[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Bathroom Pods Table */}
          {renderTable(
            'bathroomPods',
            'Bathroom Pods',
            enhancedBathroomPods,
            [
              { key: 'name', label: 'Identifier (BPx…)' },
              { key: 'moduleName', label: 'Module Name' },
              { key: 'width', label: 'Width (mm)' },
              { key: 'length', label: 'Length (mm)' },
              { key: 'x_offset', label: 'x_offset (mm)' },
              { key: 'y_offset', label: 'y_offset (mm)' },
            ],
            (item, key) => {
              const value = (item as any)[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Corridors Table */}
          {renderTable(
            'corridors',
            'Corridors',
            enhancedCorridors,
            [
              { key: 'id', label: 'Name' },
              { key: 'direction', label: 'Direction (H/V)' },
              { key: 'floor', label: 'Floor #' },
              { key: 'x1', label: 'x1' },
              { key: 'y1', label: 'y1' },
              { key: 'x2', label: 'x2' },
              { key: 'y2', label: 'y2' },
            ],
            (item, key) => {
              const value = (item as any)[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}

          {/* Roofs Table */}
          {renderTable(
            'roofs',
            'Roofs',
            roofs,
            [
              { key: 'name', label: 'Name' },
              { key: 'direction', label: 'Direction' },
              { key: 'type', label: 'Roof Type (Flat/Mono/Gable)' },
              { key: 'angle', label: 'Angle (°)' },
              { key: 'level', label: 'Level' },
              { key: 'x1', label: 'x1' },
              { key: 'y1', label: 'y1' },
              { key: 'x2', label: 'x2' },
              { key: 'y2', label: 'y2' },
              { key: 'parapetHeight', label: 'Parapet Height' },
            ],
            (item, key) => {
              const value = item[key];
              return typeof value === 'number' ? Math.round(value) : value;
            }
          )}
        </Content>
      </Modal>
    </Overlay>
  );
}
