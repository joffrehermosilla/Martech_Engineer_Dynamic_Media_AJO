import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyD6xFLEqbLGqzeOgqKxbo8sI7ueDNsSRAg";

/**
 * Pre-approved BCP Corporate & Event Locations (Internal Ground Truth)
 */
const BCP_LOCATIONS = [
  {
    placeId: "bcp_sede_central_la_molina",
    name: "Sede Central BCP - La Molina",
    category: "CORPORATE_HEADQUARTERS",
    environmentStyle: "Modern glass architecture, lush gardens, executive financial campus",
    lat: -12.0838,
    lng: -76.9427,
    adobePoiId: "POI_BCP_MOLINA_001"
  },
  {
    placeId: "bcp_san_isidro_financiero",
    name: "Centro Financiero BCP - San Isidro",
    category: "FINANCIAL_DISTRICT",
    environmentStyle: "Skyscraper skyline, urban premium banking, dynamic business lighting",
    lat: -12.0967,
    lng: -77.0264,
    adobePoiId: "POI_BCP_ISIDRO_002"
  },
  {
    placeId: "bcp_cusco_plaza_armas",
    name: "Sede Patrimonial BCP - Cusco",
    category: "HERITAGE_CULTURAL",
    environmentStyle: "Andean colonial stone arches, warm amber lighting, cultural celebration",
    lat: -13.5167,
    lng: -71.9788,
    adobePoiId: "POI_BCP_CUSCO_003"
  }
];

/**
 * Enriches asset creation brief with geographical context (Google Places + Adobe Places POI)
 */
export async function getGeographicContext(query = "San Isidro", eventType = "CORPORATE_CEREMONY") {
  // First match against pre-approved internal directory
  const matched = BCP_LOCATIONS.find(l =>
    l.name.toLowerCase().includes(query.toLowerCase()) ||
    l.category.toLowerCase().includes(query.toLowerCase())
  );

  if (matched) {
    return {
      success: true,
      source: "INTERNAL_BCP_DIRECTORY",
      placeId: matched.placeId,
      name: matched.name,
      category: matched.category,
      environmentStyle: matched.environmentStyle,
      adobePoiId: matched.adobePoiId,
      promptSuggestion: `Setting: ${matched.environmentStyle}. Context: Formal ceremony for ${eventType}. High aesthetic, professional corporate palette with BCP navy blue and warm highlights.`
    };
  }

  // If not matched, query Google Places Search (New API / Geocoding with minimal FieldMask)
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query + " Peru")}&key=${GOOGLE_MAPS_API_KEY}&language=es`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === "OK" && data.results?.[0]) {
      const topResult = data.results[0];
      const placeId = topResult.place_id;
      const formattedAddress = topResult.formatted_address;

      return {
        success: true,
        source: "GOOGLE_PLACES_API",
        placeId: placeId,
        name: formattedAddress,
        category: "REGIONAL_VENUE",
        environmentStyle: `Peruvian regional setting near ${formattedAddress}`,
        promptSuggestion: `Setting: Representative urban architectural landscape in ${formattedAddress}. Clean, premium, banking atmosphere with compliant brand guidelines.`
      };
    }
  } catch (err) {
    console.warn(`[PlacesService] Google Places lookup error: ${err.message}`);
  }

  // Fallback to default corporate campus
  const defaultLoc = BCP_LOCATIONS[0];
  return {
    success: true,
    source: "DEFAULT_FALLBACK",
    placeId: defaultLoc.placeId,
    name: defaultLoc.name,
    environmentStyle: defaultLoc.environmentStyle,
    promptSuggestion: `Setting: ${defaultLoc.environmentStyle}. Elegant, premium BCP corporate setting.`
  };
}
