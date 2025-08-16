import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Banknote, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface BankingDetailsData {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  bankBranch: string;
  bankProof: File | null;
}

interface BankingDetailsSectionProps {
  data: BankingDetailsData;
  onChange: (data: Partial<BankingDetailsData>) => void;
}

export const BankingDetailsSection: React.FC<BankingDetailsSectionProps> = ({
  data,
  onChange
}) => {
  const [isOpen, setIsOpen] = React.useState(true);

  const handleFileUpload = (file: File | null) => {
    onChange({ bankProof: file });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="flex w-full justify-between p-4 hover:bg-gray-50">
          <div className="flex items-center gap-2">
            <Banknote className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">4. Banking Details</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4 px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bankName">
              Bank Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankName"
              placeholder="Enter bank name"
              value={data.bankName}
              onChange={(e) => onChange({ bankName: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="accountNumber">
              Bank Account Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="accountNumber"
              placeholder="Enter account number"
              value={data.accountNumber}
              onChange={(e) => onChange({ accountNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ifscCode">
              IFSC Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ifscCode"
              placeholder="Enter IFSC code"
              value={data.ifscCode}
              onChange={(e) => onChange({ ifscCode: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bankBranch">
              Bank Branch <span className="text-red-500">*</span>
            </Label>
            <Input
              id="bankBranch"
              placeholder="Enter branch name"
              value={data.bankBranch}
              onChange={(e) => onChange({ bankBranch: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Proof of Bank Account <span className="text-red-500">*</span>
          </Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              className="hidden"
              id="bankProof"
            />
            <label htmlFor="bankProof" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">
                {data.bankProof ? data.bankProof.name : 'Click to upload bank proof (passbook/statement)'}
              </p>
            </label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
