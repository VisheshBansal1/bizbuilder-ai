import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log("Generating website for prompt:", prompt);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Generate text content using tool calling for structured output
    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional website content generator. Generate complete, realistic content for a business website based on the user's prompt. Use the generate_website_content function to return the structured data."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_website_content",
              description: "Generate structured website content including business name, hero section, about, services, testimonials, and contact info",
              parameters: {
                type: "object",
                properties: {
                  business_name: {
                    type: "string",
                    description: "The name of the business"
                  },
                  hero_title: {
                    type: "string",
                    description: "Compelling headline for hero section"
                  },
                  hero_subtitle: {
                    type: "string",
                    description: "Engaging subtitle (1-2 sentences)"
                  },
                  about: {
                    type: "string",
                    description: "Detailed about section (3-4 sentences)"
                  },
                  services: {
                    type: "array",
                    description: "Array of 3-6 services",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        icon: { type: "string", description: "Appropriate emoji" }
                      },
                      required: ["title", "description", "icon"]
                    }
                  },
                  testimonials: {
                    type: "array",
                    description: "Array of 3-4 testimonials with generic names",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Generic name like 'Sarah M.' or 'John D.'" },
                        text: { type: "string" },
                        rating: { type: "number", minimum: 1, maximum: 5 }
                      },
                      required: ["name", "text", "rating"]
                    }
                  },
                  contact: {
                    type: "string",
                    description: "Contact information text"
                  },
                  business_type: {
                    type: "string",
                    description: "Industry category for image generation (e.g., bakery, yoga studio, photography)"
                  }
                },
                required: ["business_name", "hero_title", "hero_subtitle", "about", "services", "testimonials", "contact", "business_type"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_website_content" } }
      }),
    });

    if (!contentResponse.ok) {
      const errorText = await contentResponse.text();
      console.error("Content generation failed:", errorText);
      throw new Error("Failed to generate content");
    }

    const contentData = await contentResponse.json();
    console.log("Raw AI response:", JSON.stringify(contentData, null, 2));
    
    // Extract structured data from tool call
    const toolCall = contentData.choices[0].message.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("AI did not return structured data");
    }
    
    const generatedContent = JSON.parse(toolCall.function.arguments);
    console.log("Generated content:", generatedContent);

    // Generate images
    const imagePrompts = {
      hero: `professional hero banner image for ${generatedContent.business_name}, ${generatedContent.business_type}, modern, high quality, cinematic lighting`,
      gallery: [
        `${generatedContent.business_type} interior, professional, bright, welcoming atmosphere`,
        `${generatedContent.business_type} product or service showcase, clean, modern aesthetic`,
        `${generatedContent.business_type} team or workspace, professional, collaborative environment`,
      ]
    };

    const images: any = { hero: "", gallery: [] };

    // Generate hero image
    console.log("Generating hero image...");
    const heroResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: imagePrompts.hero }],
        modalities: ["image", "text"],
      }),
    });

    if (heroResponse.ok) {
      const heroData = await heroResponse.json();
      if (heroData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
        images.hero = heroData.choices[0].message.images[0].image_url.url;
        console.log("Hero image generated successfully");
      }
    }

    // Generate gallery images
    for (let i = 0; i < imagePrompts.gallery.length; i++) {
      console.log(`Generating gallery image ${i + 1}...`);
      const galleryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: imagePrompts.gallery[i] }],
          modalities: ["image", "text"],
        }),
      });

      if (galleryResponse.ok) {
        const galleryData = await galleryResponse.json();
        if (galleryData.choices?.[0]?.message?.images?.[0]?.image_url?.url) {
          images.gallery.push(galleryData.choices[0].message.images[0].image_url.url);
          console.log(`Gallery image ${i + 1} generated successfully`);
        }
      }
    }

    // Generate HTML template
    const html = generateHTML(generatedContent, images);
    const css = generateCSS();

    const result = {
      ...generatedContent,
      images,
      html,
      css,
      js: "// Add custom JavaScript here if needed",
    };

    console.log("Website generation complete");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to generate website" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function generateHTML(content: any, images: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.business_name}</title>
    <meta name="description" content="${content.hero_subtitle}">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <div class="container">
                <h1 class="logo">${content.business_name}</h1>
                <ul class="nav-menu">
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#gallery">Gallery</a></li>
                    <li><a href="#testimonials">Testimonials</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </div>
        </nav>
    </header>

    <main>
        <section id="home" class="hero" style="background-image: url('${images.hero}');">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h2>${content.hero_title}</h2>
                <p>${content.hero_subtitle}</p>
                <a href="#contact" class="cta-button">Get Started</a>
            </div>
        </section>

        <section id="about" class="section">
            <div class="container">
                <h2>About Us</h2>
                <p>${content.about}</p>
            </div>
        </section>

        <section id="services" class="section bg-light">
            <div class="container">
                <h2>Our Services</h2>
                <div class="services-grid">
                    ${content.services.map((service: any) => `
                        <div class="service-card">
                            <div class="service-icon">${service.icon}</div>
                            <h3>${service.title}</h3>
                            <p>${service.description}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="gallery" class="section">
            <div class="container">
                <h2>Gallery</h2>
                <div class="gallery-grid">
                    ${images.gallery.map((img: string) => `
                        <img src="${img}" alt="Gallery image" loading="lazy">
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="testimonials" class="section bg-light">
            <div class="container">
                <h2>What Our Clients Say</h2>
                <div class="testimonials-grid">
                    ${content.testimonials.map((t: any) => `
                        <div class="testimonial-card">
                            <div class="stars">${'★'.repeat(t.rating)}</div>
                            <p>"${t.text}"</p>
                            <p class="author">— ${t.name}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </section>

        <section id="contact" class="section">
            <div class="container">
                <h2>Contact Us</h2>
                <p>${content.contact}</p>
                <form class="contact-form">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Your Email" required>
                    <textarea placeholder="Your Message" rows="5" required></textarea>
                    <button type="submit" class="cta-button">Send Message</button>
                </form>
            </div>
        </section>
    </main>

    <footer>
        <div class="container">
            <p>&copy; ${new Date().getFullYear()} ${content.business_name}. All rights reserved.</p>
        </div>
    </footer>

    <script src="script.js"></script>
</body>
</html>`;
}

function generateCSS(): string {
  return `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary-color: #2563eb;
    --secondary-color: #0891b2;
    --text-dark: #1f2937;
    --text-light: #6b7280;
    --bg-light: #f9fafb;
    --white: #ffffff;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: var(--text-dark);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

/* Header */
header {
    background: var(--white);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

nav {
    padding: 1rem 0;
}

nav .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    text-decoration: none;
    color: var(--text-dark);
    font-weight: 500;
    transition: color 0.3s;
}

.nav-menu a:hover {
    color: var(--primary-color);
}

/* Hero */
.hero {
    min-height: 600px;
    display: flex;
    align-items: center;
    background-size: cover;
    background-position: center;
    position: relative;
}

.hero-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37, 99, 235, 0.9), rgba(8, 145, 178, 0.7));
}

.hero-content {
    position: relative;
    z-index: 1;
    color: var(--white);
    max-width: 600px;
    padding: 4rem 2rem;
}

.hero-content h2 {
    font-size: 3rem;
    margin-bottom: 1rem;
    font-weight: 800;
}

.hero-content p {
    font-size: 1.25rem;
    margin-bottom: 2rem;
    opacity: 0.95;
}

.cta-button {
    display: inline-block;
    padding: 1rem 2rem;
    background: var(--white);
    color: var(--primary-color);
    text-decoration: none;
    border-radius: 0.5rem;
    font-weight: 600;
    transition: transform 0.3s, box-shadow 0.3s;
    border: none;
    cursor: pointer;
}

.cta-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

/* Sections */
.section {
    padding: 5rem 0;
}

.section h2 {
    font-size: 2.5rem;
    margin-bottom: 3rem;
    text-align: center;
}

.bg-light {
    background: var(--bg-light);
}

/* Services */
.services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.service-card {
    background: var(--white);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
}

.service-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}

.service-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.service-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

/* Gallery */
.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
}

.gallery-grid img {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-radius: 0.75rem;
    transition: transform 0.3s;
}

.gallery-grid img:hover {
    transform: scale(1.05);
}

/* Testimonials */
.testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.testimonial-card {
    background: var(--white);
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stars {
    color: var(--secondary-color);
    font-size: 1.25rem;
    margin-bottom: 1rem;
}

.testimonial-card .author {
    font-weight: 600;
    margin-top: 1rem;
}

/* Contact Form */
.contact-form {
    max-width: 600px;
    margin: 2rem auto 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-family: inherit;
    font-size: 1rem;
}

.contact-form button {
    width: 100%;
}

/* Footer */
footer {
    background: var(--text-dark);
    color: var(--white);
    text-align: center;
    padding: 2rem 0;
}

/* Responsive */
@media (max-width: 768px) {
    .nav-menu {
        display: none;
    }
    
    .hero-content h2 {
        font-size: 2rem;
    }
    
    .section h2 {
        font-size: 2rem;
    }
}`;
}
