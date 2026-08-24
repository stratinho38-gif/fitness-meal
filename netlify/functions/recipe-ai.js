// Netlify function: AI συνταγές (v6.2)
// Το κλειδί έρχεται ΜΟΝΟ από env var ANTHROPIC_API_KEY (Netlify → Site configuration →
// Environment variables). ΠΟΤΕ μέσα στον κώδικα ή στο repo.
// Δεν κάνουμε log το περιεχόμενο των prompts/απαντήσεων.
'use strict';

const MAX_INPUT = 1200; // όριο μήκους prompt (χαρακτήρες)

exports.handler = async (event) => {
  const json = (code, body) => ({
    statusCode: code,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body)
  });

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'POST μόνο' });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return json(503, { error: 'Δεν έχει ρυθμιστεί κλειδί AI (ANTHROPIC_API_KEY) στο Netlify.' });
  }

  let q = '';
  try { q = String(JSON.parse(event.body || '{}').q || ''); } catch (e) { /* κακό JSON */ }
  q = q.trim().slice(0, MAX_INPUT);
  if (q.length < 10) return json(400, { error: 'Κενό ή πολύ μικρό αίτημα.' });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: 'Είσαι βοηθός μαγειρικής για πρόγραμμα διατροφής cut τύπου Nutrimed. ' +
          'Απαντάς πάντα στα ελληνικά, σύντομα και πρακτικά: υλικά με ποσότητες για 2 άτομα, ' +
          'απλά βήματα, εκτίμηση kcal/πρωτεΐνης/υδατανθράκων/λιπών ανά μερίδα. ' +
          'Προτιμάς ελληνικά, οικονομικά υλικά σούπερ μάρκετ. Δεν δίνεις ιατρικές συμβουλές.',
        messages: [{ role: 'user', content: q }]
      })
    });
    if (!res.ok) {
      // Log μόνο τον κωδικό, ποτέ το περιεχόμενο
      console.error('Anthropic API error, status:', res.status);
      return json(502, { error: 'Σφάλμα από την υπηρεσία AI (' + res.status + ').' });
    }
    const data = await res.json();
    const text = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();
    if (!text) return json(502, { error: 'Κενή απάντηση από το AI.' });
    return json(200, { text });
  } catch (e) {
    console.error('recipe-ai failure:', e && e.name);
    return json(500, { error: 'Απρόσμενο σφάλμα.' });
  }
};
