import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

const GTM_API_BASE = process.env.GTM_API_BASE || 'https://gtm.edwinlovett.com';

// Website analysis endpoint
app.post('/api/brand/analyze', async (req, res) => {
  const { url } = req.body;
  try {
    if (GTM_API_BASE) {
      const r = await fetch(`${GTM_API_BASE}/api/analyze-website`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url,
          includeTracking: true,
          trackingMode: 'javascript'
        })
      });
      if (!r.ok) throw new Error(await r.text());
      const data = await r.json();
      
      // Extract and transform important data points from new API format
      const transformedData = {
        name: data.context?.title || 'Unknown Brand',
        url: data.url,
        description: data.context?.h1 || data.context?.h2s?.[0] || data.context?.description || 'Auto-extracted brand information',
        colors: data.colors?.palette || ['#333333', '#cc3366', '#33373d', '#a78842'],
        screenshot: data.screenshot,
        logoUrl: data.logos?.[0]?.src || null,
        logos: data.logos || [],
        fonts: data.fonts?.all ? data.fonts.all.map(f => f.family) : (Array.isArray(data.fonts) ? data.fonts : []),
        rawFonts: data.fonts, // Store full font data for advanced usage
        social: data.social || {},
        meta: data.meta || {},
        layout: data.layout || {},
        tracking: data.tracking || {},
        processingTime: data.processingTime,
        timestamp: data.timestamp,
        // New fields from enhanced API
        techStack: data.techStack || {},
        multiPageBrand: data.multiPageBrand || {},
        rawApiResponse: data // Store full response for advanced features
      };
      
      return res.json(transformedData);
    }
    // Fallback mock
    return res.json({
      name: 'Site Nimbus',
      url,
      description: 'Auto-scraped summary (mock). Edit as needed.',
      colors: ['#62A8B2','#45D0E4','#28F9FF','#37E5FE','#B29FFB'],
      logoUrl: null,
      screenshot: null,
      logos: [],
      fonts: [],
      social: {},
      meta: {},
      layout: {},
      tracking: {}
    });
  } catch (e) {
    return res.status(500).json({ error: 'Website analysis failed', details: String(e) });
  }
});

// Personas generation with detailed logging and fallback
app.post('/api/personas/generate', async (req, res) => {
  const { prompt } = req.body || {};
  
  console.log('=== PERSONA GENERATION DEBUG ===');
  console.log('1. API Key present:', !!process.env.ANTHROPIC_API_KEY);
  console.log('2. API Key length:', process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.length : 0);
  console.log('3. Prompt received:', prompt ? 'Yes' : 'No');
  console.log('4. Prompt length:', prompt ? prompt.length : 0);
  
  // Return sample personas if no API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('5. No API key - returning sample personas');
    return res.json({ 
      personas: [
        {
          name: "Sarah Johnson - Suburban Homeowner",
          businessContext: "33-year-old marketing manager, homeowner for 5 years in Keller, TX",
          painPoints: [
            "AC unit is 8+ years old and breaking down frequently",
            "High energy bills during Texas summers", 
            "Difficulty finding reliable HVAC contractors",
            "Concerned about unexpected repair costs"
          ],
          behaviorPatterns: "Researches extensively online before hiring, reads Google reviews and NextDoor recommendations, prefers transparent pricing and warranties",
          motivations: "Comfortable home environment, energy efficiency, reliable service, protecting family investment",
          budget: "$200-400/month for maintenance, $3000-6000 for system replacement",
          mindset: "Cautious but willing to pay for quality, values transparency and guarantees",
          benefits: [
            "Guaranteed workmanship provides peace of mind",
            "Transparent pricing eliminates surprise costs",
            "Local expertise understands Texas climate needs"
          ],
          elevatorPitch: "Get reliable HVAC service you can trust with guaranteed workmanship and no hidden fees - perfect for busy homeowners who value quality and transparency.",
          cta: "Schedule Free Home Comfort Assessment"
        }
      ]
    });
  }

  try {
    console.log('5. Making API request to Anthropic...');
    
    const requestBody = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    };
    
    console.log('6. Request body:', JSON.stringify(requestBody, null, 2));
    
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2024-01-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('7. API Response status:', r.status);
    
    if (!r.ok) {
      const errorText = await r.text();
      console.log('8. API Error response:', errorText);
      throw new Error(`API returned ${r.status}: ${errorText}`);
    }
    
    const data = await r.json();
    console.log('9. API Success response:', JSON.stringify(data, null, 2));
    
    let text = data?.content?.[0]?.text || '{}';
    console.log('10. Extracted text:', text.substring(0, 200) + '...');
    
    text = text.replace(/```json\n?/g,'').replace(/```\n?/g,'').trim();
    const parsed = JSON.parse(text);
    
    console.log('11. Parsed result:', parsed);
    res.json(parsed);
    
  } catch (e) {
    console.log('ERROR in persona generation:', String(e));
    console.log('Using fallback personas due to API error');
    
    // Return high-quality fallback personas when API fails
    return res.json({
      personas: [
        {
          name: "Sarah Johnson - Busy Working Mom",
          businessContext: "35-year-old marketing director, married with 2 kids, homeowner for 6 years in Keller suburbs",
          painPoints: [
            "AC breaks down during hottest summer days",
            "Expensive energy bills eating into family budget",
            "Hard to find reliable contractors who show up on time",
            "Worried about being overcharged or sold unnecessary services",
            "Limited time to research and compare HVAC companies"
          ],
          behaviorPatterns: "Researches online during lunch breaks, relies on NextDoor and Google reviews, prefers text/email communication, available weekends for service calls",
          motivations: "Keep family comfortable, protect home investment, save money on energy costs, avoid emergency breakdowns",
          budget: "$300-500 monthly for maintenance, $4,000-7,000 for system replacement",
          mindset: "Skeptical of sales tactics, values transparency and guarantees, willing to pay premium for reliability",
          benefits: [
            "Guaranteed workmanship eliminates worry about comeback calls",
            "Transparent pricing means no surprise bills or hidden fees", 
            "Local expertise understands Texas heat and humidity challenges"
          ],
          elevatorPitch: "Finally, HVAC service you can trust - guaranteed workmanship, transparent pricing, and Texas heat expertise for busy families.",
          cta: "Schedule Free Home Comfort Assessment"
        },
        {
          name: "Robert Chen - New Homeowner",
          businessContext: "29-year-old software engineer, first-time homeowner, just moved to DFW area for job",
          painPoints: [
            "Inherited 12-year-old HVAC system with unknown maintenance history",
            "Doesn't know which contractors are reputable in new area",
            "Concerned about major repair costs on tight budget",
            "Limited knowledge about HVAC maintenance requirements"
          ],
          behaviorPatterns: "Heavy online researcher, checks Yelp/Google extensively, asks neighbors for recommendations, prefers detailed estimates via email",
          motivations: "Learn proper home maintenance, avoid costly surprises, build relationship with trusted service provider",
          budget: "$150-300 monthly for maintenance, $3,000-5,000 for major repairs",
          mindset: "Cautious learner, appreciates educational approach, wants to make smart long-term decisions",
          benefits: [
            "Educational approach helps first-time homeowner understand system needs",
            "Preventive maintenance plans prevent costly emergency repairs",
            "Local reputation provides confidence in service quality"
          ],
          elevatorPitch: "New to homeownership? Get expert HVAC guidance with guaranteed service - we'll teach you while we maintain your system.",
          cta: "Get New Homeowner HVAC Inspection"
        },
        {
          name: "Linda Martinez - Empty Nester",
          businessContext: "58-year-old retired teacher, owns paid-off home, grown kids moved out, fixed income",
          painPoints: [
            "HVAC system is 15+ years old and needs frequent repairs",
            "Living on fixed retirement income, can't afford big surprises",
            "Home feels too hot/cold in different rooms",
            "Worried about system failing completely"
          ],
          behaviorPatterns: "Price-conscious, gets multiple quotes, prefers phone calls, available during business hours, values personal relationships",
          motivations: "Maintain comfortable retirement lifestyle, preserve home value, avoid financial stress",
          budget: "$100-250 monthly for maintenance, prefers payment plans for major work",
          mindset: "Values experience and reputation, appreciates senior discounts, wants long-term solutions",
          benefits: [
            "Flexible payment options work with fixed retirement income",
            "Honest assessment helps plan for future replacement needs",
            "Energy efficiency improvements reduce monthly utility costs"
          ],
          elevatorPitch: "Enjoy comfortable retirement with reliable HVAC service - senior-friendly pricing and payment plans available.",
          cta: "Get Senior Citizen HVAC Assessment"
        },
        {
          name: "Michael Thompson - Property Investor",
          businessContext: "42-year-old real estate investor, owns 8 rental properties in DFW area, manages portfolio actively",
          painPoints: [
            "Multiple HVAC systems across different properties need service",
            "Tenant complaints about comfort issues affect retention",
            "Needs fast response for emergency repairs to keep tenants happy",
            "Balancing cost control with quality to maintain property values"
          ],
          behaviorPatterns: "Values efficiency and bulk service discounts, prefers online scheduling, needs quick response times, compares contractors annually",
          motivations: "Minimize vacancy costs, maintain property values, build scalable service relationships",
          budget: "$500-1,500 monthly across portfolio, $2,000-4,000 per system replacement",
          mindset: "Business-focused, values partnerships, appreciates volume pricing and priority service",
          benefits: [
            "Portfolio-wide service agreements provide consistency across properties",
            "Priority emergency response keeps tenants satisfied and reduces vacancy",
            "Volume pricing helps maintain profitability on rental income"
          ],
          elevatorPitch: "Scale your rental property success with reliable HVAC partnership - volume pricing and priority service for investors.",
          cta: "Get Property Investor Service Quote"
        },
        {
          name: "Jennifer Kim - Eco-Conscious Professional",
          businessContext: "31-year-old environmental consultant, health-conscious, owns modern energy-efficient home",
          painPoints: [
            "Current system isn't as energy-efficient as desired",
            "Concerned about indoor air quality and family health",
            "Wants to reduce carbon footprint and utility costs",
            "Difficulty finding contractors knowledgeable about green solutions"
          ],
          behaviorPatterns: "Researches energy efficiency ratings, reads environmental impact studies, active on green living forums, prefers digital communication",
          motivations: "Reduce environmental impact, improve family health, achieve energy independence goals",
          budget: "$400-800 monthly for efficiency upgrades, $6,000-12,000 for high-efficiency system",
          mindset: "Values sustainability and innovation, willing to invest in long-term solutions, appreciates technical expertise",
          benefits: [
            "High-efficiency solutions align with environmental values",
            "Improved indoor air quality supports family health goals",
            "Energy savings provide quick return on investment"
          ],
          elevatorPitch: "Go green with high-efficiency HVAC solutions - reduce your carbon footprint while saving money on energy costs.",
          cta: "Get Energy Efficiency Consultation"
        }
      ]
    });
  }
});

app.get('/', (_, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Wizard running http://localhost:${PORT}`));
