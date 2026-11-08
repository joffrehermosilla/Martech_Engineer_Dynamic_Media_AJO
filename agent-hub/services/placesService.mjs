import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || "";

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
  const isLocalMode = (process.env.APP_EXECUTION_MODE || "auto").toLowerCase() === "local";

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

  // In Local mode, never attempt external Google network calls (Mandamiento 5 y 7)
  if (isLocalMode || !GOOGLE_MAPS_API_KEY) {
    const defaultLoc = BCP_LOCATIONS[0];
    return {
      success: true,
      source: isLocalMode ? "LOCAL_DETERMINISTIC_DIRECTORY" : "DEFAULT_FALLBACK",
      placeId: `local_${encodeURIComponent(query.toLowerCase().replace(/\s+/g, "_"))}`,
      name: `${query} (Ubicación Regional BCP)`,
      category: "REGIONAL_BRANCH",
      environmentStyle: `Sede regional BCP en ${query}. Arquitectura moderna con colores institucionales azul y naranja.`,
      promptSuggestion: `Setting: Sede regional BCP en ${query}. Modern, clean banking atmosphere for ${eventType}.`,
      isSimulated: true
    };
  }

  // If not in local mode and API key is present, query Google Places Search
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

/**
 * Propuesta y Análisis de Estacionalidad Geográfica y Anti-Alucinación (Fase 2 Editor Nativo)
 * Resuelve la discrepancia hemisférica: en Latinoamérica el 25 de Diciembre es pleno VERANO,
 * mientras que en el Hemisferio Norte es invierno con nieve.
 */
export function getRegionalSeasonalityProposal(region = "LATAM_COSTA", seasonDate = "NAVIDAD_DIC_25", useCase = "TARJETAS_RESTAURANTES_PLAYA") {
  const isSouthernHemisphere = !region.startsWith("NORTEAMERICA");
  
  if (seasonDate === "NAVIDAD_DIC_25" || seasonDate === "VERANO_ENE_MAR") {
    if (isSouthernHemisphere) {
      return {
        success: true,
        region,
        seasonDate,
        useCase,
        hemisphere: "SUR (Hemisferio Austral - Latinoamérica)",
        season: "VERANO AUSTRÁLICO ☀️",
        climate: "Cálido y soleado (26°C a 31°C). Cielo despejado, brisa marina en costa y sol radiante.",
        antiHallucinationWarning: "🚫 PROHIBIDO EL USO DE NIEVE, GORROS POLARES O PINOS NEVADOS: En el Hemisferio Sur (Perú/Latam), el 25 de Diciembre es pleno VERANO. La Navidad BCP se celebra con ropa ligera, reuniones al aire libre, sol, playa y compras veraniegas.",
        visualRecommendation: {
          palette: ["#002A8F (Azul BCP)", "#FF7800 (Naranja BCP)", "#00C3FF (Cielo Despejado)", "#FFD200 (Sol Dorado)"],
          lighting: "Luz solar diurna natural de alta luminosidad, sombras suaves de verano.",
          attire: "Vestimenta corporativa ligera o casual fresca, sin abrigos de invierno ni bufandas.",
          brandOverlay: "SELLO_VERANO_NAVIDAD_BCP_2026"
        },
        suggestedAssets: [
          {
            id: "aem_asset_summer_coast_01",
            title: "Fondo Costa Verde & Sol Veraniego",
            category: "BACKGROUND",
            deliveryUrl: "/damcraft/jobs/sample_card/visa_signature.png",
            climateTag: "VERANO_SOLEADO"
          },
          {
            id: "aem_asset_visa_signature_card",
            title: "Render Tarjeta Visa Signature (Beneficios Terrazas & Playas)",
            category: "CREDIT_CARDS",
            deliveryUrl: "/damcraft/jobs/sample_card/visa_signature.png",
            climateTag: "TERRAZAS_VERANO"
          },
          {
            id: "aem_asset_badge_summer_promo",
            title: "Sello Oficial 40% Dscto Restaurantes de Verano BCP",
            category: "BADGE",
            deliveryUrl: "/damcraft/jobs/sample_card/visa_signature.png",
            climateTag: "PROMO_VERANO"
          }
        ]
      };
    } else {
      return {
        success: true,
        region,
        seasonDate,
        useCase,
        hemisphere: "NORTE (Hemisferio Boreal)",
        season: "INVIERNO BOREAL ❄️",
        climate: "Frío invernal (< 5°C). Nevadas, chimeneas y ambiente térmico cerrado.",
        antiHallucinationWarning: "❄️ Contexto Boreal: El 25 de diciembre coincide con nieve, iluminación cálida interior y vestimenta de abrigo.",
        visualRecommendation: {
          palette: ["#0B2545 (Azul Noche)", "#D4AF37 (Dorado Cálido)", "#FFFFFF (Nieve Fina)"],
          lighting: "Iluminación cálida de chimenea y luces navideñas interiores.",
          attire: "Abrigos, suéteres y bufandas de invierno.",
          brandOverlay: "SELLO_INVIERNO_BOREAL_2026"
        },
        suggestedAssets: [
          {
            id: "aem_asset_winter_north_draft",
            title: "Boceto Invierno Boreal Nieve",
            category: "BACKGROUND",
            deliveryUrl: "/damcraft/jobs/sample_draft/stories_verde.jpg",
            climateTag: "INVIERNO_BOREAL"
          }
        ]
      };
    }
  }

  if (region === "LATAM_ANDINA") {
    return {
      success: true,
      region,
      seasonDate,
      useCase,
      hemisphere: "SUR (Sierra Andina - Cusco / Arequipa)",
      season: "TEMPORADA SECA / SOL SERRANO 🏔️",
      climate: "Cielo azul intenso, radiación solar diurna alta, arquitectura en piedra incaica y tejas coloniales.",
      antiHallucinationWarning: "🏛️ Identidad Patrimonial: Priorizar texturas de piedra, sillar blanco y artesanía tradicional BCP.",
      visualRecommendation: {
        palette: ["#002A8F (Azul BCP)", "#8D3B1B (Teja Colonial)", "#C99700 (Dorado Imperial)"],
        lighting: "Luz andina contrastada de mediodía, cielo azul puro sin niebla.",
        attire: "Casual elegante andino.",
        brandOverlay: "SELLO_PATRIMONIAL_BCP"
      },
      suggestedAssets: [
        {
          id: "aem_asset_cusco_heritage",
          title: "Sede Patrimonial BCP Cusco - Arcos Coloniales",
          category: "HERITAGE",
          deliveryUrl: "/damcraft/jobs/sample_card/visa_signature.png",
          climateTag: "ANDINA_PATRIMONIAL"
        }
      ]
    };
  }

  // Caso por defecto: Costa moderna (San Isidro / Lima)
  return {
    success: true,
    region,
    seasonDate,
    useCase,
    hemisphere: "SUR (Costa Metropolitana)",
    season: "TEMPORADA CORPORATIVA URBANA 🏢",
    climate: "Clima templado urbano, distrito financiero moderno, vidrio y skyline.",
    antiHallucinationWarning: "💼 Contexto Corporativo: Enfoque en eficiencia, banca móvil y agilidad.",
    visualRecommendation: {
      palette: ["#002A8F (Azul BCP)", "#FF7800 (Naranja BCP)", "#1E293B (Grafito Urbano)"],
      lighting: "Iluminación corporativa dinámica, reflejos de cristal.",
      attire: "Business formal contemporáneo.",
      brandOverlay: "SELLO_OFICIAL_BCP"
    },
    suggestedAssets: [
      {
        id: "aem_asset_visa_signature_card",
        title: "Render Tarjeta Visa Signature Metal",
        category: "CREDIT_CARDS",
        deliveryUrl: "/damcraft/jobs/sample_card/visa_signature.png",
        climateTag: "URBANO_PREMIUM"
      }
    ]
  };
}
