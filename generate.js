export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'No answers provided' });

    const userInput = buildUserMessage(answers);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userInput }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: 'AI generation failed' });
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse the JSON from Claude's response
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
      result = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('JSON parse error:', parseErr);
      return res.status(500).json({ error: 'Failed to parse AI response' });
    }

    return res.status(200).json({ result });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function buildUserMessage(a) {
  return `Here are the raw answers from a founder building their brand foundation. Transform these into a polished, strategic brand foundation document.

## RAW ANSWERS

### MISSION
- What we do: ${a.mission_what || '[not provided]'}
- Who we serve: ${a.mission_who || '[not provided]'}
- Why it matters: ${a.mission_why || '[not provided]'}
- Their draft mission: ${a.mission_statement || '[not provided]'}

### VISION
- Future state: ${a.vision_future || '[not provided]'}
- Our role: ${a.vision_role || '[not provided]'}
- Their draft vision: ${a.vision_statement || '[not provided]'}

### VALUES
- Core values: ${a.values_chips || '[not provided]'}
- Values in practice: ${a.values_practice || '[not provided]'}

### BRAND VOICE
- Voice spectrums: Formal/Casual: ${a.voice_formal || '50'}, Serious/Playful: ${a.voice_serious || '50'}, Reserved/Bold: ${a.voice_reserved || '50'}, Technical/Accessible: ${a.voice_technical || '50'}, Aspirational/Grounded: ${a.voice_aspirational || '50'}
- Personality words: ${a.voice_words || '[not provided]'}
- Sounds like: ${a.voice_sounds_like || '[not provided]'}
- Never sounds like: ${a.voice_never_sounds || '[not provided]'}

### MESSAGING
- Brand promise: ${a.msg_promise || '[not provided]'}
- Elevator pitch: ${a.msg_elevator || '[not provided]'}
- Pillar 1: ${a.pillar1_title || ''} - ${a.pillar1_desc || '[not provided]'}
- Pillar 2: ${a.pillar2_title || ''} - ${a.pillar2_desc || '[not provided]'}
- Pillar 3: ${a.pillar3_title || ''} - ${a.pillar3_desc || '[not provided]'}

### TARGET AUDIENCE
- Primary audience: ${a.audience_primary || '[not provided]'}
- Pain points: ${a.audience_pain || '[not provided]'}
- Success looks like: ${a.audience_success || '[not provided]'}
- Secondary audience: ${a.audience_secondary || '[not provided]'}

### BRAND STORY
- Origin: ${a.story_origin || '[not provided]'}
- Credibility: ${a.story_credibility || '[not provided]'}
- Emotional core: ${a.story_emotion || '[not provided]'}

### VISUAL DIRECTION
- References: ${a.visual_references || '[not provided]'}
- Description: ${a.visual_description || '[not provided]'}
- Never: ${a.visual_never || '[not provided]'}

### POSITIONING
- Competitors: ${a.position_competitors || '[not provided]'}
- Advantage: ${a.position_advantage || '[not provided]'}
- Their draft positioning: ${a.position_statement || '[not provided]'}

Return ONLY valid JSON.`;
}

const SYSTEM_PROMPT = `You are a senior brand strategist with 15+ years of experience working with premium brands. You are reviewing a founder's raw, unpolished answers from a brand foundation worksheet. Your job is to transform their rough inputs into a strategic, polished brand foundation document that reads like it was created by a $5,000 brand consultancy.

## YOUR APPROACH

1. **Elevate, don't invent.** Keep the founder's authentic voice and intent, but sharpen the language, tighten the structure, and make every word earn its place. If they said something clunky but true, make it elegant. Never add claims or ideas they didn't express.

2. **Connect the dots.** A great brand foundation is cohesive. The values should echo in the voice. The mission should flow into the vision. The positioning should reference the audience's pain points. Make these connections explicit.

3. **Be specific.** Replace every generic phrase with something only THIS brand could say. "We help businesses grow" becomes the specific way they help specific businesses achieve specific outcomes.

4. **Flag gaps gently.** If a section is too vague or missing critical specificity, improve what's there but add a brief strategist note suggesting what to refine further.

## OUTPUT FORMAT

Return ONLY valid JSON with this exact structure (no markdown, no code blocks, just the JSON):

{
  "brand_name": "Their brand/company name if discernible from the answers, otherwise 'Your Brand'",
  "mission": {
    "statement": "The polished mission statement (1-3 sentences)",
    "note": "Optional strategist note if something could be sharper, or null"
  },
  "vision": {
    "statement": "The polished vision statement (1-2 sentences)",
    "note": "Optional strategist note or null"
  },
  "values": {
    "list": [
      { "name": "Value Name", "description": "One line showing what this looks like in practice" }
    ],
    "note": "Optional strategist note or null"
  },
  "voice": {
    "personality": "Three polished personality descriptors",
    "spectrums": {
      "formal_casual": 65,
      "serious_playful": 40,
      "reserved_bold": 70,
      "technical_accessible": 80,
      "aspirational_grounded": 55
    },
    "sounds_like": "Polished 'we sound like' description",
    "never_sounds_like": "Polished 'we never sound like' description",
    "note": "Optional strategist note or null"
  },
  "messaging": {
    "promise": "The polished brand promise / tagline",
    "elevator_pitch": "The polished 30-second elevator pitch",
    "pillars": [
      { "name": "Pillar Name", "message": "The supporting message for this pillar" }
    ],
    "note": "Optional strategist note or null"
  },
  "audience": {
    "primary": "Vivid, psychographic primary audience description",
    "pain_points": "Their key frustrations and fears",
    "success": "What success looks like for them",
    "secondary": "Secondary audience or null",
    "note": "Optional strategist note or null"
  },
  "story": {
    "origin": "The polished origin story (2-4 sentences, narrative arc)",
    "credibility": "Why they're the right people for this",
    "emotion": "The core emotional takeaway",
    "note": "Optional strategist note or null"
  },
  "visual": {
    "references": "Polished reference description",
    "description": "The aesthetic direction in clear, evocative language",
    "never": "Visual identity boundaries",
    "note": "Optional strategist note or null"
  },
  "positioning": {
    "statement": "The polished positioning statement",
    "competitors": "Brief competitive landscape summary",
    "advantage": "The key differentiator, sharpened",
    "note": "Optional strategist note or null"
  }
}

Use the spectrum values provided (0-100 scale) but adjust them if the founder's written descriptions contradict their slider positions.

Remember: the founder should read this and think "yes, that's exactly what I meant, but said better than I ever could." That's the goal.`;
