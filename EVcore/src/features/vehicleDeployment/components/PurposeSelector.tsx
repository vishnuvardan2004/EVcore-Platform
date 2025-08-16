
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Target, CheckSquare, User, ChevronRight } from 'lucide-react';

interface PurposeSelectorProps {
  onPurposeSelected: (purpose: 'Office' | 'Pilot') => void;
}

export const PurposeSelector: React.FC<PurposeSelectorProps> = ({ onPurposeSelected }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <CardTitle className="text-xl font-semibold text-gray-800">
            Select Deployment Purpose
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Choose the purpose for this vehicle deployment
          </p>
        </CardHeader>
      </Card>

      {/* Purpose Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Office Purpose */}
        <Card className="border-2 border-blue-200 hover:border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 hover:shadow-lg cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full mx-auto bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-blue-700 mb-2">
                  Office Purpose
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Standard office deployment for regular business use
                </p>
                
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    Standard Process
                  </Badge>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Basic vehicle forms
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Quick deployment
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => onPurposeSelected('Office')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Select Office
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pilot Purpose */}
        <Card className="border-2 border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-50 to-red-50 transition-all duration-300 hover:shadow-lg cursor-pointer">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full mx-auto bg-orange-100 flex items-center justify-center">
                  <Target className="w-8 h-8 text-orange-600" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <CheckSquare className="w-3 h-3 text-white" />
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-orange-700 mb-2">
                  Pilot Purpose
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Pilot deployment with comprehensive checklist validation
                </p>
                
                <div className="space-y-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                    Enhanced Process
                  </Badge>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center justify-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Detailed checklists
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      Quality validation
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => onPurposeSelected('Pilot')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3"
              >
                <Target className="w-4 h-4 mr-2" />
                Select Pilot
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-0 bg-gray-50">
        <CardContent className="p-4">
          <div className="text-center text-sm text-gray-600">
            💡 <strong>Tip:</strong> Choose "Office" for standard deployments or "Pilot" when detailed validation is required
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
