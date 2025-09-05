import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Link, Image, FileSpreadsheet, CheckCircle, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { parseExcelFile, validateExcelFile, defaultDoelgroepen } from "@/utils/excelProcessor";

interface UploadSectionProps {
  onExcelProcessed: (data: { doelgroepen: any; availableSheets: string[] }) => void;
  onWebsiteUrlChange: (url: string) => void;
  onScreenshotChange: (file: File | null) => void;
  loading: boolean;
  error: string | null;
  onError: (error: string | null) => void;
}

export function UploadSection({ 
  onExcelProcessed, 
  onWebsiteUrlChange, 
  onScreenshotChange, 
  loading, 
  error, 
  onError 
}: UploadSectionProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [excelProcessed, setExcelProcessed] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processExcelFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processExcelFile(files[0]);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      onError(null);
      validateExcelFile(file);
      setUploadedFile(file);
      
      const data = await parseExcelFile(file);
      onExcelProcessed(data);
      setExcelProcessed(true);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Fout bij verwerken Excel bestand');
    }
  };

  const handleWebsiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setWebsiteUrl(url);
    onWebsiteUrlChange(url);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const file = files && files.length > 0 ? files[0] : null;
    setScreenshot(file);
    onScreenshotChange(file);
  };

  const useDefaultData = () => {
    onExcelProcessed({
      doelgroepen: defaultDoelgroepen,
      availableSheets: Object.keys(defaultDoelgroepen)
    });
    setExcelProcessed(true);
  };

  return (
    <Card className="shadow-card border-border/50">
      <CardHeader className="pb-6">
        <CardTitle className="text-2xl flex items-center gap-3">
          <Upload className="w-7 h-7 text-primary" />
          Upload & Configuratie
        </CardTitle>
        <p className="text-muted-foreground">
          Upload je Excel bestand met personas en voeg de website URL of screenshot toe
        </p>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {excelProcessed && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>Excel bestand succesvol verwerkt!</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="excel" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Excel Upload
            </TabsTrigger>
            <TabsTrigger value="website" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              Website Input
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <div
              className={`
                relative border-2 border-dashed rounded-lg transition-spring cursor-pointer
                ${dragActive 
                  ? 'border-primary bg-primary/5 shadow-glow' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
                ${loading ? 'pointer-events-none opacity-60' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center p-8">
                <FileSpreadsheet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  Sleep je Excel bestand hier naartoe of
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                  disabled={loading}
                />
                <Label htmlFor="excel-upload" className="cursor-pointer">
                  <Button variant="outline" disabled={loading}>
                    {loading ? 'Verwerken...' : 'Kies bestand'}
                  </Button>
                </Label>
                {uploadedFile && (
                  <p className="text-sm text-success mt-2">
                    ✓ {uploadedFile.name}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">
                    Geen Excel bestand? Gebruik voorbeelddata:
                  </p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={useDefaultData}
                    disabled={loading || excelProcessed}
                  >
                    Gebruik voorbeelddata
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="website" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="website-url" className="text-sm font-medium">Website URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={handleWebsiteUrlChange}
                  className="transition-spring"
                />
              </div>
              
              <div className="text-center text-muted-foreground">of</div>
              
              <div>
                <Label htmlFor="screenshot-upload" className="text-sm font-medium">Upload Screenshot</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="transition-spring"
                />
                {screenshot && (
                  <p className="text-sm text-success mt-1">
                    ✓ {screenshot.name}
                  </p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}