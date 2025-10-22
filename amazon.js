// amazon.js : appelle le proxy Netlify pour récupérer les infos Amazon
async function fetchAmazonData(asin) {
  const endpoint = '/.netlify/functions/paapi'; // chemin relatif à ton site Netlify

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asin })
    });

    if (!response.ok) throw new Error(`Erreur ${response.status}`);
    const data = await response.json();
    console.log('✅ Réponse proxy/PAAPI :', data);
    return data;
  } catch (err) {
    console.error('❌ Erreur proxy/PAAPI :', err);
    return null;
  }
}

// Petit test automatique (tu pourras l’enlever plus tard)
// Remplace par un vrai ASIN quand tu veux tester
// fetchAmazonData('B0XXXXXXX');
