// paapi.js : proxy Amazon PA-API (Netlify Function)
import { createHmac } from "crypto";

export async function handler(event) {
  const access = process.env.AMAZON_ACCESS_KEY;
  const secret = process.env.AMAZON_SECRET_KEY;
  const tag = process.env.AMAZON_PARTNER_TAG;
  const region = "eu-west-1"; // Région Amazon.fr

  if (!access || !secret || !tag) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: "❌ Variables non détectées" })
    };
  }

  try {
    const { asin } = JSON.parse(event.body);

    const payload = {
      PartnerTag: tag,
      PartnerType: "Associates",
      Marketplace: "www.amazon.fr",
      Operation: "GetItems",
      ItemIds: [asin],
      Resources: [
        "Images.Primary.Large",
        "ItemInfo.Title",
        "Offers.Listings.Price"
      ]
    };

    const host = "webservices.amazon.fr";
    const path = "/paapi5/getitems";
    const endpoint = `https://${host}${path}`;
    const method = "POST";
    const headers = {
      "content-encoding": "amz-1.0",
      "content-type": "application/json; charset=UTF-8",
      host
    };

    // Signature HMAC (Amazon PAAPI v5)
    const service = "ProductAdvertisingAPI";
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.substring(0, 8);
    const canonicalRequest = [
      method,
      path,
      "",
      Object.entries(headers)
        .map(([k, v]) => `${k}:${v}`)
        .join("\n") + "\n",
      Object.keys(headers).join(";"),
      require("crypto").createHash("sha256").update(JSON.stringify(payload)).digest("hex")
    ].join("\n");

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      require("crypto").createHash("sha256").update(canonicalRequest).digest("hex")
    ].join("\n");

    function sign(key, msg) {
      return createHmac("sha256", key).update(msg).digest();
    }

    const kDate = sign(`AWS4${secret}`, dateStamp);
    const kRegion = sign(kDate, region);
    const kService = sign(kRegion, service);
    const kSigning = sign(kService, "aws4_request");

    const signature = createHmac("sha256", kSigning)
      .update(stringToSign)
      .digest("hex");

    headers["x-amz-date"] = amzDate;
    headers["Authorization"] = `AWS4-HMAC-SHA256 Credential=${access}/${credentialScope}, SignedHeaders=${Object.keys(headers).join(";")}, Signature=${signature}`;

    const res = await fetch(endpoint, {
      method,
      headers,
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    const item = data.ItemsResult?.Items?.[0];

    if (!item) throw new Error("Aucun produit trouvé");

    const result = {
      ok: true,
      asin,
      title: item.ItemInfo?.Title?.DisplayValue,
      image: item.Images?.Primary?.Large?.URL,
      price: item.Offers?.Listings?.[0]?.Price?.DisplayAmount
    };

    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message })
    };
  }
}
