import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WebsitePreviewProps {
  data: {
    hero_title: string;
    hero_subtitle: string;
    about: string;
    services: Array<{ title: string; description: string; icon: string }>;
    testimonials: Array<{ name: string; text: string; rating: number }>;
    contact: string;
    images: {
      hero: string;
      gallery: string[];
    };
    html: string;
    css: string;
    js?: string;
  };
}

export const WebsitePreview = ({ data }: WebsitePreviewProps) => {
  // Validate and normalize data
  const safeData = {
    ...data,
    services: Array.isArray(data.services) ? data.services : [],
    testimonials: Array.isArray(data.testimonials) ? data.testimonials.map(t => ({
      ...t,
      rating: Math.min(5, Math.max(1, Number(t.rating) || 5))
    })) : [],
    images: {
      hero: data.images?.hero || '',
      gallery: Array.isArray(data.images?.gallery) ? data.images.gallery : []
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <Tabs defaultValue="preview" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
          <TabsTrigger value="css">CSS</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="m-0 p-0">
          <div className="bg-background p-8 max-h-[800px] overflow-y-auto">
            {/* Hero Section */}
            <section className="mb-12 relative rounded-xl overflow-hidden">
              {safeData.images.hero && (
                <div className="absolute inset-0">
                  <img
                    src={safeData.images.hero}
                    alt="Hero"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-background/50" />
                </div>
              )}
              <div className="relative z-10 py-20 px-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
                  {safeData.hero_title}
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl">
                  {safeData.hero_subtitle}
                </p>
                <button className="mt-6 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity">
                  Get Started
                </button>
              </div>
            </section>

            {/* About Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold mb-4">About Us</h2>
              <p className="text-muted-foreground leading-relaxed">{safeData.about}</p>
            </section>

            {/* Services Section */}
            {safeData.services.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Our Services</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {safeData.services.map((service, i) => (
                    <Card key={i} className="p-6 hover:shadow-md transition-shadow">
                      <div className="text-4xl mb-4">{service.icon || '🔹'}</div>
                      <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                      <p className="text-muted-foreground">{service.description}</p>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {safeData.images.gallery.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6">Gallery</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {safeData.images.gallery.map((img, i) => (
                    <img
                      key={i}
                      src={img}
                      alt={`Gallery ${i + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Testimonials Section */}
            {safeData.testimonials.length > 0 && (
              <section className="mb-12">
                <h2 className="text-3xl font-bold mb-6">What Clients Say</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {safeData.testimonials.map((testimonial, i) => {
                    const rating = testimonial.rating;
                    return (
                      <Card key={i} className="p-6">
                        <div className="flex mb-2">
                          {Array.from({ length: rating }, (_, j) => (
                            <span key={j} className="text-accent">★</span>
                          ))}
                        </div>
                        <p className="text-muted-foreground mb-4">"{testimonial.text}"</p>
                        <p className="font-semibold">— {testimonial.name}</p>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Contact Section */}
            <section>
              <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
              <p className="text-muted-foreground mb-6">{data.contact}</p>
              <Card className="p-6 bg-muted">
                <form className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                  <input
                    type="email"
                    placeholder="Your Email"
                    className="w-full px-4 py-2 rounded-lg border bg-background"
                  />
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border bg-background resize-none"
                  />
                  <button
                    type="button"
                    className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    Send Message
                  </button>
                </form>
              </Card>
            </section>
          </div>
        </TabsContent>

        <TabsContent value="html" className="m-0">
          <pre className="p-6 text-sm overflow-auto max-h-[800px] bg-muted">
            <code>{data.html}</code>
          </pre>
        </TabsContent>

        <TabsContent value="css" className="m-0">
          <pre className="p-6 text-sm overflow-auto max-h-[800px] bg-muted">
            <code>{data.css}</code>
          </pre>
        </TabsContent>
      </Tabs>
    </Card>
  );
};
