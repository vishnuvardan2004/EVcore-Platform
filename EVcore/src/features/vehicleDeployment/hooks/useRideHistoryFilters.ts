
import { useState, useEffect } from 'react';
import { Deployment } from '../../../types/vehicle';

interface FilterState {
  vehicleNumber: string;
  driverName: string;
  dateFrom: string;
  dateTo: string;
  purpose: string;
  supervisor: string;
}

export const useRideHistoryFilters = (deployments: Deployment[]) => {
  const [filters, setFilters] = useState<FilterState>({
    vehicleNumber: '',
    driverName: '',
    dateFrom: '',
    dateTo: '',
    purpose: 'all',
    supervisor: '',
  });

  const [filteredDeployments, setFilteredDeployments] = useState<Deployment[]>([]);

  useEffect(() => {
    applyFilters();
  }, [deployments, filters]);

  const applyFilters = () => {
    let filtered = deployments.filter(deployment => {
      // Vehicle number filter
      if (filters.vehicleNumber && !deployment.vehicleNumber.toLowerCase().includes(filters.vehicleNumber.toLowerCase())) {
        return false;
      }

      // Driver name filter
      if (filters.driverName) {
        const driverName = deployment.outData?.driverName || deployment.outData?.employeeName || '';
        if (!driverName.toLowerCase().includes(filters.driverName.toLowerCase())) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateFrom && deployment.outTimestamp) {
        const outDate = new Date(deployment.outTimestamp).toISOString().split('T')[0];
        if (outDate < filters.dateFrom) {
          return false;
        }
      }

      if (filters.dateTo && deployment.outTimestamp) {
        const outDate = new Date(deployment.outTimestamp).toISOString().split('T')[0];
        if (outDate > filters.dateTo) {
          return false;
        }
      }

      // Purpose filter
      if (filters.purpose && filters.purpose !== 'all' && deployment.purpose !== filters.purpose) {
        return false;
      }

      // Supervisor filter
      if (filters.supervisor) {
        const outSupervisor = deployment.outData?.supervisorName || '';
        const inSupervisor = deployment.inData?.inSupervisorName || '';
        if (!outSupervisor.toLowerCase().includes(filters.supervisor.toLowerCase()) &&
            !inSupervisor.toLowerCase().includes(filters.supervisor.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    setFilteredDeployments(filtered);
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      vehicleNumber: '',
      driverName: '',
      dateFrom: '',
      dateTo: '',
      purpose: 'all',
      supervisor: '',
    });
  };

  return {
    filters,
    filteredDeployments,
    updateFilter,
    clearFilters,
  };
};
