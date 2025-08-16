import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { CreditCard, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface IdentityDocsData {
  aadhaarNumber: string;
  aadhaarPic: File | null;
  panNumber: string;
  panPic: File | null;
}

interface IdentityDocumentsSectionProps {
  data: IdentityDocsData;
  onChange: (data: Partial<IdentityDocsData>) => void;
}

export const IdentityDocumentsSection: React.FC<IdentityDocumentsSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (field: 'aadhaarPic' | 'panPic', file: File | null) => {
    onChange({ [field]: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold">3. Identity Documents</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aadhaarNumber">
              Aadhaar Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="aadhaarNumber"
              placeholder="Enter 12-digit Aadhaar number"
              value={data.aadhaarNumber}
              onChange={(e) => onChange({ aadhaarNumber: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              Aadhaar Picture <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('aadhaarPic', e.target.files?.[0] || null)}
                className="hidden"
                id="aadhaarPic"
              />
              <label htmlFor="aadhaarPic" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.aadhaarPic ? data.aadhaarPic.name : 'Click to upload Aadhaar'}
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="panNumber">
              PAN Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="panNumber"
              placeholder="Enter PAN number"
              value={data.panNumber}
              onChange={(e) => onChange({ panNumber: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              PAN Picture <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('panPic', e.target.files?.[0] || null)}
                className="hidden"
                id="panPic"
              />
              <label htmlFor="panPic" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.panPic ? data.panPic.name : 'Click to upload PAN'}
                </p>
              </label>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
