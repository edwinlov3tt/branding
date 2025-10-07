const $ = (id)=>document.getElementById(id);
const state = { brand: { name:'', url:'', description:'', colors:[], screenshot:'', logoUrl:'', logos:[], fonts:[], social:{}, techStack:{}, multiPageBrand:{} }, personas: [] };

function renderColors(){
  const row = $('colorRow'); row.innerHTML = '';
  (state.brand.colors||[]).forEach((hex, index) => {
    const colorContainer = document.createElement('div');
    colorContainer.className = 'relative group';
    
    const sw = document.createElement('div');
    sw.className = 'w-10 h-10 rounded border border-neutral-700 cursor-pointer';
    sw.style.background = hex;
    sw.title = hex;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      state.brand.colors.splice(index, 1);
      renderColors();
    };
    
    colorContainer.appendChild(sw);
    colorContainer.appendChild(removeBtn);
    row.appendChild(colorContainer);
  });
}

function renderScreenshot(){
  const section = $('screenshotSection');
  const img = $('screenshot');
  if(state.brand.screenshot){
    img.src = state.brand.screenshot;
    // Maintain 1920x1080 aspect ratio, max height 256px
    img.style.maxHeight = '256px';
    img.style.width = 'auto';
    img.style.cursor = 'pointer';
    
    // Add click to expand functionality
    img.onclick = () => {
      if(img.classList.contains('expanded')){
        img.style.maxHeight = '256px';
        img.style.width = 'auto';
        img.classList.remove('expanded');
      } else {
        img.style.maxHeight = 'none';
        img.style.width = '100%';
        img.classList.add('expanded');
      }
    };
    
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

function renderLogo(){
  const section = $('logoSection');
  const container = $('logoContainer');
  if(state.brand.logos && state.brand.logos.length){
    container.innerHTML = '';
    state.brand.logos.forEach((logo, index) => {
      const logoWrapper = document.createElement('div');
      logoWrapper.className = 'relative inline-block mr-2 mb-2 group';
      
      const img = document.createElement('img');
      img.src = logo.src;
      img.className = 'max-h-16 object-contain rounded border border-neutral-600';
      img.title = `${logo.alt || 'Logo'} (${logo.confidence}% confidence)`;
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity';
      removeBtn.innerHTML = '×';
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        state.brand.logos.splice(index, 1);
        if(state.brand.logos.length > 0){
          state.brand.logoUrl = state.brand.logos[0].src;
        } else {
          state.brand.logoUrl = null;
        }
        renderLogo();
      };
      
      logoWrapper.appendChild(img);
      logoWrapper.appendChild(removeBtn);
      container.appendChild(logoWrapper);
    });
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

function renderFonts(){
  const section = $('fontsSection');
  const list = $('fontsList');
  if(state.brand.fonts && state.brand.fonts.length){
    list.innerHTML = '';
    state.brand.fonts.forEach((font, index) => {
      const fontTag = document.createElement('span');
      fontTag.className = 'inline-flex items-center gap-1 bg-neutral-700 px-2 py-1 rounded text-xs mr-1 mb-1';
      fontTag.innerHTML = `
        ${font}
        <button onclick="removeFont(${index})" class="ml-1 text-red-400 hover:text-red-300">×</button>
      `;
      list.appendChild(fontTag);
    });
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

function removeFont(index){
  state.brand.fonts.splice(index, 1);
  renderFonts();
}

function renderSocial(){
  const section = $('socialSection');
  const links = $('socialLinks');
  const social = state.brand.social || {};
  const socialLinks = Object.entries(social).filter(([key, value]) => value);
  if(socialLinks.length){
    links.innerHTML = socialLinks.map(([platform, url]) => 
      `<div><strong>${platform}:</strong> <a href="${url}" target="_blank" class="text-brand-base hover:underline">${url}</a></div>`
    ).join('');
    section.classList.remove('hidden');
  } else {
    section.classList.add('hidden');
  }
}

$('btnAnalyze').addEventListener('click', async ()=>{
  const url = $('brandUrl').value.trim();
  if(!url) return alert('Enter a brand URL');
  $('btnAnalyze').disabled = true; $('btnAnalyze').textContent = 'Analyzing...';
  try {
    const r = await fetch('/api/brand/analyze', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) });
    const data = await r.json();
    if (data.error) throw new Error(data.error);
    state.brand.url = url;
    state.brand.name = data.name || '';
    state.brand.description = data.description || '';
    state.brand.colors = data.colors || [];
    state.brand.screenshot = data.screenshot || '';
    state.brand.logoUrl = data.logoUrl || '';
    state.brand.logos = data.logos || [];
    state.brand.fonts = data.fonts || [];
    state.brand.social = data.social || {};
    state.brand.techStack = data.techStack || {};
    state.brand.multiPageBrand = data.multiPageBrand || {};
    $('brandName').value = state.brand.name;
    $('brandDesc').value = state.brand.description;
    renderColors();
    renderScreenshot();
    renderLogo();
    renderFonts();
    renderSocial();
  } catch(e){
    alert('Analyze failed. You can still edit fields manually.');
  } finally {
    $('btnAnalyze').disabled = false; $('btnAnalyze').textContent = 'Analyze';
  }
});

$('goStep2').addEventListener('click', ()=>{
  state.brand.name = $('brandName').value.trim();
  state.brand.description = $('brandDesc').value.trim();
  $('step1').classList.add('hidden');
  $('step2').classList.remove('hidden');
  $('progress').style.width = '55%';
});

$('back1').addEventListener('click', ()=>{
  $('step2').classList.add('hidden');
  $('step1').classList.remove('hidden');
  $('progress').style.width = '20%';
});

// Personas prompt (natural language → JSON)
const PERSONA_PROMPT = (research)=>`You are an expert in marketing personas for small businesses and startups. Based on the company profile and target market information provided, create 5 distinct customer personas who would be high-priority targets for this company. For each persona, include:

- Name and role (compact, realistic)
- Primary business context (what they run or their job)
- Biggest pain points related to this company's product or service (3–5 concise items)
- Daily/weekly behavior patterns relevant to buying decisions (when they check analytics, what sites/apps they visit, preferred communication channels and typical available time windows)
- Motivations and goals (what success looks like for them)
- Budget range and resource constraints (monthly spend, technical skills, team size)
- Emotional tone / mindset and key objections to purchase (fears, hesitations)
- How this product/service helps them (3 clear benefits framed in their language)
- A short, 1-sentence elevator pitch tailored to that persona
- Suggested first-step CTA and low-effort offer that would most likely convert this persona

Return only JSON with the structure:
{"personas":[{ "name":"","businessContext":"","painPoints":[],"behaviorPatterns":"","motivations":"","budget":"","mindset":"","benefits":[],"elevatorPitch":"","cta":"" }]]}

Based on this research:
${research}
DO NOT OUTPUT ANYTHING OTHER THAN VALID JSON.`;

$('btnGenPersonas').addEventListener('click', async ()=>{
  const research = $('research').value.trim();
  if(!research){ alert('Add a bit of research/context first.'); return; }
  $('genStatus').textContent = 'Generating…';
  try {
    const prompt = PERSONA_PROMPT(research);
    const r = await fetch('/api/personas/generate', {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ prompt })
    });
    const data = await r.json();
    state.personas = data.personas || [];
    renderPersonaList();
  } catch(e){
    console.error(e);
    alert('Persona generation failed (check API key on server).');
  } finally {
    $('genStatus').textContent = '';
  }
});

function renderPersonaList(){
  const wrap = $('personaList'); wrap.innerHTML='';
  if(!state.personas.length){
    wrap.innerHTML = '<div class="text-sm text-neutral-400">No personas yet.</div>';
    return;
  }
  state.personas.forEach((p, idx)=>{
    const card = document.createElement('div');
    card.className = 'bg-neutral-900 border border-neutral-700 rounded-xl p-4';
    card.innerHTML = `
      <div class="flex justify-between mb-2">
        <div class="font-medium">${p.name || 'Persona'}</div>
        <button data-i="${idx}" class="text-xs underline text-brand-base editBtn">Edit</button>
      </div>
      <div class="text-xs whitespace-pre-wrap">${JSON.stringify(p, null, 2)}</div>
    `;
    wrap.appendChild(card);
  });
  wrap.querySelectorAll('.editBtn').forEach(btn=>btn.addEventListener('click', (e)=>{
    const i = Number(e.target.dataset.i);
    const nv = prompt('Edit persona JSON', JSON.stringify(state.personas[i], null, 2));
    if(!nv) return;
    try{ state.personas[i] = JSON.parse(nv); renderPersonaList(); }catch{ alert('Invalid JSON'); }
  }));
}

$('goStep3').addEventListener('click', ()=>{
  $('step2').classList.add('hidden');
  $('step3').classList.remove('hidden');
  $('progress').style.width = '85%';
  const payload = { brand: state.brand, personas: state.personas };
  $('review').textContent = JSON.stringify(payload, null, 2);
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  $('exportJson').href = URL.createObjectURL(blob);
});

$('back2').addEventListener('click', ()=>{
  $('step3').classList.add('hidden');
  $('step2').classList.remove('hidden');
  $('progress').style.width = '55%';
});