// Build-time asset generation: renders the brand imagery used on the Zapbuy
// landing page. Run with `node scripts/generate-images.mjs`; output lands in
// public/img and is served through the Netlify Image CDN.
import { writeFile } from 'node:fs/promises'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.NETLIFY_AI_GATEWAY_KEY,
  httpOptions: {
    baseUrl: process.env.NETLIFY_AI_GATEWAY_BASE_URL?.replace(/\/$/, ''),
  },
})

const jobs = [
  {
    file: 'public/img/hero-stack.png',
    prompt:
      'Editorial still-life photograph, abstract, for a premium financial software brand. Three matte black obsidian discs stacked with a slight offset, resting on a dark charcoal stone surface. A single razor-thin filament of electric chartreuse light, colour #D0F25A, arcs through the air and wraps around the discs like a lightning trace. One hard rim light from the upper left, deep falloff into a cool blue-black background, macro depth of field, fine film grain, 3:2 landscape. Absolutely no text, no letters, no numerals, no logos, no currency symbols, no people.',
  },
  {
    file: 'public/img/ridge.png',
    prompt:
      'Abstract dark data landscape, wide cinematic composition. A ridge of thin glowing chartreuse contour lines, colour #D0F25A, rises and falls like a mountain range across a deep blue-black void, the lines thinning and dissolving into atmospheric fog toward the horizon. Below the ridge, a very faint grid of small dots recedes in perspective. Volumetric haze, subtle chromatic depth, fine film grain, 3:1 ultra-wide letterbox. Absolutely no text, no letters, no numerals, no labels, no axes, no people.',
  },
]

for (const job of jobs) {
  process.stdout.write(`generating ${job.file}\n`)
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image',
    contents: job.prompt,
  })
  const parts = response.candidates?.[0]?.content?.parts ?? []
  const image = parts.find((part) => part.inlineData)
  if (!image) {
    process.stdout.write(`FAILED ${job.file}: no image part returned\n`)
    continue
  }
  await writeFile(job.file, Buffer.from(image.inlineData.data, 'base64'))
  process.stdout.write(`wrote ${job.file}\n`)
}
