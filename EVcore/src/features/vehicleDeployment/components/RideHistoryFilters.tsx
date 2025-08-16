
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download } from 'lucide-react';

interface FilterState {
  vehicleNumber: string;
  driverName: string;
  dateFrom: string;
  dateTo: string;
  purpose: string;
  supervisor: string;
}

interface RideHistoryFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
  onClearFilters: () => void;
  onExport: () => void;
  selectedCount: number;
}

export const RideHistoryFilters: React.FC<RideHistoryFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onExport,
  selectedCount,
}) => {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4">Search & Filter</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Vehicle Number</label>
          <Input
            placeholder="Search vehicle..."
            value={filters.vehicleNumber}
            onChange={(e) => onFilterChange('vehicleNumber', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Driver Name</label>
          <Input
            placeholder="Search driver..."
            value={filters.driverName}
            onChange={(e) => onFilterChange('driverName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => onFilterChange('dateFrom', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => onFilterChange('dateTo', e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Purpose</label>
          <Select value={filters.purpose} onValueChange={(value) => onFilterChange('purpose', value)}>
            <SelectTrigger>
              <SelectValue placeholder="All purposes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All purposes</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
              <SelectItem value="Pilot">Pilot</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Supervisor Name</label>
          <Input
            placeholder="Search supervisor..."
            value={filters.supervisor}
            onChange={(e) => onFilterChange('supervisor', e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
        <Button 
          variant="outline" 
          onClick={onExport}
          disabled={selectedCount === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Export Selected ({selectedCount})
        </Button>
      </div>
    </Card>
  );
};
