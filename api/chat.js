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

function normalizeAmenities(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => ({
    title: String(item?.title || '').trim(),
    category: String(item?.category || 'Amenity').trim(),
    description: String(item?.description || '').trim(),
  })).filter((item) => item.title || item.description);
}

function reply(payload) {
  return { ...payload, intent: payload.intent || 'property_info', risk: payload.risk || 'low' };
}

function navReply(property, message, sectionId, openTopic, body, suggestions = []) {
  const replyText = body || `You can find that in ${sectionId === 'guide' ? 'Guide' : sectionId.charAt(0).toUpperCase() + sectionId.slice(1)}${openTopic ? ` → ${openTopic}` : ''}.`;
  return reply({
    reply: replyText,
    intent: 'navigate',
    sectionId,
    openTopic,
    suggestions,
    showInquiryForm: false,
  });
}

function inquiryReply(text, suggestions = []) {
  return reply({
    reply: text || 'I could not find that detail on the site yet. You can send a message to the host below.',
    intent: 'escalate',
    showInquiryForm: true,
    suggestions,
  });
}


function localAnswer(property, amenities, message) {
  const q = String(message || '').toLowerCase();

  if (/\b(location|where|address|map|find|locate|exact location)\b/.test(q)) {
    return reply({
      reply: `We are at ${property.building}. Nearby places include SM East Ortigas, Bridgetowne, SM Megamall, Robinsons Galleria, Medical City, Tiendesitas, and Eastwood.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\bparking\b/.test(q)) {
    return reply({
      reply: `Parking is by request. Rates are Car: ${property.parkingRates.car} and Motorcycle: ${property.parkingRates.motorcycle}. Please advise early if you need parking.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/(price|rate|cost|pricing)/.test(q)) {
    return reply({
      reply: `Pricing is calculated live from the booking card. Weekdays: ${property.weekdayRate || '—'} · Weekends: ${property.weekendRate || '—'} · Included guests: ${property.includedGuests || '—'} · Extra guest fee: ${property.extraGuestFee || '—'} · Pet fee: ${property.petFee || '—'}`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(rule|smok|noise|visitor|pool|house)\b/.test(q)) {
    return reply({
      reply: `House rules include: ${property.houseRules.join(' · ')}.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\bcheck.?in|self check|arrival\b/.test(q)) {
    return reply({
      reply: `Self check-in starts at ${property.checkIn}. The steps are: ${property.selfCheckIn.join(' ')}`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\bcheckout|check.?out|leave|departure\b/.test(q)) {
    return reply({
      reply: `Checkout is at ${property.checkOut}. Reminder: ${property.checkout.join(' ')}`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(amenit|include|what is inside|included)\b/.test(q)) {
    return reply({
      reply: `The unit includes amenities like fast Wi‑Fi, smart TV, air conditioning, kitchenware, washing machine, karaoke, projector, dining set, and board games.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(gallery|photo|video|tour|walkthrough)\b/.test(q)) {
    return reply({
      reply: `The gallery and video tours show the unit’s living room, kitchen, bedroom, bathroom, and walkthrough clips.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(review|comment|testimonial)\b/.test(q)) {
    return reply({
      reply: `Guest reviews are positive, with guests highlighting the clean space, polished layout, and easy check-in.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(booking requirement|deposit|reservation fee|id|verify)\b/.test(q)) {
    return reply({
      reply: `Booking requirements include a valid ID for all guests, one email address and contact number, and the PHP 1,000 security deposit / reservation fee.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(book|reserve|availability)\b/.test(q)) {
    return reply({
      reply: `You can check availability using the booking form above, then send the request to the host.`,
      intent: 'property_info',
      risk: 'low',
      showInquiryForm: false,
    });
  }

  if (/\b(children|kids|birthday|decorate|pets|pet|late checkout|early check-in|midnight)\b/.test(q)) {
    return inquiryReply(
      `I could not find that detail on the site yet. Please send a message to the host using the inquiry form below.`,
      [
        { label: 'Send inquiry', query: 'I need to ask the host something not shown on the site.' },
        { label: 'Pricing', query: 'What is the pricing?' },
        { label: 'House Rules', query: 'What are the house rules?' },
      ]
    );
  }

  if (/\b(contact|host|email|message)\b/.test(q)) {
    return inquiryReply(
      `Use the inquiry form below to send your message to the host.`,
      [
        { label: 'Location', query: 'Where is the exact location?' },
        { label: 'Amenities', query: 'What amenities are included?' },
        { label: 'Booking', query: 'How do I book?' },
      ]
    );
  }

  return reply({
    reply: `I can answer questions about the stay here. If I do not have the detail on the site, I can send an inquiry to the host.`,
    intent: 'help',
    showInquiryForm: false,
    suggestions: [
      { label: 'Location', query: 'Where is the exact location?' },
      { label: 'Parking', query: 'What are the parking details?' },
      { label: 'Pricing', query: 'What is the pricing?' },
      { label: 'Amenities', query: 'What amenities are included?' },
      { label: 'Contact Host', query: 'I need to ask the host something not shown on the site.' },
    ],
  });
}


module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    let body = req.body;
    if (!body || typeof body !== 'object') body = await readBody(req);
    const message = String(body.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Missing message' });

    const property = normalizeProperty(body.property);
    const amenities = normalizeAmenities(body.property?.amenities);
    const local = localAnswer(property, amenities, message);

    // Local navigation / escalation answers take precedence because they map the site directly.
    if (local.intent === 'navigate' || local.intent === 'escalate') {
      return res.status(200).json(local);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return res.status(200).json(local);
    }

    const systemPrompt = `
You are Luna, the Luxury Stay virtual concierge.
Your first job is to guide the guest to the correct section of the site when the answer is already visible there.
If the site has the exact answer, respond with a short helpful sentence that points to the section.
If the answer is not on the site, tell the guest to use the inquiry form.
Do not invent prices, policies, amenities, or location details.
Keep answers short, warm, and practical.

Property facts:
- Name: ${property.name}
- Area: ${property.area}
- Type: ${property.type || 'Entire private condo'}
- Rating: ${property.rating || '4.98'}
- Capacity: ${property.capacity}
- Check-in: ${property.checkIn}
- Check-out: ${property.checkOut}
- Pricing: Weekday rate ${property.weekdayRate || '—'} | Weekend rate ${property.weekendRate || '—'} | Included guests ${property.includedGuests || '—'} | Extra guest fee ${property.extraGuestFee || '—'} | Pet fee ${property.petFee || '—'} | Max guests ${property.maxGuests || property.guestCapacity || '—'} | Max pets ${property.maxPets || '—'}
- Price guide: ${property.pricing.join(' | ')}
- Parking: ${property.parking}
- Nearby: ${property.nearby.join(', ')}
- Booking requirements: ${property.bookingRequirements.join(' | ')}
- House rules: ${property.houseRules.join(' | ')}
- Self check-in: ${property.selfCheckIn.join(' | ')}
- Checkout: ${property.checkout.join(' | ')}
- Amenities: ${amenities.slice(0, 12).map((a) => `${a.title} (${a.category})`).join(' | ')}
`.trim();

    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.2,
      max_completion_tokens: 180,
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
      return res.status(200).json(local);
    }

    const replyText = String(data?.choices?.[0]?.message?.content || '').trim();
    const unknown = !replyText || /i (?:don['’]?t|do not|cannot|can't) have|not sure|not listed|use the inquiry form|send an inquiry|contact the host/i.test(replyText);
    if (unknown) {
      return res.status(200).json({
        reply: `I could not find that detail on the site yet. You can send a message to the host using the inquiry form below.`,
        intent: 'escalate',
        showInquiryForm: true,
        suggestions: [
          { label: 'Location', query: 'Where is the exact location?' },
          { label: 'Parking', query: 'What are the parking details?' },
          { label: 'Pricing', query: 'What is the pricing?' },
          { label: 'Amenities', query: 'What amenities are included?' },
        ],
      });
    }

    return res.status(200).json({
      reply: replyText,
      intent: 'property_info',
      risk: 'low',
      suggestions: [
        { label: 'Location', query: 'Where is the exact location?' },
        { label: 'Parking', query: 'What are the parking details?' },
        { label: 'House Rules', query: 'What are the house rules?' },
        { label: 'Contact Host', query: 'I need to ask the host something not shown on the site.' },
      ],
    });
  } catch (err) {
    return res.status(200).json({
      reply: `I can help with the site sections or send an inquiry if the detail is not listed.`,
      intent: 'help',
      risk: 'low',
      suggestions: [
        { label: 'Location', query: 'Where is the exact location?' },
        { label: 'Parking', query: 'What are the parking details?' },
        { label: 'Pricing', query: 'What is the pricing?' },
        { label: 'Contact Host', query: 'I need to ask the host something not shown on the site.' },
      ],
    });
  }
};
