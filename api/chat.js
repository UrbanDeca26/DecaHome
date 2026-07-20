function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (_) { resolve({}); }
    });
    req.on('error', reject);
  });
}

const DEFAULT_PROPERTY = {
  name: 'Luxury Stay',
  area: 'Urban Deca Homes Ortigas Extension, Pasig City',
  building: 'BLDG Q - Area 4/3',
  capacity: 'Up to 9 guests',
  checkIn: '1:00 PM onwards',
  checkOut: '11:00 AM next day',
  securityDeposit: 'PHP 1,000 refundable deposit / reservation fee',
  parking: 'No parking included; please advise early if parking is needed.',
  parkingRates: { car: 'PHP 400.00 per 24 hrs', motorcycle: 'PHP 250.00 per 24 hrs' },
  pricing: [
    'Weekdays (4 pax): PHP 2,289 - 22 hrs',
    'Weekends (4 pax): PHP 2,489 - 22 hrs (Fri-Sun)',
    'Daycation (2 pax): PHP 1,450 - 10 hrs',
    'Daycation (2 pax): PHP 1,699 - 12 hrs',
    'Daycation (2 pax): PHP 2,289 - 22 hrs',
    'Additional 2 hrs: PHP 350.00',
    'Additional 3 hrs: PHP 480.00',
    'Additional 5 hrs: PHP 760.00',
  ],
  nearby: ['SM East Ortigas', 'Bridgetowne', 'SM Megamall', 'Robinsons Galleria', 'Medical City', 'Tiendesitas', 'Libis, Eastwood', 'Junction, Cainta', 'Arcovia, Pasig'],
  houseRules: [
    'Clean as you go',
    'No smoking or vaping inside the unit',
    'No pool access',
    'No parking unless arranged in advance',
    'No unannounced visitors',
    'Quiet hours: Sunday to Thursday 10:00 PM - 8:00 AM; Friday to Saturday 12:00 AM - 9:00 AM',
  ],
  bookingRequirements: [
    'Valid government-issued ID for all guests',
    'One email address and contact number',
    'PHP 1,000 security deposit / reservation fee',
    'Parking request, if needed, must be advised early',
  ],
  selfCheckIn: [
    'Pick up the tap card from Locker 706 in the Building Q mailbox area using passcode 796.',
    'Take Elevator Area 4 and tap the card to reach the 7th floor.',
    'Open unit 706 using the lockbox code 7226 and lock it again after use.',
    'Turn on the breaker by switching up all the red levers.',
  ],
  checkout: [
    'Switch all breaker levers down.',
    'Return the tap card to Locker 706.',
    'Return the main door key to the lockbox using code 7226.',
    'Collect your belongings and switch off appliances.',
    'Dispose of trash in the designated area at the back.',
  ],
};

function normalizeTextList(value, fallback) {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  return Array.isArray(fallback) ? fallback.slice() : [];
}

function normalizeProperty(source) {
  const src = source && typeof source === 'object' ? source : {};
  const out = { ...DEFAULT_PROPERTY, ...src };
  out.capacity = String(src.capacity || out.capacity || 'Up to 9 guests');
  out.area = String(src.area || out.area || '').trim();
  out.building = String(src.building || out.building || '').trim();
  out.checkIn = String(src.checkIn || out.checkIn || '').trim();
  out.checkOut = String(src.checkOut || out.checkOut || '').trim();
  out.securityDeposit = String(src.securityDeposit || out.securityDeposit || '').trim();
  out.parking = String(src.parking || out.parking || '').trim();
  out.parkingRates = {
    car: String((src.parkingRates && src.parkingRates.car) || out.parkingRates.car || '').trim(),
    motorcycle: String((src.parkingRates && src.parkingRates.motorcycle) || out.parkingRates.motorcycle || '').trim(),
  };
  out.pricing = normalizeTextList(src.pricing, out.pricing);
  out.nearby = normalizeTextList(src.nearby, out.nearby);
  out.houseRules = normalizeTextList(src.houseRules, out.houseRules);
  out.bookingRequirements = normalizeTextList(src.bookingRequirements, out.bookingRequirements);
  out.selfCheckIn = normalizeTextList(src.selfCheckIn, out.selfCheckIn);
  out.checkout = normalizeTextList(src.checkout, out.checkout);
  return out;
}

function localAnswer(property, amenities, message) {
  const q = String(message || '').toLowerCase();
  const a = Array.isArray(amenities) ? amenities : [];
  if (/location|where|address|map|quezon|pasig|ortigas/.test(q)) return `${property.area}. ${property.building}. Nearby places include ${property.nearby.join(', ')}.`;
  if (/parking/.test(q)) return `${property.parking} Parking rates are Car ${property.parkingRates.car} and Motorcycle ${property.parkingRates.motorcycle}.`;
  if (/price|rate|cost|pricing/.test(q)) return `The listed prices are ${property.pricing.join('; ')}.`;
  if (/guest|how many|capacity|sleep/.test(q)) return `The unit is set up for ${property.capacity}.`;
  if (/check.?in|self check|arrival/.test(q)) return `Self check-in starts at ${property.checkIn}. Tap card and lockbox steps are in the guide section.`;
  if (/checkout|check.?out|leave|departure/.test(q)) return `Checkout is at ${property.checkOut}. Return the tap card and key, turn off appliances, and dispose of trash.`;
  if (/rule|smok|noise|visitor|pool/.test(q)) return `House rules include ${property.houseRules.join(', ')}.`;
  if (/require|id|deposit|reservation/.test(q)) return `Booking requirements include ${property.bookingRequirements.join(', ')}.`;
  if (/amenit|include|what is inside|included/.test(q)) return `Highlighted amenities include ${a.slice(0, 10).map((item) => item.title).join(', ')}.`;
  return `I can answer about the location, parking, booking requirements, pricing, check-in, checkout, house rules, or amenities using the property details on the page.`;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);
    const message = String(body.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const property = normalizeProperty(body.property);
    const amenities = Array.isArray(body.property?.amenities) ? body.property.amenities : [];
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ reply: localAnswer(property, amenities, message), intent: 'property_info', risk: 'low' });
    }

    const systemPrompt = `
You are the AI concierge for ${property.name}. Answer only from the supplied property facts.
If the answer is not in the facts, say you do not have that detail yet and suggest checking the listing or contacting the host.
Do not invent prices, amenities, parking, or location details.
Keep answers short, clear, and practical.

Property facts:
- Name: ${property.name}
- Area: ${property.area}
- Type: ${property.type || 'Entire private condo'}
- Rating: ${property.rating || '4.98'}
- Capacity: ${property.capacity}
- Check-in: ${property.checkIn}
- Check-out: ${property.checkOut}
- Price guide: ${property.pricing.join(' | ')}
- Parking: ${property.parking}
- Nearby: ${property.nearby.join(', ')}
- Booking requirements: ${property.bookingRequirements.join(' | ')}
- House rules: ${property.houseRules.join(' | ')}
- Self check-in: ${property.selfCheckIn.join(' | ')}
- Checkout: ${property.checkout.join(' | ')}
`.trim();

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_completion_tokens: 220,
    };

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return res.status(200).json({ reply: localAnswer(property, amenities, message), intent: 'property_info', risk: 'low' });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || localAnswer(property, amenities, message);
    return res.status(200).json({ reply, intent: 'property_info', risk: 'low' });
  } catch (err) {
    return res.status(200).json({ reply: localAnswer(normalizeProperty(), [], String((req.body && req.body.message) || '')), intent: 'property_info', risk: 'low' });
  }
};
