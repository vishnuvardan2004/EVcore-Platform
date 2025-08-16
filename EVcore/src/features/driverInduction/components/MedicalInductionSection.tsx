import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Heart, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface MedicalInductionData {
  medicalTestReport: File | null;
  medicalTestDate: Date | undefined;
  medicalTestExpiry: Date | undefined;
  inductionTeamMember: string;
  agreementCopy: File | null;
  agreementDate: Date | undefined;
}

interface MedicalInductionSectionProps {
  data: MedicalInductionData;
  onChange: (data: Partial<MedicalInductionData>) => void;
}

export const MedicalInductionSection: React.FC<MedicalInductionSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (field: 'medicalTestReport' | 'agreementCopy', file: File | null) => {
    onChange({ [field]: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold">8. Medical & Induction</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Medical Test Report <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('medicalTestReport', e.target.files?.[0] || null)}
                className="hidden"
                id="medicalTestReport"
              />
              <label htmlFor="medicalTestReport" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.medicalTestReport ? data.medicalTestReport.name : 'Click to upload medical report'}
                </p>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Medical Test Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.medicalTestDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.medicalTestDate ? format(data.medicalTestDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.medicalTestDate}
                    onSelect={(date) => onChange({ medicalTestDate: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Medical Test Report Expiry</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data.medicalTestExpiry && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data.medicalTestExpiry ? format(data.medicalTestExpiry, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data.medicalTestExpiry}
                    onSelect={(date) => onChange({ medicalTestExpiry: date })}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="inductionTeamMember">
            Induction Team Member <span className="text-red-500">*</span>
          </Label>
          <Input
            id="inductionTeamMember"
            placeholder="Enter induction team member name"
            value={data.inductionTeamMember}
            onChange={(e) => onChange({ inductionTeamMember: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>
              Agreement Copy <span className="text-red-500">*</span>
            </Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleFileUpload('agreementCopy', e.target.files?.[0] || null)}
                className="hidden"
                id="agreementCopy"
              />
              <label htmlFor="agreementCopy" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {data.agreementCopy ? data.agreementCopy.name : 'Click to upload agreement'}
                </p>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Agreement Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.agreementDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.agreementDate ? format(data.agreementDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.agreementDate}
                  onSelect={(date) => onChange({ agreementDate: date })}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
