// Test de connexion Netlify → Variables Amazon
export async function handler() {
  const access = process.env.AMAZON_ACCESS_KEY;
  const secret = process.env.AMAZON_SECRET_KEY;
  const tag = process.env.AMAZON_PARTNER_TAG;

  if (!access || !secret || !tag) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        message: "❌ Variables non détectées.",
        AMAZON_ACCESS_KEY: !!access,
        AMAZON_SECRET_KEY: !!secret,
        AMAZON_PARTNER_TAG: !!tag
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      ok: true,
      message: "✅ Connexion réussie — variables détectées !",
      keys: {
        AMAZON_ACCESS_KEY: access.slice(0, 5) + "*****",
        AMAZON_SECRET_KEY: "********",
        AMAZON_PARTNER_TAG: tag
      }
    })
  };
}
