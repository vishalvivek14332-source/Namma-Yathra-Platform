# YatraAI — Product Showcase & Demo Video Script
### Editorial Travel & Circuit Intelligence for Karnataka

---

## Part 1: Presentation Slide Deck Outline (PPT / PPTX)

### Slide 1: Title & Hook
- **Title:** YatraAI — AI-Powered Karnataka Travel Planner
- **Subtitle:** Personalized, Geographically Grounded Itineraries Rooted in Living Heritage
- **Presented by:** Team YatraAI
- **Visual:** Split screen showing the stone chariot at Hampi and the YatraAI interactive interface.

### Slide 2: Problem Statement & Context
- **Karnataka's Tourism Breadth:** 320km of coastline, 25,000+ protected monuments, dense Western Ghats rainforests, 31 districts.
- **The Traveller's Dilemma:** Planning a trip across regions requires cross-referencing multiple disparate websites, outdated road transit estimates, and fragmented ticket prices.
- **Why Existing LLMs Fail:**
  - Hallucinate fake places or non-existent roads.
  - Schedule physically impossible daily transits (e.g., Gokarna to Hampi for lunch).
  - Fabricate live hotel and ticket costs.
  - Require starting from scratch if one stop is modified.

### Slide 3: The YatraAI Solution & Core Differentiation
- **1. Curated Geographic Knowledge Base:** 32 verified Karnataka destinations with accurate ASI/KSTDC coordinates, official visit durations, and real planning constraints.
- **2. Single-Day Regeneration:** Granular control—refresh Day 2 without wiping out the rest of your trip.
- **3. Deterministic Financial Calculator:** Real arithmetic separates AI creative scheduling from money calculations, guaranteeing zero math errors.
- **4. Native OpenStreetMap Integration:** Visual mapping without expensive vendor lock-in.
- **5. Live Weather & Regional Climate Intelligence:** Destination-level temperature forecasts, WMO weather conditions, and region-tailored packing advisories (e.g. rain gear for Western Ghats, sun gear for Deccan plains).
- **6. Multi-Origin Support:** Trips can start from Hubballi, Mangaluru, Belagavi, or Kalaburagi—not just Bengaluru.

### Slide 4: System Architecture & Technical Flow
- **Frontend Layer:** React 19, TypeScript, Tailwind CSS, Leaflet for OpenStreetMap.
- **Server-Side API Proxy:** Node.js Express server housing the `@google/genai` SDK with Gemini 3.8 Flash.
- **Zero API Key Exposure:** Private keys stay exclusively in backend environment variables.
- **Resilient Fallback Engine:** If upstream AI experiences temporary rate limits, the verified Karnataka knowledge engine synthesizes the route seamlessly.

### Slide 5: Features Demonstration Walkthrough
- Trip Requirement Intake (Budget, Group Size, Pace, Diet, Starting City).
- Day-by-Day Visual Timeline with stops, arrival times, Kannada names, and live weather forecast cards.
- Destination Climate & Seasonal Packing Advisories per stop.
- Map Marker Interaction (Clicking stops highlights pins and zooms).
- Live Budget Recalculator (Per-person breakdown, room formulas, overrun alerts).
- Export & Print Document (Printable PDF styling, Markdown download, local persistence).

### Slide 6: Social & Economic Impact for Karnataka
- Promotes Tier-2 and Tier-3 heritage sites (Aihole, Pattadakal, Somanathapura) alongside major hubs.
- Highlights local culinary traditions (Kodava dishes, Karavali seafood, Dharwad peda, Udupi meals).
- Promotes responsible tourism with verified plastic-free zones and temple dress-code alerts.

### Slide 7: Conclusion & Future Roadmap
- Integration with KSRTC bus and South Western Railway real-time APIs.
- Multi-lingual UI support in Kannada and English.
- Real-time weather and seasonal festival recommendations (Mysuru Dasara, Hampi Utsav).
- **GitHub Repository & Live Demo:** Open-source and live on Google Cloud Run.

---

## Part 2: 3–5 Minute Screen Recording Script (Voice-Over)

**Format:** Screencast with voice-over (No face required).
**Total Duration:** ~3 minutes 45 seconds.

```
[0:00 - 0:30] SCENE 1: Introduction & Problem Context
Visual: Browser open on YatraAI homepage (https://ais-pre-vl7shfbubzvznuqjmfarxa-982092797867.asia-east1.run.app)
Audio:
"Namaskara! Welcome to the demonstration of YatraAI, an intelligent travel planner crafted for Karnataka.
Karnataka is blessed with extraordinary cultural diversity—from UNESCO World Heritage temples in Hampi and Badami to the misty coffee estates of Coorg and pristine Arabian sea beaches in Gokarna.
However, travellers struggle with generic AI tools that hallucinate impossible driving routes, invent fake ticket prices, or force you to restart your entire itinerary when you want to change just one day.
YatraAI solves this by combining Gemini 3.8 Flash with a curated 32-destination verified Karnataka catalog, interactive OpenStreetMap mapping, and deterministic budget calculations."

[0:30 - 1:15] SCENE 2: The Trip Planner & Flexible Origins
Visual: Demonstrator scrolls through the Trip Planner form.
Audio:
"Let's create a journey. Unlike rigid apps that assume everyone starts in Bengaluru, YatraAI supports travelers departing from Mangaluru, Hubballi-Dharwad, Belagavi, or custom locations.
Here, we select our origin as Bengaluru, set our preferred circuit to 'Mysuru & Southern Heritage', and specify a 3-day duration for 2 travelers with a budget of ₹30,000.
We can choose our comfort tier—economical, comfortable, or premium—and our travel pace. Notice our experience filters: Heritage, Nature, Food & Culture. We can also flag dietary preferences such as Pure Vegetarian or Jain.
Now, let's click 'Generate Itinerary'."

[1:15 - 2:00] SCENE 3: The Itinerary Workspace & Interactive Map
Visual: The AI synthesizes the itinerary. The two-column workspace appears with Day 1 loaded.
Audio:
"In seconds, our itinerary is generated. On the left is our Day-by-Day itinerary workspace; on the right is an interactive OpenStreetMap centered directly on our stops.
Notice the depth of information:
- Each stop has an exact arrival time and recommended visit duration.
- Official names accompanied by authentic Kannada typography.
- Verified ASI and Karnataka Tourism admission fees.
- Local food recommendations—like Mylari Dosa in Mysuru and authentic filter coffee.
When we click on Stop 1 or Stop 2, notice how the map smoothly glides and highlights the marker with full details!"

[2:00 - 2:40] SCENE 4: Stop Reordering & Single-Day Regeneration
Visual: Demonstrator moves a stop up/down, removes a stop, and clicks 'Regenerate Day'.
Audio:
"YatraAI puts the traveler in full control. If we want to change our order, we can reorder stops with one click.
And here is one of our flagship features: Single-Day Regeneration.
If we want to change Day 2 without affecting Day 1 or Day 3, we simply click 'Regenerate Day', enter an optional preference like 'Focus on outdoor waterfalls', and YatraAI refreshes only that specific day using verified alternative destinations.
The rest of your journey remains completely intact!"

[2:40 - 3:15] SCENE 5: Deterministic Budget Recalculator
Visual: Demonstrator scrolls down to the Budget Breakdown panel and adjusts values.
Audio:
"Now let's examine the financial plan. Generic AI tools often make arithmetic mistakes.
YatraAI uses deterministic application-level math.
It calculates:
- Exact accommodation rooms needed: 2 travellers = 1 room across 2 nights.
- Food allowance per person per day.
- Summed entry fees from all scheduled stops.
- Transport and emergency reserves.
If we adjust our hotel allowance or add travellers, the entire budget recomputes instantly in Indian Rupee format, with live overrun indicators and full transparency of assumptions."

[3:15 - 3:45] SCENE 6: Export, Offline Storage & Conclusion
Visual: Demonstrator clicks 'Export Itinerary', opens the print preview, and shows the Markdown copy.
Audio:
"When our itinerary is complete, we can click 'Export Itinerary'.
We can save a beautifully formatted, print-ready PDF, download a clean Markdown document, or copy the schedule to our clipboard for sharing.
YatraAI also persists your active trip in local browser storage, so your plan is available even if you lose network connectivity during travel.
YatraAI brings intelligent, respectful, and reliable technology to Karnataka's tourism ecosystem.
Thank you, and Jai Karnataka!"
```
