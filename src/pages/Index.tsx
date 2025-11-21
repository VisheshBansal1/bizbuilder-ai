import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WebsitePreview } from "@/components/WebsitePreview";

const Index = () => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWebsite, setGeneratedWebsite] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const examplePrompts = [
    "Create a website for my bakery called Sweet Oven",
    "Build a site for Mountain View Yoga Studio",
    "Design a portfolio for Alex Chen Photography",
    "Make a website for TechFix Computer Repair",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a business description");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-website", {
        body: { prompt },
      });

      if (error) throw error;

      setGeneratedWebsite(data);
      toast.success("Website generated successfully!");
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate website");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedWebsite) return;

    // Create files
    const files = {
      "index.html": generatedWebsite.html,
      "styles.css": generatedWebsite.css,
      "script.js": generatedWebsite.js || "// Add your custom JavaScript here",
    };

    // Create a simple text representation of the files
    let combinedContent = "";
    Object.entries(files).forEach(([filename, content]) => {
      combinedContent += `\n\n/* ===== ${filename} ===== */\n\n${content}`;
    });

    const blob = new Blob([combinedContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "website-files.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Website files downloaded!");
  };

  const handleCopyCode = () => {
    if (!generatedWebsite) return;

    const fullCode = `
<!-- index.html -->
${generatedWebsite.html}

/* styles.css */
${generatedWebsite.css}

// script.js
${generatedWebsite.js || "// Add your custom JavaScript here"}
    `;

    navigator.clipboard.writeText(fullCode);
    setCopied(true);
    toast.success("Code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                BizBuilder AI
              </h1>
            </div>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Generate complete business websites with AI
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Describe Your Business</h2>
              
              <div className="space-y-4">
                <Textarea
                  placeholder="E.g., Create a website for my bakery called Sweet Oven. We specialize in artisan breads and pastries..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px] resize-none"
                />

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Website
                    </>
                  )}
                </Button>
              </div>
            </Card>

            {/* Example Prompts */}
            <Card className="p-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
                Try these examples:
              </h3>
              <div className="space-y-2">
                {examplePrompts.map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(example)}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </Card>

            {/* Export Actions */}
            {generatedWebsite && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Export Options</h3>
                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={handleCopyCode}
                    variant="outline"
                    className="flex-1"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Code
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            )}
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            {generatedWebsite ? (
              <WebsitePreview data={generatedWebsite} />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center min-h-[600px] text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Website Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Enter your business details and click generate to see your AI-powered
                  website appear here
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
