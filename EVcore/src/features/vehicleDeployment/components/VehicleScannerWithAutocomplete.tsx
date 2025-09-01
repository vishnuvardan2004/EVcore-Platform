import React, { useState, useEffect, useRef } from 'react';
import { Search, AlertCircle, CheckCircle, Loader2, X, Car, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: string;
  registrationNumber: string;
  brand: string;
  model: string;
  year: number;
  status: string;
  currentHub: string;
}

interface VehicleScannerWithAutocompleteProps {
  onVehicleDetected: (vehicleNumber: string) => void;
  isProcessing?: boolean;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
}

// Custom hook for vehicle autocomplete
const useVehicleAutocomplete = () => {
  const [suggestions, setSuggestions] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSuggestions = async (query: string): Promise<Vehicle[]> => {
    if (!query || query.length < 1) {
      setSuggestions([]); // Clear suggestions when no query
      return [];
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Use the frontend API proxy which handles authentication
      const response = await fetch(
        `/api/vehicle-deployment/vehicles/autocomplete?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          signal: abortControllerRef.current.signal // Add abort signal
        }
      );

      // Check if response is OK
      if (!response.ok) {
        // Get response text for debugging
        const responseText = await response.text();
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        });

        if (response.status === 401) {
          throw new Error('Authentication required. Please log in first.');
        }
        if (response.status === 404) {
          throw new Error('Autocomplete service not available. Please check if the backend is running.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON Response:', {
          contentType,
          url: response.url,
          responseText: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
        });
        throw new Error(`Expected JSON response but got ${contentType || 'unknown'}. The API endpoint may not be properly configured.`);
      }

      const data = await response.json();
      
      console.log('Autocomplete API Response:', {
        success: data.success,
        dataLength: data.data?.length || 0,
        firstItem: data.data?.[0],
        query: query
      });
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch vehicle suggestions');
      }

      const vehicles = data.data || [];
      setSuggestions(vehicles); // Update the suggestions state
      return vehicles;
    } catch (error) {
      // Don't set error state if request was aborted (normal behavior)
      if (error.name === 'AbortError') {
        setSuggestions([]); // Clear suggestions on abort
        return [];
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch suggestions';
      setError(errorMessage);
      console.error('Vehicle autocomplete error:', error);
      setSuggestions([]); // Clear suggestions on error
      return [];
    } finally {
      setLoading(false);
    }
  };

  return { suggestions, loading, error, fetchSuggestions, setSuggestions };
};

export const VehicleScannerWithAutocomplete: React.FC<VehicleScannerWithAutocompleteProps> = ({
  onVehicleDetected,
  isProcessing = false,
  onError,
  placeholder = "Enter or search vehicle registration number...",
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [validationState, setValidationState] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  
  const { suggestions, loading, error, fetchSuggestions } = useVehicleAutocomplete();
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Debug suggestions changes
  useEffect(() => {
    console.log('Suggestions updated:', {
      count: suggestions.length,
      suggestions: suggestions
    });
  }, [suggestions]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (inputValue.trim()) {
      // Skip validation if a vehicle is already selected and input matches
      if (selectedVehicle && inputValue === selectedVehicle.registrationNumber) {
        return;
      }

      setValidationState('idle');
      debounceTimerRef.current = setTimeout(async () => {        
        const results = await fetchSuggestions(inputValue.trim());
        
        console.log('Debounced search results:', {
          query: inputValue.trim(),
          resultsLength: results.length,
          hasResults: results.length > 0
        });
        
        if (results.length > 0) {
          setIsOpen(true);
          // Check if current input exactly matches any suggestion
          const exactMatch = results.find(
            vehicle => vehicle.registrationNumber.toLowerCase() === inputValue.toLowerCase()
          );
          
          if (exactMatch) {
            console.log('Exact match found:', exactMatch.registrationNumber);
            setSelectedVehicle(exactMatch);
            setValidationState('valid');
            setValidationMessage(`${exactMatch.brand} ${exactMatch.model} (${exactMatch.year})`);
          } else {
            console.log('Partial matches found, showing suggestions');
            // If there are suggestions but no exact match, keep idle state (don't mark as invalid)
            setSelectedVehicle(null);
            setValidationState('idle');
            setValidationMessage('');
          }
        } else if (inputValue.length >= 3 && !error) {
          console.log('No results found for 3+ char input, marking as invalid');
          // Only show "not found" for longer input (3+ chars) to avoid false negatives on short searches
          setSelectedVehicle(null);
          setValidationState('invalid');
          setValidationMessage('This vehicle does not exist in the database');
          setIsOpen(false);
        } else {
          console.log('Short input or API error, staying idle');
          // For short input or when there's an API error, just close the popover but don't show error
          setSelectedVehicle(null);
          setValidationState('idle');
          setValidationMessage('');
          setIsOpen(false);
        }
      }, 300); // 300ms debounce
    } else {
      setIsOpen(false);
      setSelectedVehicle(null);
      setValidationState('idle');
      setValidationMessage('');
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]); // Remove fetchSuggestions from dependencies to prevent infinite loops

  // Focus management effect
  useEffect(() => {
    // Ensure input maintains focus after state changes
    const preserveFocus = () => {
      if (document.activeElement !== inputRef.current && !isOpen) {
        // Only restore focus if no other element is focused and popover is closed
        const activeEl = document.activeElement;
        if (activeEl === document.body || activeEl === null) {
          inputRef.current?.focus();
        }
      }
    };

    // Use a small delay to avoid focus conflicts
    const timeoutId = setTimeout(preserveFocus, 10);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [validationState, isOpen]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    // Reset validation if user is typing (not selecting)
    if (selectedVehicle && value !== selectedVehicle.registrationNumber) {
      setSelectedVehicle(null);
      setValidationState('idle');
      setValidationMessage('');
    }
  };

  const handleSuggestionSelect = (vehicle: Vehicle) => {
    setInputValue(vehicle.registrationNumber);
    setSelectedVehicle(vehicle);
    setValidationState('valid');
    setValidationMessage(`${vehicle.brand} ${vehicle.model} (${vehicle.year})`);
    setIsOpen(false);
    
    // Clear any pending debounce timer to prevent validation re-trigger
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Notify parent component
    onVehicleDetected(vehicle.registrationNumber);
  };

  const handleManualEntry = () => {
    if (validationState === 'invalid') {
      onError?.('Please select a valid vehicle from the database');
      return;
    }
    
    if (selectedVehicle) {
      onVehicleDetected(inputValue);
    } else if (inputValue.trim()) {
      // For cases where user types exact match but hasn't selected from dropdown
      const exactMatch = suggestions.find(
        vehicle => vehicle.registrationNumber.toLowerCase() === inputValue.toLowerCase()
      );
      
      if (exactMatch) {
        handleSuggestionSelect(exactMatch);
      } else {
        onError?.('Please select a valid vehicle from the suggestions');
      }
    }
  };

  const clearInput = () => {
    setInputValue('');
    setSelectedVehicle(null);
    setValidationState('idle');
    setValidationMessage('');
    setIsOpen(false);
    
    // Use requestAnimationFrame to ensure focus is restored after all re-renders
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const getInputIcon = () => {
    if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (validationState === 'valid') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (validationState === 'invalid') return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Search className="h-4 w-4 text-muted-foreground" />;
  };

  const getInputBorderColor = () => {
    if (validationState === 'valid') return 'border-green-500 focus-visible:ring-green-500';
    if (validationState === 'invalid') return 'border-red-500 focus-visible:ring-red-500';
    return '';
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <Car className="w-4 h-4 text-green-600" />
          </div>
          Smart Vehicle Scanner
          <Badge variant="outline" className="text-xs bg-green-100 border-green-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Smart Mode
          </Badge>
        </CardTitle>
        <p className="text-gray-600 text-sm mt-2">
          Start typing a registration number to see intelligent suggestions from the database
        </p>
      </CardHeader>
      
      <CardContent>
        <div className={cn("w-full space-y-4", className)}>
          <div className="relative">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                onClick={() => {
                  // Ensure focus is maintained and popover opens if there are suggestions
                  if (suggestions.length > 0 && inputValue.trim()) {
                    setIsOpen(true);
                  }
                }}
                onFocus={() => {
                  // Open popover when input is focused if there are suggestions
                  if (suggestions.length > 0 && inputValue.trim()) {
                    setIsOpen(true);
                  }
                }}
                className={cn(
                  "pr-20 pl-10 text-center text-lg font-mono tracking-wider",
                  getInputBorderColor()
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    setIsOpen(false);
                    handleManualEntry();
                  }
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                  if (e.key === 'ArrowDown' && isOpen) {
                    e.preventDefault();
                    // Focus first suggestion (handled by Command component)
                  }
                  if (e.key === 'ArrowUp' && isOpen) {
                    e.preventDefault();
                    // Focus last suggestion (handled by Command component)
                  }
                }}
                disabled={isProcessing}
              />
              
              {/* Search/Status Icon */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {getInputIcon()}
              </div>

              {/* Clear Button */}
              {inputValue && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-12">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-muted-foreground/20"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearInput();
                    }}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Submit/Scan Button */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false);
                    handleManualEntry();
                  }}
                  disabled={!inputValue.trim() || validationState === 'invalid' || isProcessing}
                  className="h-7 bg-green-600 hover:bg-green-700"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Scan'
                  )}
                </Button>
              </div>
            </div>

            {/* Popover for suggestions */}
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                {/* Invisible trigger positioned over the input for proper popover positioning */}
                <div 
                  className="absolute inset-0 pointer-events-none" 
                  aria-hidden="true"
                />
              </PopoverTrigger>

              <PopoverContent 
                className="w-[--radix-popover-trigger-width] p-0" 
                align="start"
                sideOffset={4}
                onOpenAutoFocus={(e) => {
                  // Prevent the popover from stealing focus from the input
                  e.preventDefault();
                }}
              >
                <Command shouldFilter={false}>
                  <CommandList className="max-h-48 overflow-y-auto">
                    {loading && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                        Searching vehicles...
                      </div>
                    )}
                    
                    {!loading && suggestions.length === 0 && inputValue && (
                      <CommandEmpty>
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                          No vehicles found matching "{inputValue}"
                        </div>
                      </CommandEmpty>
                    )}

                    {!loading && suggestions.length > 0 && (
                      <CommandGroup heading={`${suggestions.length} vehicle${suggestions.length !== 1 ? 's' : ''} found`}>
                        {suggestions.map((vehicle, index) => (
                          <CommandItem
                            key={vehicle.id || vehicle.registrationNumber || index}
                            value={vehicle.registrationNumber}
                            onSelect={() => {
                              console.log('Vehicle selected:', vehicle.registrationNumber);
                              handleSuggestionSelect(vehicle);
                              // Maintain focus on input after selection
                              setTimeout(() => {
                                inputRef.current?.focus();
                              }, 0);
                            }}
                            className="flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{vehicle.registrationNumber}</span>
                              <span className="text-xs text-muted-foreground">
                                {vehicle.brand} {vehicle.model} ({vehicle.year})
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {vehicle.currentHub}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Validation Message */}
          {validationMessage && (
            <Alert className={cn(
              "py-2",
              validationState === 'valid' && "border-green-200 bg-green-50",
              validationState === 'invalid' && "border-red-200 bg-red-50"
            )}>
              <AlertDescription className="text-sm flex items-center gap-2">
                {validationState === 'valid' && <CheckCircle className="h-4 w-4 text-green-600" />}
                {validationState === 'invalid' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {validationMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* API Error Message */}
          {error && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                Unable to fetch vehicle suggestions: {error}
                <br />
                <span className="text-xs">You can still enter the registration number manually.</span>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleScannerWithAutocomplete;
