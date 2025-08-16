import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Users, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface FamilyEmergencyData {
  parentName: string;
  parentMobile: string;
  parentsPhoto: File | null;
  emergencyContactName: string;
  emergencyContactNumber: string;
}

interface FamilyEmergencySectionProps {
  data: FamilyEmergencyData;
  onChange: (data: Partial<FamilyEmergencyData>) => void;
}

export const FamilyEmergencySection: React.FC<FamilyEmergencySectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (file: File | null) => {
    onChange({ parentsPhoto: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-pink-600" />
            <h3 className="text-lg font-semibold">7. Family & Emergency</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parentName">
              Father/Mother Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="parentName"
              placeholder="Enter parent's name"
              value={data.parentName}
              onChange={(e) => onChange({ parentName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parentMobile">
              Father/Mother Mobile No <span className="text-red-500">*</span>
            </Label>
            <Input
              id="parentMobile"
              placeholder="Enter parent's mobile number"
              value={data.parentMobile}
              onChange={(e) => onChange({ parentMobile: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Parents Photo</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              className="hidden"
              id="parentsPhoto"
            />
            <label htmlFor="parentsPhoto" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {data.parentsPhoto ? data.parentsPhoto.name : 'Click to upload parents photo'}
              </p>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">
              Emergency Contact Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContactName"
              placeholder="Enter emergency contact name"
              value={data.emergencyContactName}
              onChange={(e) => onChange({ emergencyContactName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="emergencyContactNumber">
              Emergency Contact Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emergencyContactNumber"
              placeholder="Enter emergency contact number"
              value={data.emergencyContactNumber}
              onChange={(e) => onChange({ emergencyContactNumber: e.target.value })}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
