import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download,
  RefreshCw,
  MapPin,
  Calendar,
  Phone,
  Mail,
  UserCheck,
  UserX,
  CreditCard,
  Building2,
  Shield,
  Camera,
  FileText,
  User,
  Briefcase,
  Clock,
  DollarSign,
  Eye
} from 'lucide-react';
import { databaseService } from '../services/databaseSimple';
import { config } from '@/config/environment';
import { Employee, UserRole } from '../types';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

export const EmployeeManagement: React.FC = () => {
  console.log('EmployeeManagement component is rendering...');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | 'all'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = user?.role && ['super_admin', 'admin', 'leadership', 'hr'].includes(user.role);
  const canDelete = user?.role && ['super_admin', 'admin'].includes(user.role);

  // Debug logging for user role and permissions
  console.log('User role and permissions:', {
    userRole: user?.role,
    canEdit,
    canDelete,
    isDevelopment: config.IS_DEVELOPMENT
  });

  // In development mode, allow editing for testing purposes
  const canEditInDev = canEdit || config.IS_DEVELOPMENT;

  // Helper function to calculate form progress
  const getFormProgress = () => {
    const requiredFields = [
      'employeeId', 'fullName', 'gender', 'dateOfBirth', 'contactNumber', 
      'emailId', 'aadharNumber', 'panNumber', 'address', 'city', 
      'emergencyContact', 'maritalStatus', 'dateOfJoining', 'employmentType', 
      'designation', 'department', 'shiftType', 'workLocation', 
      'employeeStatus', 'salaryMode', 'monthlySalary', 'backgroundCheckStatus', 'role'
    ];
    const completedRequired = requiredFields.filter(field => 
      formData[field as keyof Employee] && 
      String(formData[field as keyof Employee]).trim() !== ''
    ).length;
    return {
      completed: completedRequired,
      total: requiredFields.length,
      percentage: Math.min(100, (completedRequired / requiredFields.length) * 100)
    };
  };

  // Form validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required field validation
    if (!formData.employeeId?.trim()) {
      errors.employeeId = 'Employee ID is required';
    } else if (!/^[A-Z0-9-]+$/.test(formData.employeeId.trim())) {
      errors.employeeId = 'Employee ID should contain only uppercase letters, numbers, and hyphens';
    }
    
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = 'Full name must be at least 2 characters';
    }
    
    if (!formData.emailId?.trim()) {
      errors.emailId = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.emailId.trim())) {
      errors.emailId = 'Please enter a valid email address';
    }
    
    if (!formData.contactNumber?.trim()) {
      errors.contactNumber = 'Contact number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.contactNumber.trim())) {
      errors.contactNumber = 'Please enter a valid contact number';
    }
    
    if (!formData.aadharNumber?.trim()) {
      errors.aadharNumber = 'Aadhar number is required';
    } else if (!/^\d{4}-\d{4}-\d{4}$/.test(formData.aadharNumber.trim())) {
      errors.aadharNumber = 'Aadhar number should be in format: XXXX-XXXX-XXXX';
    }
    
    if (!formData.panNumber?.trim()) {
      errors.panNumber = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panNumber.trim())) {
      errors.panNumber = 'PAN number should be in format: ABCDE1234F';
    }
    
    if (!formData.address?.trim()) {
      errors.address = 'Address is required';
    }
    
    if (!formData.city?.trim()) {
      errors.city = 'City is required';
    }
    
    if (!formData.emergencyContact?.trim()) {
      errors.emergencyContact = 'Emergency contact is required';
    }
    
    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 18 || age > 70) {
        errors.dateOfBirth = 'Employee must be between 18 and 70 years old';
      }
    }
    
    if (!formData.dateOfJoining) {
      errors.dateOfJoining = 'Date of joining is required';
    } else {
      const joining = new Date(formData.dateOfJoining);
      const today = new Date();
      if (joining > today) {
        errors.dateOfJoining = 'Date of joining cannot be in the future';
      }
    }
    
    if (!formData.designation?.trim()) {
      errors.designation = 'Designation is required';
    }
    
    if (!formData.department) {
      errors.department = 'Department is required';
    }
    
    if (!formData.workLocation?.trim()) {
      errors.workLocation = 'Work location is required';
    }
    
    if (!formData.role) {
      errors.role = 'Employee role is required';
    }
    
    if (formData.monthlySalary !== undefined && formData.monthlySalary < 0) {
      errors.monthlySalary = 'Salary cannot be negative';
    }
    
    // Bank details validation when salary mode is Bank
    if (formData.salaryMode === 'Bank') {
      if (!formData.bankAccountNumber?.trim()) {
        errors.bankAccountNumber = 'Bank account number is required when salary mode is Bank';
      }
      if (!formData.ifscCode?.trim()) {
        errors.ifscCode = 'IFSC code is required when salary mode is Bank';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      console.log('Fetching employees...');
      const data = await databaseService.getEmployees();
      console.log('Fetched employees:', data);
      const safeData = Array.isArray(data) ? data : [];
      
      // Always ensure we have at least one employee in dev mode for testing
      if (safeData.length === 0 && config.IS_DEVELOPMENT) {
        console.log('No employees found; injecting dev sample for visibility');
        const sample: Employee = {
          id: 'sample-emp-1',
          employeeId: 'EMP-SAMPLE',
          fullName: 'Sample Employee',
          gender: 'Other',
          dateOfBirth: '1999-01-01',
          contactNumber: '+91-0000000000',
          emailId: 'sample@company.com',
          aadharNumber: '****-****-0000',
          panNumber: 'ABCDE0000F',
          address: 'Sample Address',
          city: 'Bangalore',
          emergencyContact: 'Sample Emergency',
          maritalStatus: 'Single',
          dateOfJoining: '2024-01-01',
          employmentType: 'Full-Time',
          designation: 'Engineer',
          department: 'Tech',
          shiftType: 'Morning',
          workLocation: 'HQ',
          employeeStatus: 'Active',
          salaryMode: 'Bank',
          monthlySalary: 0,
          pfEligible: false,
          backgroundCheckStatus: 'Cleared',
          role: 'employee',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        };
        setEmployees([sample]);
        setFilteredEmployees([sample]);
      } else {
        // Ensure all employee records have safe default values
        const sanitizedData = safeData.map(emp => ({
          id: emp.id || `emp-${Date.now()}-${Math.random()}`,
          employeeId: emp.employeeId || 'N/A',
          fullName: emp.fullName || 'Unknown Employee',
          gender: emp.gender || 'Other',
          dateOfBirth: emp.dateOfBirth || 'N/A',
          contactNumber: emp.contactNumber || 'N/A',
          emailId: emp.emailId || 'N/A',
          aadharNumber: emp.aadharNumber || 'N/A',
          panNumber: emp.panNumber || 'N/A',
          address: emp.address || 'N/A',
          city: emp.city || 'N/A',
          emergencyContact: emp.emergencyContact || 'N/A',
          maritalStatus: emp.maritalStatus || 'Single',
          dateOfJoining: emp.dateOfJoining || 'N/A',
          employmentType: emp.employmentType || 'Full-Time',
          designation: emp.designation || 'N/A',
          department: emp.department || 'Other',
          shiftType: emp.shiftType || 'Morning',
          workLocation: emp.workLocation || 'N/A',
          employeeStatus: emp.employeeStatus || 'Active',
          salaryMode: emp.salaryMode || 'Bank',
          monthlySalary: emp.monthlySalary || 0,
          pfEligible: emp.pfEligible || false,
          backgroundCheckStatus: emp.backgroundCheckStatus || 'Pending',
          role: emp.role || 'employee',
          createdAt: emp.createdAt || new Date().toISOString(),
          updatedAt: emp.updatedAt || new Date().toISOString(),
          createdBy: emp.createdBy || 'system',
          // Optional fields with defaults
          reportingManagerId: emp.reportingManagerId || '',
          bankAccountNumber: emp.bankAccountNumber || '',
          ifscCode: emp.ifscCode || '',
          uanNumber: emp.uanNumber || '',
          esicNumber: emp.esicNumber || '',
          photoUrl: emp.photoUrl || '',
          dlCopyUrl: emp.dlCopyUrl || ''
        }));
        setEmployees(sanitizedData);
        setFilteredEmployees(sanitizedData);
      }
      console.log('Employees data ready for rendering:', { count: employees.length, isDev: config.IS_DEVELOPMENT });
    } catch (error) {
      console.error('Error fetching employees:', error);
      setErrorMessage('Failed to load employees data');
      
      // In dev mode, still provide sample data even if fetch fails
      if (config.IS_DEVELOPMENT) {
        console.log('Fetch failed but injecting dev sample due to dev mode');
        const fallbackSample: Employee = {
          id: 'fallback-emp-1',
          employeeId: 'EMP-FALLBACK',
          fullName: 'Fallback Employee',
          gender: 'Other',
          dateOfBirth: '1999-01-01',
          contactNumber: '+91-0000000000',
          emailId: 'fallback@company.com',
          aadharNumber: '****-****-0000',
          panNumber: 'ABCDE0000F',
          address: 'Fallback Address',
          city: 'Bangalore',
          emergencyContact: 'Fallback Emergency',
          maritalStatus: 'Single',
          dateOfJoining: '2024-01-01',
          employmentType: 'Full-Time',
          designation: 'Engineer',
          department: 'Tech',
          shiftType: 'Morning',
          workLocation: 'HQ',
          employeeStatus: 'Active',
          salaryMode: 'Bank',
          monthlySalary: 0,
          pfEligible: false,
          backgroundCheckStatus: 'Pending',
          role: 'employee',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        };
        setEmployees([fallbackSample]);
        setFilteredEmployees([fallbackSample]);
        setErrorMessage(null); // Clear error since we have fallback data
      }
      
      toast({
        title: "Error",
        description: "Failed to load employees data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!employees.length) {
      setFilteredEmployees([]);
      return;
    }
    
    console.log('Filtering employees:', { searchTerm, statusFilter, departmentFilter, totalEmployees: employees.length });
    
    const toLower = (v?: string) => (v || '').toLowerCase();
    const safeString = (v?: string) => v || '';
    
    const filtered = employees.filter(employee => {
      try {
        // Safe search matching with fallbacks
        const matchesSearch = searchTerm === '' || 
          toLower(safeString(employee.employeeId)).includes(toLower(searchTerm)) ||
          toLower(safeString(employee.fullName)).includes(toLower(searchTerm)) ||
          toLower(safeString(employee.emailId)).includes(toLower(searchTerm)) ||
          safeString(employee.contactNumber).includes(searchTerm) ||
          toLower(safeString(employee.designation)).includes(toLower(searchTerm));
        
        // Safe status and department matching
        const matchesStatus = statusFilter === 'all' || 
          (employee.employeeStatus && employee.employeeStatus === statusFilter);
        const matchesDepartment = departmentFilter === 'all' || 
          (employee.department && employee.department === departmentFilter);
        const matchesRole = roleFilter === 'all' || 
          (employee.role && employee.role === roleFilter);
        
        return matchesSearch && matchesStatus && matchesDepartment && matchesRole;
      } catch (filterError) {
        console.error('Error filtering employee:', employee, filterError);
        // If filtering fails for an employee, include them to avoid data loss
        return true;
      }
    });
    
    console.log('Filtering complete:', { 
      originalCount: employees.length, 
      filteredCount: filtered.length,
      searchTerm,
      statusFilter,
      departmentFilter
    });
    
    setFilteredEmployees(filtered);
  }, [searchTerm, statusFilter, departmentFilter, roleFilter, employees]);

  const departments = Array.from(new Set(
    employees
      .map(emp => emp.department)
      .filter(dept => dept && typeof dept === 'string' && dept.trim() !== '')
  ));

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingEmployee) {
        await databaseService.updateEmployee(editingEmployee.id, formData, user?.email || 'unknown');
        toast({
          title: "Success",
          description: "Employee updated successfully",
        });
      } else {
        await databaseService.createEmployee(formData as Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, user?.email || 'unknown');
        toast({
          title: "Success", 
          description: "Employee added successfully",
        });
      }
      
      await fetchEmployees();
      closeDialog();
    } catch (error) {
      console.error('Error saving employee:', error);
      toast({
        title: "Error",
        description: "Failed to save employee",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) return;
    
    try {
      setDeleteLoading(id);
      await databaseService.deleteEmployee(id, user?.email || 'unknown');
      await fetchEmployees();
      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    const statusConfig: Record<EmployeeStatus, { color: string; icon: any }> = {
      'Active': { color: 'bg-green-100 text-green-800 border-green-200', icon: UserCheck },
      'On Leave': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Calendar },
      'Terminated': { color: 'bg-red-100 text-red-800 border-red-200', icon: UserX }
    };
    const cfg = statusConfig[status] ?? statusConfig['Active'];
    const Icon = cfg.icon;
    return (
      <Badge className={`${cfg.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status || 'Active'}
      </Badge>
    );
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null || Number.isNaN(amount)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const resetForm = () => {
    setFormData({});
    setEditingEmployee(null);
    setFormErrors({});
    console.log('Form reset - all fields cleared');
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (employee: Employee) => {
    setFormData(employee);
    setEditingEmployee(employee);
    setFormErrors({});
    setIsAddDialogOpen(true);
  };

  const closeDialog = () => {
    setIsAddDialogOpen(false);
    // Reset form after a short delay to allow the dialog to close smoothly
    setTimeout(() => {
      resetForm();
    }, 100);
  };

  console.log('EmployeeManagement: rendering', { loading, errorMessage, employeesCount: employees.length, filteredCount: filteredEmployees.length });

  // Final safety check - ensure we always have something to render
  if (!loading && !errorMessage && employees.length === 0 && filteredEmployees.length === 0) {
    console.log('No data available, showing empty state');
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No Employees Available</CardTitle>
            <CardDescription>No employee data is currently available.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {config.IS_DEVELOPMENT 
                  ? 'No employees found in development mode. Try refreshing or check the console for errors.'
                  : 'No employees found. Please check your data source or contact support.'
                }
              </p>
              <Button variant="outline" onClick={fetchEmployees}>
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Management</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={fetchEmployees}>
              <RefreshCw className="w-4 h-4 mr-2" /> Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Employee Management
          </h1>
          <p className="text-gray-600 mt-1">Manage staff and employee records</p>
          {config.IS_DEVELOPMENT && (
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                🧪 Development Mode
              </Badge>
              <span className="text-xs text-gray-500">
                Add Employee button is enabled for testing
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchEmployees} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {canEditInDev && (
            <Button onClick={openAddDialog} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          )}
          {!canEditInDev && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Role: {user?.role || 'Unknown'} - Add Employee not available</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as EmployeeStatus | 'all')}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="team_lead">Team Lead</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="hr">Human Resources</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="pilot">Pilot</SelectItem>
                <SelectItem value="employee">Employee</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Employees ({filteredEmployees.length})</CardTitle>
              <CardDescription>Staff directory and personnel records</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-sm">
                {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || departmentFilter !== 'all' 
                  ? 'No employees found matching your filters' 
                  : 'No employees found'}
              </p>
              {!searchTerm && statusFilter === 'all' && departmentFilter === 'all' && canEditInDev && (
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Employee
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <Card key={employee.id} className="border hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">{employee.fullName}</h3>
                        <p className="text-gray-600 font-mono text-sm">ID: {employee.employeeId}</p>
                        <p className="text-gray-600 text-sm">{employee.designation}</p>
                      </div>
                      {getStatusBadge(employee.employeeStatus)}
                    </div>
                    
                    <div className="space-y-3 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{employee.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="capitalize">{employee.role || 'Employee'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{employee.emailId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{employee.contactNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{employee.city}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined: {formatDate(employee.dateOfJoining)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(employee.monthlySalary)} ({employee.salaryMode})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <span>Background: {employee.backgroundCheckStatus}</span>
                      </div>
                    </div>

                    {(canEdit || canDelete) && (
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {canEdit && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(employee)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {canDelete && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={deleteLoading === employee.id}
                              >
                                {deleteLoading === employee.id ? (
                                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <Trash2 className="w-5 h-5 text-red-600" />
                                  Delete Employee
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete <strong>{employee.fullName}</strong> ({employee.employeeId})?
                                  This action cannot be undone and will permanently remove all employee data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(employee.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Employee
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {editingEmployee ? 'Update employee information' : 'Enter comprehensive employee details. Fields marked with * are required.'}
            </DialogDescription>
            {/* Form Progress Indicator */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Form Progress</span>
                <span className="font-medium">
                  {getFormProgress().completed} / {getFormProgress().total} required fields
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getFormProgress().percentage}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Complete all required fields to enable form submission
              </p>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                    id="employeeId"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    placeholder="e.g., EMP-001"
                    className={formErrors.employeeId ? 'border-red-500' : ''}
                  />
                  {formErrors.employeeId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.employeeId}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Enter full legal name"
                    className={formErrors.fullName ? 'border-red-500' : ''}
                  />
                  {formErrors.fullName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender || ''} onValueChange={(value) => setFormData({...formData, gender: value as 'Male' | 'Female' | 'Other'})}>
                    <SelectTrigger className={formErrors.gender ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.gender}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                    className={formErrors.dateOfBirth ? 'border-red-500' : ''}
                  />
                  {formErrors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.dateOfBirth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maritalStatus">Marital Status *</Label>
                  <Select value={formData.maritalStatus || ''} onValueChange={(value) => setFormData({...formData, maritalStatus: value as 'Single' | 'Married' | 'Divorced'})}>
                    <SelectTrigger className={formErrors.maritalStatus ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Single">Single</SelectItem>
                      <SelectItem value="Married">Married</SelectItem>
                      <SelectItem value="Divorced">Divorced</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.maritalStatus && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.maritalStatus}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Employee Role *</Label>
                  <Select value={formData.role || ''} onValueChange={(value) => setFormData({...formData, role: value as UserRole})}>
                    <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="leadership">Leadership</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="team_lead">Team Lead</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="pilot">Pilot</SelectItem>
                      <SelectItem value="employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                    placeholder="Enter mobile number"
                    className={formErrors.contactNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.contactNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.contactNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailId">Email ID *</Label>
                  <Input
                    id="emailId"
                    type="email"
                    value={formData.emailId || ''}
                    onChange={(e) => setFormData({...formData, emailId: e.target.value})}
                    placeholder="Enter email address"
                    className={formErrors.emailId ? 'border-red-500' : ''}
                  />
                  {formErrors.emailId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.emailId}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter residential address"
                    rows={2}
                    className={formErrors.address ? 'border-red-500' : ''}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="Enter city"
                    className={formErrors.city ? 'border-red-500' : ''}
                  />
                  {formErrors.city && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.city}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">Emergency Contact *</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    placeholder="Name and contact number"
                    className={formErrors.emergencyContact ? 'border-red-500' : ''}
                  />
                  {formErrors.emergencyContact && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.emergencyContact}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Identity Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Identity Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                  <Input
                    id="aadharNumber"
                    value={formData.aadharNumber || ''}
                    onChange={(e) => setFormData({...formData, aadharNumber: e.target.value})}
                    placeholder="Enter Aadhar number"
                    className={formErrors.aadharNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.aadharNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.aadharNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    value={formData.panNumber || ''}
                    onChange={(e) => setFormData({...formData, panNumber: e.target.value})}
                    placeholder="Enter PAN number"
                    className={formErrors.panNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.panNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.panNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundCheckStatus">Background Check Status *</Label>
                  <Select value={formData.backgroundCheckStatus || ''} onValueChange={(value) => setFormData({...formData, backgroundCheckStatus: value as 'Pending' | 'Cleared' | 'Rejected'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cleared">Cleared</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Employment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining *</Label>
                  <Input
                    id="dateOfJoining"
                    type="date"
                    value={formData.dateOfJoining ? new Date(formData.dateOfJoining).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({...formData, dateOfJoining: e.target.value})}
                    className={formErrors.dateOfJoining ? 'border-red-500' : ''}
                  />
                  {formErrors.dateOfJoining && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.dateOfJoining}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employmentType">Employment Type *</Label>
                  <Select value={formData.employmentType || ''} onValueChange={(value) => setFormData({...formData, employmentType: value as 'Full-Time' | 'Part-Time' | 'Contract' | 'Intern'})}>
                    <SelectTrigger className={formErrors.employmentType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-Time">Full-Time</SelectItem>
                      <SelectItem value="Part-Time">Part-Time</SelectItem>
                      <SelectItem value="Contract">Contract</SelectItem>
                      <SelectItem value="Intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.employmentType && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.employmentType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation || ''}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    placeholder="Job title"
                    className={formErrors.designation ? 'border-red-500' : ''}
                  />
                  {formErrors.designation && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.designation}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department || ''} onValueChange={(value) => setFormData({...formData, department: value as 'Operations' | 'Marketing' | 'Tech' | 'HR' | 'Finance' | 'Other'})}>
                    <SelectTrigger className={formErrors.department ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Tech">Tech</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.department && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.department}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reportingManagerId">Reporting Manager ID</Label>
                  <Input
                    id="reportingManagerId"
                    value={formData.reportingManagerId || ''}
                    onChange={(e) => setFormData({...formData, reportingManagerId: e.target.value})}
                    placeholder="Manager's employee ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shiftType">Shift Type *</Label>
                  <Select value={formData.shiftType || ''} onValueChange={(value) => setFormData({...formData, shiftType: value as 'Morning' | 'Evening' | 'Rotational'})}>
                    <SelectTrigger className={formErrors.shiftType ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select shift" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Morning">Morning</SelectItem>
                      <SelectItem value="Evening">Evening</SelectItem>
                      <SelectItem value="Rotational">Rotational</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.shiftType && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.shiftType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workLocation">Work Location *</Label>
                  <Input
                    id="workLocation"
                    value={formData.workLocation || ''}
                    onChange={(e) => setFormData({...formData, workLocation: e.target.value})}
                    placeholder="Office or hub location"
                    className={formErrors.workLocation ? 'border-red-500' : ''}
                  />
                  {formErrors.workLocation && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.workLocation}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="employeeStatus">Employee Status *</Label>
                  <Select value={formData.employeeStatus || ''} onValueChange={(value) => setFormData({...formData, employeeStatus: value as 'Active' | 'On Leave' | 'Terminated'})}>
                    <SelectTrigger className={formErrors.employeeStatus ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Leave">On Leave</SelectItem>
                      <SelectItem value="Terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.employeeStatus && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.employeeStatus}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salaryMode">Salary Mode *</Label>
                  <Select value={formData.salaryMode || ''} onValueChange={(value) => setFormData({...formData, salaryMode: value as 'Bank' | 'UPI' | 'Cash'})}>
                    <SelectTrigger className={formErrors.salaryMode ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bank">Bank</SelectItem>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.salaryMode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.salaryMode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backgroundCheckStatus">Background Check Status *</Label>
                  <Select value={formData.backgroundCheckStatus || ''} onValueChange={(value) => setFormData({...formData, backgroundCheckStatus: value as 'Pending' | 'Cleared' | 'Rejected'})}>
                    <SelectTrigger className={formErrors.backgroundCheckStatus ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Cleared">Cleared</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.backgroundCheckStatus && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.backgroundCheckStatus}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Salary Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Salary Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monthlySalary">Monthly Salary *</Label>
                  <Input
                    id="monthlySalary"
                    type="number"
                    value={formData.monthlySalary || ''}
                    onChange={(e) => setFormData({...formData, monthlySalary: parseFloat(e.target.value) || 0})}
                    placeholder="Gross amount"
                    className={formErrors.monthlySalary ? 'border-red-500' : ''}
                  />
                  {formErrors.monthlySalary && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.monthlySalary}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
                  <Input
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => setFormData({...formData, bankAccountNumber: e.target.value})}
                    placeholder="For salary credit"
                    className={formErrors.bankAccountNumber ? 'border-red-500' : ''}
                  />
                  {formErrors.bankAccountNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.bankAccountNumber}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
                  <Input
                    id="ifscCode"
                    value={formData.ifscCode || ''}
                    onChange={(e) => setFormData({...formData, ifscCode: e.target.value})}
                    placeholder="Bank IFSC code"
                    className={formErrors.ifscCode ? 'border-red-500' : ''}
                  />
                  {formErrors.ifscCode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.ifscCode}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="uanNumber">UAN Number</Label>
                  <Input
                    id="uanNumber"
                    value={formData.uanNumber || ''}
                    onChange={(e) => setFormData({...formData, uanNumber: e.target.value})}
                    placeholder="For EPF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="esicNumber">ESIC Number</Label>
                  <Input
                    id="esicNumber"
                    value={formData.esicNumber || ''}
                    onChange={(e) => setFormData({...formData, esicNumber: e.target.value})}
                    placeholder="For insurance"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="pfEligible"
                    checked={formData.pfEligible || false}
                    onCheckedChange={(checked) => setFormData({...formData, pfEligible: checked === true})}
                  />
                  <Label htmlFor="pfEligible">PF Eligible</Label>
                </div>
              </div>
            </div>

            {/* Document URLs */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Document Management</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="photoUrl">Profile Photo URL</Label>
                  <Input
                    id="photoUrl"
                    value={formData.photoUrl || ''}
                    onChange={(e) => setFormData({...formData, photoUrl: e.target.value})}
                    placeholder="Profile photo path"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dlCopyUrl">DL Copy URL</Label>
                  <Input
                    id="dlCopyUrl"
                    value={formData.dlCopyUrl || ''}
                    onChange={(e) => setFormData({...formData, dlCopyUrl: e.target.value})}
                    placeholder="Driving license document path"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={closeDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="outline" 
              onClick={resetForm}
              disabled={isSubmitting}
            >
              Clear Form
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 mr-2 animate-spin">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992c0-.001 0-.002 0-.003M7.477 4.992c0 .001 0 .002 0 .003v4.992M19.015 4.356c.001 0 .002 0 .003 0v4.992c0 .001 0 .002 0 .003M4.992 19.015c0 .001 0 .002 0 .003v-4.992c0-.001 0-.002 0-.003" />
                    </svg>
                  </div>
                  {editingEmployee ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  {editingEmployee ? 'Update' : 'Add'} Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmployeeManagement;
