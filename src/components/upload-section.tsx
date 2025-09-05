import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Link, Image, FileSpreadsheet } from "lucide-react";
import { useState } from "react";

export function UploadSection() {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");

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
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setUploadedFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setUploadedFile(files[0]);
    }
  };

  return (
    <Card className="shadow-card border-border/50 transition-smooth hover:shadow-elegant">
      <CardContent className="p-8">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Upload Personas Data
            </h2>
            <p className="text-muted-foreground">
              Upload een Excel bestand met persona data of voer een website URL in voor analyse
            </p>
          </div>

          {/* Excel Upload */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Excel Bestand</Label>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-smooth
                ${dragActive 
                  ? 'border-primary bg-primary/5 shadow-glow' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploadedFile ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6 text-success" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{uploadedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUploadedFile(null)}
                  >
                    Verwijderen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Sleep je Excel bestand hierheen
                    </p>
                    <p className="text-sm text-muted-foreground">
                      of klik om te uploaden (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-4">
            <Label htmlFor="website-url" className="text-base font-medium">
              Website URL
            </Label>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="website-url"
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Image className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              We nemen automatisch een screenshot voor analyse
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}