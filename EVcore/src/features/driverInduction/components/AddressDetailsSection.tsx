import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Home, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface AddressDetailsData {
  presentAddress: string;
  presentAddressPhoto: File | null;
  permanentAddress: string;
  permanentAddressProof: File | null;
  electricityBill: File | null;
}

interface AddressDetailsSectionProps {
  data: AddressDetailsData;
  onChange: (data: Partial<AddressDetailsData>) => void;
}

export const AddressDetailsSection: React.FC<AddressDetailsSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (field: 'presentAddressPhoto' | 'permanentAddressProof' | 'electricityBill', file: File | null) => {
    onChange({ [field]: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold">5. Address Details</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="presentAddress">
              Present Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="presentAddress"
              placeholder="Enter current address"
              value={data.presentAddress}
              onChange={(e) => onChange({ presentAddress: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              Present Address Photo <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('presentAddressPhoto', e.target.files?.[0] || null)}
                className="hidden"
                id="presentAddressPhoto"
              />
              <label htmlFor="presentAddressPhoto" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.presentAddressPhoto ? data.presentAddressPhoto.name : 'Click to upload address photo'}
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="permanentAddress">
              Permanent Address <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="permanentAddress"
              placeholder="Enter permanent address"
              value={data.permanentAddress}
              onChange={(e) => onChange({ permanentAddress: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              Permanent Address Proof <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('permanentAddressProof', e.target.files?.[0] || null)}
                className="hidden"
                id="permanentAddressProof"
              />
              <label htmlFor="permanentAddressProof" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.permanentAddressProof ? data.permanentAddressProof.name : 'Click to upload address proof'}
                </p>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Current Electricity Bill <span className="text-red-500">*</span>
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload('electricityBill', e.target.files?.[0] || null)}
              className="hidden"
              id="electricityBill"
            />
            <label htmlFor="electricityBill" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {data.electricityBill ? data.electricityBill.name : 'Click to upload electricity bill'}
              </p>
            </label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
