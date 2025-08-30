import React, { useState } from 'react';
import { PageLayout } from '@/features/shared/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const MyAccount = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Password change form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    newPasswordConfirm: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  if (!user) {
    return null; // This shouldn't happen due to ProtectedRoute
  }

  // Check if user needs to change password (first login)
  const needsPasswordChange = user.isTemporaryPassword || user.mustChangePassword;

  // Password strength calculation
  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5;
    return Math.min(strength, 100);
  };

  const passwordStrength = calculatePasswordStrength(passwordForm.newPassword);
  const isPasswordValid = passwordStrength >= 75 && passwordForm.newPassword.length >= 8;
  const isConfirmValid = passwordForm.newPassword === passwordForm.newPasswordConfirm && passwordForm.newPasswordConfirm.length > 0;

  const getStrengthColor = (strength: number) => {
    if (strength < 25) return 'bg-red-500';
    if (strength < 50) return 'bg-orange-500';
    if (strength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = (strength: number) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setIsChangingPassword(true);

    try {
      // Validate form
      if (!isPasswordValid) {
        throw new Error('Password does not meet security requirements');
      }

      if (!isConfirmValid) {
        throw new Error('Passwords do not match');
      }

      // If this is a first login (temporary password), use the first-login endpoint
      if (needsPasswordChange) {
        await apiService.auth.firstLoginPasswordChange({
          newPassword: passwordForm.newPassword,
          newPasswordConfirm: passwordForm.newPasswordConfirm
        });
        
        toast({
          title: "Password Set Successfully",
          description: "Your account password has been set. You can now use it for future logins.",
        });
      } else {
        // Regular password change - requires current password
        if (!passwordForm.currentPassword) {
          throw new Error('Current password is required');
        }

        await apiService.auth.changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
          newPasswordConfirm: passwordForm.newPasswordConfirm
        });

        toast({
          title: "Password Changed Successfully",
          description: "Your password has been updated successfully.",
        });
      }

      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        newPasswordConfirm: ''
      });

      // If this was a temporary password change, refresh the page to update user state
      if (needsPasswordChange) {
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (error: any) {
      console.error('Password change failed:', error);
      setPasswordError(error.message || 'Failed to change password. Please try again.');
      
      toast({
        title: "Password Change Failed",
        description: error.message || 'An error occurred while changing your password.',
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInputChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    setPasswordError('');
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <PageLayout 
      title="👤 My Account" 
      subtitle="Manage your account settings and security"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">Email</Label>
                <p className="text-lg font-semibold">{user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Role</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                    {user.role === 'super_admin' ? 'Super Administrator' : 
                     user.role === 'admin' ? 'Administrator' : 
                     user.role === 'employee' ? 'Employee' : 'Pilot'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Password Management
            </CardTitle>
            <CardDescription>
              {needsPasswordChange 
                ? "You're using a temporary password. Please set your permanent password below."
                : "Update your account password for enhanced security"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            
            {/* First Login Warning */}
            {needsPasswordChange && (
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Action Required:</strong> You're currently using a temporary password. 
                  Please set your permanent password to continue using the platform.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-6">
              
              {passwordError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}

              {/* Current Password - Only show if not first login */}
              {!needsPasswordChange && (
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Enter your current password"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  {needsPasswordChange ? 'Your New Password' : 'New Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder={needsPasswordChange ? "Create your permanent password" : "Enter your new password"}
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Password Strength:</span>
                      <span className={`font-medium ${passwordStrength >= 75 ? 'text-green-600' : passwordStrength >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {getStrengthText(passwordStrength)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordStrength)}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Password Requirements */}
                <div className="space-y-1 text-sm">
                  <div className={`flex items-center ${passwordForm.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    {passwordForm.newPassword.length >= 8 ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    {/[A-Z]/.test(passwordForm.newPassword) ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    One uppercase letter
                  </div>
                  <div className={`flex items-center ${/[a-z]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    {/[a-z]/.test(passwordForm.newPassword) ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    One lowercase letter
                  </div>
                  <div className={`flex items-center ${/[0-9]/.test(passwordForm.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    {/[0-9]/.test(passwordForm.newPassword) ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    One number
                  </div>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPasswordConfirm">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="newPasswordConfirm"
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.newPasswordConfirm}
                    onChange={(e) => handleInputChange('newPasswordConfirm', e.target.value)}
                    placeholder="Confirm your new password"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                
                {/* Password Match Indicator */}
                {passwordForm.newPasswordConfirm && (
                  <div className={`flex items-center text-sm ${isConfirmValid ? 'text-green-600' : 'text-red-600'}`}>
                    {isConfirmValid ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                    {isConfirmValid ? 'Passwords match' : 'Passwords do not match'}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full flex items-center gap-2"
                disabled={!isPasswordValid || !isConfirmValid || isChangingPassword || (!needsPasswordChange && !passwordForm.currentPassword)}
              >
                <Shield className="w-4 h-4" />
                {isChangingPassword 
                  ? (needsPasswordChange ? 'Setting Password...' : 'Changing Password...')
                  : (needsPasswordChange ? 'Set My Password' : 'Change Password')
                }
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">Password Status</Label>
                <div className="flex items-center gap-2 mt-1">
                  {needsPasswordChange ? (
                    <>
                      <Badge variant="destructive" className="text-xs">Temporary Password</Badge>
                      <span className="text-sm text-gray-600">Action required</span>
                    </>
                  ) : (
                    <>
                      <Badge variant="outline" className="text-xs">Permanent Password</Badge>
                      <span className="text-sm text-gray-600">Secure</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Account Type</Label>
                <p className="text-sm font-medium capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
            
            {needsPasswordChange && (
              <Alert className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Security Notice:</strong> Please set your permanent password above to secure your account 
                  and access all platform features.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MyAccount;
