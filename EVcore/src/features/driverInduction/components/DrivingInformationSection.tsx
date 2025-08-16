import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Car, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface DrivingInfoData {
  licenceNumber: string;
  licencePic: File | null;
  drivingCertificate: File | null;
}

interface DrivingInformationSectionProps {
  data: DrivingInfoData;
  onChange: (data: Partial<DrivingInfoData>) => void;
}

export const DrivingInformationSection: React.FC<DrivingInformationSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (field: 'licencePic' | 'drivingCertificate', file: File | null) => {
    onChange({ [field]: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">2. Driving Information</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="licenceNumber">
            Driving Licence Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="licenceNumber"
            placeholder="Enter driving licence number"
            value={data.licenceNumber}
            onChange={(e) => onChange({ licenceNumber: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Driving Licence Picture <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('licencePic', e.target.files?.[0] || null)}
                className="hidden"
                id="licencePic"
              />
              <label htmlFor="licencePic" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.licencePic ? data.licencePic.name : 'Click to upload licence picture'}
                </p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Driving Certificate <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('drivingCertificate', e.target.files?.[0] || null)}
                className="hidden"
                id="drivingCertificate"
              />
              <label htmlFor="drivingCertificate" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.drivingCertificate ? data.drivingCertificate.name : 'Click to upload certificate'}
                </p>
              </label>
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
