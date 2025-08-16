import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface PersonalInfoData {
  fullName: string;
  mobileNumber: string;
  emailId: string;
  dateOfBirth: Date | undefined;
  workingDays: string;
  salary: string;
  designation: string;
  yearsOfExperience: string;
  previousCompany: string;
}

interface PersonalInformationSectionProps {
  data: PersonalInfoData;
  onChange: (data: Partial<PersonalInfoData>) => void;
}

export const PersonalInformationSection: React.FC<PersonalInformationSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">1. Personal Information</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">
              Full Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="fullName"
              placeholder="Enter full name"
              value={data.fullName}
              onChange={(e) => onChange({ fullName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">
              Mobile Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mobileNumber"
              placeholder="Enter mobile number"
              value={data.mobileNumber}
              onChange={(e) => onChange({ mobileNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="emailId">
              Email ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="emailId"
              type="email"
              placeholder="Enter email address"
              value={data.emailId}
              onChange={(e) => onChange({ emailId: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label>
              Date of Birth <span className="text-red-500">*</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !data.dateOfBirth && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.dateOfBirth ? format(data.dateOfBirth, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.dateOfBirth}
                  onSelect={(date) => onChange({ dateOfBirth: date })}
                  disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="workingDays">Working Days</Label>
            <Input
              id="workingDays"
              placeholder="e.g., Monday to Friday"
              value={data.workingDays}
              onChange={(e) => onChange({ workingDays: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="salary">
              Salary <span className="text-red-500">*</span>
            </Label>
            <Input
              id="salary"
              placeholder="Enter salary amount"
              value={data.salary}
              onChange={(e) => onChange({ salary: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="designation">
              Designation <span className="text-red-500">*</span>
            </Label>
            <Input
              id="designation"
              placeholder="e.g., Driver, Pilot"
              value={data.designation}
              onChange={(e) => onChange({ designation: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="yearsOfExperience">Years of Experience</Label>
            <Input
              id="yearsOfExperience"
              placeholder="Enter years"
              value={data.yearsOfExperience}
              onChange={(e) => onChange({ yearsOfExperience: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="previousCompany">Previous Company</Label>
            <Input
              id="previousCompany"
              placeholder="Enter previous company"
              value={data.previousCompany}
              onChange={(e) => onChange({ previousCompany: e.target.value })}
            />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
