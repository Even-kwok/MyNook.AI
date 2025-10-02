import { PromptTemplate, PromptTemplateCategory, AdvisorPersona } from './types';

// App Configuration
export const APP_NAME = 'MyNook';
export const APP_DESCRIPTION = 'AI-Powered Interior Design';
export const APP_URL = 'https://my-nook.ai';
export const COMPANY_NAME = 'MyNook';
export const SUPPORT_EMAIL = 'support@my-nook.ai';

export const ROOM_TYPES = [
  { id: 'living-room', name: 'Living Room' },
  { id: 'dining-room', name: 'Dining Room' },
  { id: 'bedroom', name: 'Bedroom' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bathroom', name: 'Bathroom' },
  { id: 'home-office', name: 'Home Office' },
  { id: 'nursery', name: 'Nursery' },
  { id: 'kids-room', name: 'Kids Room' },
  { id: 'yoga-studio', name: 'Yoga Studio' },
  { id: 'garden', name: 'Garden' },
  { id: 'library', name: 'Library' },
  { id: 'theater', name: 'Theater' },
  { id: 'studio', name: 'Studio' },
  { id: 'game-room', name: 'Game Room' },
  { id: 'wine-cellar', name: 'Wine Cellar' },
  { id: 'music-room', name: 'Music Room' },
  { id: 'fitness-room', name: 'Fitness Room' },
  { id: 'pantry', name: 'Pantry' },
  { id: 'laundry-room', name: 'Laundry Room' },
  { id: 'mudroom', name: 'Mudroom' },
  { id: 'balcony', name: 'Balcony' },
  { id: 'attic', name: 'Attic' },
  { id: 'basement', name: 'Basement' },
  { id: 'closet', name: 'Closet' },
];

export const BUILDING_TYPES = [
  { id: 'modern-house', name: 'Modern House' },
  { id: 'victorian-house', name: 'Victorian House' },
  { id: 'apartment-building', name: 'Apartment Building' },
  { id: 'office-building', name: 'Office Building' },
  { id: 'skyscraper', name: 'Skyscraper' },
  { id: 'retail-storefront', name: 'Retail Storefront' },
  { id: 'cafe-restaurant', name: 'Cafe / Restaurant' },
  { id: 'beach-house', name: 'Beach House' },
  { id: 'suburban-home', name: 'Suburban Home' },
  { id: 'mountain-cabin', name: 'Mountain Cabin' },
];

export const ITEM_TYPES = [
  { id: 'sofa', name: 'Sofa' },
  { id: 'armchair', name: 'Armchair' },
  { id: 'coffee-table', name: 'Coffee Table' },
  { id: 'side-table', name: 'Side Table' },
  { id: 'dining-table', name: 'Dining Table' },
  { id: 'chair', name: 'Chair' },
  { id: 'bed', name: 'Bed' },
  { id: 'dresser', name: 'Dresser' },
  { id: 'nightstand', name: 'Nightstand' },
  { id: 'bookshelf', name: 'Bookshelf' },
  { id: 'tv-stand', name: 'TV Stand' },
  { id: 'desk', name: 'Desk' },
  { id: 'office-chair', name: 'Office Chair' },
  { id: 'lamp', name: 'Lamp' },
  { id: 'rug', name: 'Rug' },
  { id: 'painting', name: 'Painting / Wall Art' },
  { id: 'plant', name: 'Plant' },
  { id: 'mirror', name: 'Mirror' },
  { id: 'vase', name: 'Vase' },
  { id: 'curtains', name: 'Curtains' },
  { id: 'cabinet', name: 'Cabinet' },
  { id: 'shelves', name: 'Shelves' },
  { id: 'stool', name: 'Stool' },
  { id: 'ottoman', name: 'Ottoman' },
];

export const ADVISOR_PERSONAS: Record<string, AdvisorPersona> = {
  david: {
    id: 'advisor-david',
    name: 'David',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/advisor-david.png',
    description: `Specializes in minimalist, Japandi, and Scandinavian design. Believes 'less is more'.`,
    systemInstruction: `You are David, a world-renowned interior designer specializing in minimalist, Japandi, and Scandinavian design. Your philosophy is 'less is more'. You provide advice that is calm, thoughtful, and focuses on clean lines, natural materials, and creating a sense of serenity. Your answers should be concise, actionable, and elegant.`,
  },
  chloe: {
    id: 'advisor-chloe',
    name: 'Chloe',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/advisor-chloe.png',
    description: `Known for bold, eclectic, and maximalist styles. Believes a home should tell a story.`,
    systemInstruction: `You are Chloe, a vibrant interior designer and color consultant known for your bold, eclectic, and maximalist styles. You believe a home should tell a story and be filled with personality. Your advice is enthusiastic, creative, and encourages mixing patterns, textures, and colors. You provide practical tips on how to make a bold statement without creating chaos.`,
  },
  liam: {
    id: 'advisor-liam',
    name: 'Liam',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/advisor-liam.png',
    description: `Focuses on sustainable, eco-friendly, and biophilic design, connecting spaces with nature.`,
    systemInstruction: `You are Liam, an architect and designer focused on sustainable, eco-friendly, and biophilic design. You advocate for connecting spaces with nature. Your advice is practical, informative, and grounded in principles of sustainability. You recommend non-toxic materials, energy-efficient solutions, and ways to incorporate natural light and plants into the home.`,
  },
   amelia: {
    id: 'advisor-amelia',
    name: 'Amelia',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/advisor-amelia.png',
    description: `Blends classic, traditional, and modern farmhouse aesthetics for a warm, inviting atmosphere.`,
    systemInstruction: `You are Amelia, a designer who masterfully blends classic, traditional, and modern farmhouse aesthetics. You value comfort, timelessness, and creating a warm, inviting atmosphere. Your advice is friendly, detailed, and provides guidance on creating cozy, family-friendly spaces that feel both elegant and lived-in.`,
  },
};

export const ALL_ADVISORS: AdvisorPersona[] = Object.values(ADVISOR_PERSONAS);


// Master list of all available style templates
const ALL_TEMPLATES: Record<string, PromptTemplate> = {
  modernMinimalist: {
    id: 'design-1',
    name: 'Modern Minimalist',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-modern-minimalist.png',
    prompt: `Crucial Command: This is a TOTAL renovation project. The user's photo is for layout and structural reference ONLY. ALL visible surfaces (walls, floors, ceilings) and elements (windows, doors) are considered 'raw space' and MUST BE COMPLETELY REPLACED with new, fully finished materials according to the style specified below. No original textures, dirt, or unfinished elements from the input image should remain in the final output.
Strictly retain the spatial structure, window and door positions, and ceiling height from the user's input image. The final output must be a professional interior photograph, photorealistic, with a calm, refined, and serene quality, as if featured in "Ark Journal" or a high-end minimalist design publication. The aesthetic must feel impeccably clean, sophisticated, and a masterclass in elegant simplicity. Within this framework, transform the space into a high-end, Warm Minimalist interior that is directly inspired by the provided target style image.
Architectural Finishes: Render the existing walls as flawless, smooth, matte, pure white plaster. The flooring MUST BE REPLACED with rich, medium-to-dark oak or walnut wood planks with a natural finish.
Window & Door Replacement: Replace a key door with a solid, traditional-style multi-panel door in a dark wood finish that matches the floor, with simple, elegant hardware.
Furniture & Decor: Introduce a modern, low-profile sofa defined by a thin, black metal exoskeleton frame holding plush, comfortable cushions in a warm-gray textured fabric. The coffee table should be a thick, low, block-style piece in a matching dark wood. Place a soft, high-pile, cream-colored wool area rug to define the seating area. Decor must be extremely minimal: a single, tall, dark floor vase with dried willow or pussy willow branches.
Lighting & Atmosphere: The lighting should be soft, natural, and indirect, as if from a large, off-camera window. The atmosphere is serene, pure, and creates a sense of calm sophistication through its high-contrast palette and minimalist arrangement.`,
  },
  scandinavian: {
    id: 'design-2',
    name: 'Scandinavian',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-scandinavian.png',
    prompt: 'Scandinavian interior design, hygge, light wood floors, white walls, cozy textiles like wool and linen, functional and simple furniture, pops of muted color, abundance of natural light, house plants.',
  },
  bohemian: {
    id: 'design-3',
    name: 'Bohemian',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-bohemian.png',
    prompt: 'Bohemian eclectic interior design, layered textures, mix of patterns, vintage furniture, Moroccan rugs, macrame wall hangings, an abundance of plants, warm and earthy color palette, relaxed and carefree atmosphere.',
  },
  industrialLoft: {
    id: 'design-4',
    name: 'Industrial Loft',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-industrial-loft.png',
    prompt: 'Industrial loft interior design, exposed brick walls, visible pipes and ductwork, high ceilings, large open spaces, concrete floors, metal accents, vintage and reclaimed furniture, neutral color scheme.',
  },
  coastal: {
    id: 'design-5',
    name: 'Coastal',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-coastal.png',
    prompt: 'Coastal beach house interior design, light and airy, white and blue color palette, natural materials like rattan and weathered wood, comfortable and casual furniture, nautical decor, large windows.',
  },
  japandi: {
    id: 'design-6',
    name: 'Japandi',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-japandi.png',
    prompt: 'Japandi style interior, fusion of Japanese and Scandinavian design, minimalist, functional, natural materials like light wood and bamboo, neutral color palette, focus on craftsmanship and clean lines.',
  },
  artDeco: {
    id: 'design-7',
    name: 'Art Deco',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-art-deco.png',
    prompt: 'Art Deco interior design, glamorous, bold geometric patterns, rich colors like deep blues and emerald greens, metallic accents (gold, brass), luxurious materials like velvet and marble, symmetrical layouts.',
  },
  midCenturyModern: {
    id: 'design-8',
    name: 'Mid-Century Modern',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-mid-century-modern.png',
    prompt: 'Mid-Century Modern interior, organic shapes, clean lines, iconic furniture pieces (like Eames chairs), wood tones (teak, walnut), pops of color (mustard yellow, orange), connection to nature.',
  },
  farmhouse: {
    id: 'design-9',
    name: 'Farmhouse',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-farmhouse.png',
    prompt: 'Farmhouse style interior, rustic wood elements, neutral color palette, shiplap walls, apron-front sink, cozy and inviting atmosphere, vintage-inspired furniture and decor.',
  },
  tropical: {
    id: 'design-10',
    name: 'Tropical',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-tropical.png',
    prompt: 'Tropical interior design, lush greenery, natural materials like rattan and bamboo, vibrant colors inspired by nature, large windows, light fabrics, and a relaxed, vacation-like feel.',
  },
  spaLike: {
    id: 'design-11',
    name: 'Spa-like',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-spa-like.png',
    prompt: 'Spa-like bathroom design, serene and calming atmosphere, natural materials like stone and wood, minimalist fixtures, large soaking tub, rainfall shower, soft lighting, and an emphasis on relaxation.',
  },
  professional: {
    id: 'design-12',
    name: 'Professional',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/interior-professional.png',
    prompt: 'Professional office design, clean and organized, ergonomic furniture, neutral color scheme with corporate accents, ample lighting, minimalist decor, and a focus on productivity and focus.',
  },
  englishGarden: {
    id: 'garden-english',
    name: 'English Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/garden-english.png',
    prompt: `Transform the provided outdoor space into a classic English garden. The design should feel romantic, lush, and slightly informal. Key elements to include are: overflowing flowerbeds with a mix of perennials like roses, lavender, and delphiniums; winding gravel or stone pathways; a weathered wooden bench; and climbing plants like ivy or wisteria on any available structures. The overall atmosphere should be charming and picturesque.`,
  },
  zenGarden: {
    id: 'garden-zen',
    name: 'Japanese Zen Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/garden-zen.png',
    prompt: `Convert the outdoor area into a serene Japanese Zen garden (Karesansui). The design must be minimalist and encourage meditation. Major features should include: a large area of raked white or light gray gravel representing water; a few carefully placed, large, moss-covered stones or boulders representing islands; minimal, meticulously pruned plants such as a Japanese maple or a small bonsai tree. Avoid clutter and bright colors. The space should feel tranquil, balanced, and deeply peaceful.`,
  },
  mediterraneanGarden: {
    id: 'garden-mediterranean',
    name: 'Mediterranean Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/garden-mediterranean.png',
    prompt: `Redesign the space into a sun-drenched Mediterranean garden. The style should be rustic, charming, and drought-tolerant. Incorporate key features like: gravel or terracotta tile pathways; large terracotta pots with vibrant flowers like bougainvillea or geraniums; aromatic herbs like rosemary and lavender planted in beds; and perhaps an olive or citrus tree as a focal point. A simple wooden pergola or a stucco wall could be added for structure. The mood should be warm, inviting, and reminiscent of a coastal villa.`,
  },
  modernGarden: {
    id: 'garden-modern',
    name: 'Modern & Minimalist Garden',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/garden-modern.png',
    prompt: `Reimagine the outdoor area as a modern, minimalist garden with a strong architectural feel. The design must emphasize clean lines, geometric shapes, and a restrained color palette. Use materials like smooth concrete for patios or walkways, dark wood for decking or fencing, and Cor-ten steel for planters. Planting should be simple and structural, focusing on ornamental grasses, succulents, or clipped boxwood hedges. A simple water feature or a fire pit could serve as a focal point. The overall look should be sophisticated, uncluttered, and highly designed.`,
  },
  exteriorModern: {
    id: 'exterior-modern',
    name: 'Modern Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-modern.png',
    prompt: 'Modern architectural exterior design, clean lines, large glass windows, flat or low-pitched roof, minimalist landscaping, materials like concrete, steel, and wood paneling.'
  },
  exteriorContemporary: {
    id: 'exterior-contemporary',
    name: 'Contemporary Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-contemporary.png',
    prompt: 'Contemporary architectural exterior, sustainable materials, asymmetric design, natural light focus, mixed materials like stone and metal, green roof elements, dynamic shapes.'
  },
  exteriorClassical: {
    id: 'exterior-classical',
    name: 'Classical Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-classical.png',
    prompt: 'Classical architectural exterior, inspired by Greek and Roman design, symmetry, columns, pediments, arches, made of stone or marble, grand and formal appearance.'
  },
  exteriorRustic: {
    id: 'exterior-rustic',
    name: 'Rustic Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-rustic.png',
    prompt: 'Rustic architectural exterior, natural and weathered materials like logs, stone, and reclaimed wood, gabled roofs, large porches, cozy and integrated with nature.'
  },
  exteriorFuturistic: {
    id: 'exterior-futuristic',
    name: 'Futuristic Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-futuristic.png',
    prompt: 'Futuristic architectural exterior, aerodynamic and organic shapes, smart glass, integrated renewable energy sources, metallic or composite materials, glowing light accents, sleek and innovative.'
  },
  exteriorVictorian: {
    id: 'exterior-victorian',
    name: 'Victorian Exterior',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/exterior-victorian.png',
    prompt: 'Victorian architectural exterior, ornate and decorative trim, steep gabled roofs, bay windows, towers or turrets, vibrant color schemes, intricate details.'
  },
  festiveHalloweenSpooky: {
    id: 'festive-halloween-spooky',
    name: 'Spooky Manor',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-halloween-spooky.png',
    prompt: 'Transform the room into a spooky, haunted manor for Halloween. Incorporate cobwebs, dim candlelight, gothic furniture, antique portraits with glowing eyes, and a few tasteful ghostly apparitions. The color palette should be dark with touches of orange and deep purple.'
  },
  festiveHalloweenPumpkin: {
    id: 'festive-halloween-pumpkin',
    name: 'Pumpkin Patch Fun',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-halloween-pumpkin.png',
    prompt: 'Redecorate the room with a fun and festive "pumpkin patch" Halloween theme. Use lots of carved jack-o\'-lanterns, autumn leaves, plaid blankets, and friendly scarecrow figures. The atmosphere should be cozy and cheerful, not scary.'
  },
  festiveHalloweenWitch: {
    id: 'festive-halloween-witch',
    name: 'Witch\'s Cottage',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-halloween-witch.png',
    prompt: 'Design the room as a mysterious witch\'s cottage for Halloween. Include shelves with potion bottles, a bubbling cauldron, scattered spellbooks, hanging dried herbs, and lots of candles. The lighting should be mystical, with green and purple hues.'
  },
  festiveChristmasClassic: {
    id: 'festive-christmas-classic',
    name: 'Classic Christmas',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-christmas-classic.png',
    prompt: 'Decorate the room in a classic Christmas style. Include a large, beautifully decorated Christmas tree with red and gold ornaments, garlands of pine and holly on the mantelpiece, stockings hung by the fireplace, and warm, twinkling fairy lights throughout. The mood should be warm, traditional, and nostalgic.'
  },
  festiveChristmasWonderland: {
    id: 'festive-christmas-wonderland',
    name: 'Winter Wonderland',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-christmas-wonderland.png',
    prompt: 'Transform the room into a magical Winter Wonderland for Christmas. Use a flocked or white Christmas tree, silver and blue decorations, faux snow on surfaces, shimmering icicle lights, and elegant white and silver accents. The atmosphere should be frosty, enchanting, and serene.'
  },
  festiveChristmasFarmhouse: {
    id: 'festive-christmas-farmhouse',
    name: 'Cozy Farmhouse Christmas',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/festive-christmas-farmhouse.png',
    prompt: 'Create a cozy, rustic Farmhouse Christmas decor. Use a natural pine tree decorated with handmade ornaments, buffalo check patterns, burlap ribbons, and warm string lights. Add cozy knit blankets and rustic wooden signs with festive sayings. The feeling should be homey, comfortable, and simple.'
  },
};

const ALL_WALL_PAINTS: Record<string, PromptTemplate> = {
  matteWhite: {
    id: 'paint-matte-white',
    name: 'Matte White',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-matte-white.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to repaint the primary walls of the room in the provided image to a flawless, smooth, matte white finish. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in wall color.`,
  },
  warmBeige: {
    id: 'paint-warm-beige',
    name: 'Warm Beige',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-warm-beige.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to repaint the primary walls of the room in the provided image to a warm, inviting beige color with a smooth eggshell finish. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in wall color.`,
  },
  sageGreen: {
    id: 'paint-sage-green',
    name: 'Sage Green',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-sage-green.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to repaint the primary walls of the room in the provided image to a calming, muted sage green color with a matte finish. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in wall color.`,
  },
  navyBlue: {
    id: 'paint-navy-blue',
    name: 'Navy Blue Accent',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-navy-blue.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to repaint a single, primary accent wall in the provided image to a deep, rich navy blue with a matte finish. All other walls should remain as they are or be a complementary neutral off-white. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in wall color.`,
  },
  terracotta: {
    id: 'paint-terracotta',
    name: 'Earthy Terracotta',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-terracotta.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to repaint the primary walls of the room in the provided image to a warm, earthy terracotta color with a subtle textured finish. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in wall color and texture.`,
  },
  limewash: {
    id: 'paint-limewash',
    name: 'Limewash Effect',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-limewash.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to apply a textured limewash finish to the primary walls of the room in the provided image. The color should be a light, neutral off-white or beige, with characteristic soft, cloudy brush strokes. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the new wall texture.`,
  },
  venetianPlaster: {
    id: 'paint-venetian-plaster',
    name: 'Venetian Plaster',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-venetian-plaster.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to apply a polished Venetian plaster finish to the primary walls of the room in the provided image. The color should be a light gray or cream, with a smooth, marble-like appearance and subtle depth. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the new wall texture.`,
  },
  concrete: {
    id: 'paint-concrete',
    name: 'Concrete Effect',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/paint-concrete.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to apply a modern, industrial concrete effect finish to the primary walls of the room in the provided image. The texture should resemble smooth, cast concrete with slight variations in tone. You MUST NOT change the furniture, lighting, floor, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the new wall texture.`,
  },
};

export const WALL_PAINT_CATEGORIES: PromptTemplateCategory[] = [
  {
    name: "Wall Finishes",
    templates: Object.values(ALL_WALL_PAINTS),
  }
];

const ALL_FLOOR_STYLES: Record<string, PromptTemplate> = {
  lightOak: {
    id: 'floor-light-oak',
    name: 'Light Oak Wood',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-light-oak.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with light oak wood planks with a natural matte finish. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  darkWalnut: {
    id: 'floor-dark-walnut',
    name: 'Dark Walnut Wood',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-dark-walnut.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with dark walnut wood planks with a satin finish. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  herringbone: {
    id: 'floor-herringbone',
    name: 'Herringbone Parquet',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-herringbone.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with a classic herringbone parquet pattern using medium-toned wood. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  polishedConcrete: {
    id: 'floor-polished-concrete',
    name: 'Polished Concrete',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-polished-concrete.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with a smooth, polished concrete floor with a slight sheen. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  marbleTile: {
    id: 'floor-marble-tile',
    name: 'Marble Tile',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-marble-tile.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with large-format white Carrara marble tiles with subtle grey veining and a polished finish. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  checkerboard: {
    id: 'floor-checkerboard',
    name: 'Checkerboard Tile',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-checkerboard.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with a classic black and white checkerboard tile pattern. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  slateStone: {
    id: 'floor-slate-stone',
    name: 'Slate Stone',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-slate-stone.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with natural dark slate stone tiles with a textured, matte finish. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
  terracottaTiles: {
    id: 'floor-terracotta-tiles',
    name: 'Terracotta Tiles',
    imageUrl: 'https://storage.googleapis.com/aistudio-hosting/templates/floor-terracotta-tiles.png',
    prompt: `CRITICAL COMMAND: Your ONLY task is to replace the floor of the room in the provided image with rustic, square terracotta tiles in warm, earthy tones. You MUST NOT change the furniture, lighting, walls, ceiling, windows, doors, or any decor objects. The original spatial structure and all room contents must be perfectly preserved. The result should be a photorealistic image showing ONLY the change in flooring.`,
  },
};

export const FLOOR_STYLE_CATEGORIES: PromptTemplateCategory[] = [
  {
    name: "Floor Styles",
    templates: Object.values(ALL_FLOOR_STYLES),
  }
];

export const EXTERIOR_STYLES: PromptTemplateCategory[] = [
    {
        name: "Architectural Styles",
        templates: [
            ALL_TEMPLATES.exteriorModern,
            ALL_TEMPLATES.exteriorContemporary,
            ALL_TEMPLATES.exteriorClassical,
            ALL_TEMPLATES.exteriorRustic,
            ALL_TEMPLATES.exteriorFuturistic,
            ALL_TEMPLATES.exteriorVictorian,
        ],
    },
];

export const FESTIVE_DECOR_STYLES: PromptTemplateCategory[] = [
    {
        name: "Halloween Decor",
        templates: [
            ALL_TEMPLATES.festiveHalloweenSpooky,
            ALL_TEMPLATES.festiveHalloweenPumpkin,
            ALL_TEMPLATES.festiveHalloweenWitch,
        ],
    },
    {
        name: "Christmas Decor",
        templates: [
            ALL_TEMPLATES.festiveChristmasClassic,
            ALL_TEMPLATES.festiveChristmasWonderland,
            ALL_TEMPLATES.festiveChristmasFarmhouse,
        ],
    },
];


// Create categories with specific templates for each room type
const livingRoomStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.modernMinimalist,
      ALL_TEMPLATES.scandinavian,
      ALL_TEMPLATES.bohemian,
      ALL_TEMPLATES.industrialLoft,
      ALL_TEMPLATES.coastal,
      ALL_TEMPLATES.japandi,
      ALL_TEMPLATES.artDeco,
      ALL_TEMPLATES.midCenturyModern,
      ALL_TEMPLATES.tropical,
    ],
  },
];

const bedroomStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.scandinavian,
      ALL_TEMPLATES.bohemian,
      ALL_TEMPLATES.coastal,
      ALL_TEMPLATES.japandi,
      ALL_TEMPLATES.modernMinimalist,
      ALL_TEMPLATES.tropical,
    ],
  },
];

const bathroomStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.spaLike,
      ALL_TEMPLATES.modernMinimalist,
      ALL_TEMPLATES.coastal,
      ALL_TEMPLATES.japandi,
    ],
  },
];

const kitchenStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.farmhouse,
      ALL_TEMPLATES.modernMinimalist,
      ALL_TEMPLATES.scandinavian,
      ALL_TEMPLATES.industrialLoft,
      ALL_TEMPLATES.midCenturyModern,
    ],
  },
];

const diningRoomStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.midCenturyModern,
      ALL_TEMPLATES.artDeco,
      ALL_TEMPLATES.farmhouse,
      ALL_TEMPLATES.scandinavian,
      ALL_TEMPLATES.industrialLoft,
    ],
  },
];

const officeStyles: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: [
      ALL_TEMPLATES.professional,
      ALL_TEMPLATES.modernMinimalist,
      ALL_TEMPLATES.industrialLoft,
      ALL_TEMPLATES.midCenturyModern,
    ],
  },
];

const gardenStyles: PromptTemplateCategory[] = [
    {
      name: "Garden Styles",
      templates: [
        ALL_TEMPLATES.englishGarden,
        ALL_TEMPLATES.zenGarden,
        ALL_TEMPLATES.mediterraneanGarden,
        ALL_TEMPLATES.modernGarden,
        ALL_TEMPLATES.tropical,
      ],
    },
];

const yogaStudioStyles: PromptTemplateCategory[] = [
    {
        name: "Design Aesthetics",
        templates: [
            ALL_TEMPLATES.japandi,
            ALL_TEMPLATES.scandinavian,
            ALL_TEMPLATES.modernMinimalist,
            ALL_TEMPLATES.coastal,
            ALL_TEMPLATES.tropical,
        ],
    },
];


// This is the main export used by the app to dynamically display styles.
export const STYLES_BY_ROOM_TYPE: Record<string, PromptTemplateCategory[]> = {
  'living-room': livingRoomStyles,
  'bedroom': bedroomStyles,
  'bathroom': bathroomStyles,
  'kitchen': kitchenStyles,
  'dining-room': diningRoomStyles,
  'home-office': officeStyles,
  'nursery': bedroomStyles,
  'kids-room': bedroomStyles,
  'yoga-studio': yogaStudioStyles,
  'garden': gardenStyles,
  'library': officeStyles,
  'theater': livingRoomStyles,
  'studio': livingRoomStyles,
  'game-room': livingRoomStyles,
  'wine-cellar': diningRoomStyles,
  'music-room': livingRoomStyles,
  'fitness-room': livingRoomStyles,
  'pantry': kitchenStyles,
  'laundry-room': bathroomStyles,
  'mudroom': kitchenStyles,
  'balcony': livingRoomStyles,
  'attic': bedroomStyles,
  'basement': livingRoomStyles,
  'closet': bedroomStyles,
};

// Renamed from TEMPLATE_CATEGORIES to represent the master list of all available styles.
// This is used for the Explore page gallery.
export const ALL_TEMPLATE_CATEGORIES: PromptTemplateCategory[] = [
  {
    name: "Design Aesthetics",
    templates: Object.values(ALL_TEMPLATES),
  }
];