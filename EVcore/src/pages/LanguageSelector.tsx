
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LanguageSelector = () => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', status: 'Available' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', status: 'Coming Soon' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', status: 'Coming Soon' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳', status: 'Coming Soon' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', status: 'Coming Soon' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', status: 'Coming Soon' }
  ];

  const selectLanguage = (languageCode: string) => {
    if (languageCode === 'en') {
      setSelectedLanguage(languageCode);
      toast({
        title: "Language Changed",
        description: "Interface language has been set to English.",
      });
    } else {
      toast({
        title: "Coming Soon",
        description: "This language will be available in a future update.",
        variant: "default",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Language Selector</h1>
          <p className="text-gray-600">Choose your preferred language for the EVCORE platform interface</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle>Interface Language</CardTitle>
                <CardDescription>Select the language for menus, buttons, and system messages</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {languages.map((language) => (
                <div 
                  key={language.code}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedLanguage === language.code 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  } ${language.status === 'Coming Soon' ? 'opacity-60' : ''}`}
                  onClick={() => selectLanguage(language.code)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{language.flag}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{language.name}</h3>
                      <p className="text-sm text-gray-600">{language.nativeName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {language.status === 'Coming Soon' ? (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        Coming Soon
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                        Available
                      </span>
                    )}
                    {selectedLanguage === language.code && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Language Support Status</h4>
                <p className="text-sm text-blue-700">
                  Currently, only English is fully supported. We're working on adding support for major Indian languages. 
                  These will include complete translations for all interface elements, date formats, and number formats.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Configure date, time, and number formats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">DD/MM/YYYY (Indian Standard)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">24-hour (HH:MM)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">₹ (Indian Rupee)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;
