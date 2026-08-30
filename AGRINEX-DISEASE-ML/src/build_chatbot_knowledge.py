import json
from pathlib import Path

# Load existing 60-class disease information
disease_info_path = Path("data/disease_info.json")
with open(disease_info_path, "r", encoding="utf-8") as f:
    disease_info = json.load(f)

# Crop-specific agricultural guides
crop_guides = {
    "Apple": {
        "crop_name": "Apple",
        "basic_info": "Apple trees thrive in temperate climates requiring cold winter dormant periods (chilling hours). They prefer full sunlight.",
        "irrigation": "Water young trees deeply 1-2 times per week. Mature trees require about 1 inch of water per week, especially during fruit set.",
        "soil_fertilizer": "Prefers well-drained, fertile soil with a pH between 6.0 and 7.0. Apply balanced NPK fertilizer in early spring.",
        "common_pests": "Codling moth, aphids, apple maggot, and spider mites.",
        "healthy_appearance": "Smooth, vibrant green leaves with sturdy branches and unblemished developing fruit."
    },
    "Bitter Gourd": {
        "crop_name": "Bitter Gourd",
        "basic_info": "Warm-season vine crop requiring strong trellis support and warm temperatures (24-35°C).",
        "irrigation": "Maintain consistent soil moisture. Water 2-3 times weekly at the base of the vine using drip irrigation.",
        "soil_fertilizer": "Thrives in sandy-loam soil rich in organic matter (pH 6.0-6.7). Apply composted manure and balanced NPK.",
        "common_pests": "Fruit flies, aphids, red pumpkin beetle, and leaf miners.",
        "healthy_appearance": "Deep green deeply lobed leaves, vibrant yellow flowers, and firm ribbed green fruits."
    },
    "Blueberry": {
        "crop_name": "Blueberry",
        "basic_info": "Acid-loving perennial shrub requiring full sun, acidic soil, and high organic mulch (pine bark/woodchips).",
        "irrigation": "Shallow root system requires 1-2 inches of water per week. Drip irrigation is strongly recommended.",
        "soil_fertilizer": "Requires acidic soil pH between 4.5 and 5.5. Use ammonium sulfate or specialized acid-forming fertilizer.",
        "common_pests": "Spotted wing drosophila, blueberry maggot, and birds.",
        "healthy_appearance": "Glossy dark green leaves, sturdy canes, and plump blue berries."
    },
    "Bottle Gourd": {
        "crop_name": "Bottle Gourd",
        "basic_info": "Fast-growing tropical vine needing vertical trellis systems for fruit shape and air circulation.",
        "irrigation": "Water regularly to keep soil moist but not waterlogged. Increase watering during flowering and fruit growth.",
        "soil_fertilizer": "Well-drained loamy soil rich in humus (pH 6.5-7.5). Feed with organic compost and balanced fertilizers.",
        "common_pests": "Aphids, red beetle, and fruit flies.",
        "healthy_appearance": "Broad light green leaves, white night-blooming flowers, and clean green bottleneck gourds."
    },
    "Cauliflower": {
        "crop_name": "Cauliflower",
        "basic_info": "Cool-season brassica crop sensitive to temperature spikes. Best grown in temperatures between 15-20°C.",
        "irrigation": "Requires consistent moisture (1-1.5 inches per week). Never let soil dry out during head formation.",
        "soil_fertilizer": "Fertile, moisture-retentive soil rich in nitrogen and organic matter (pH 6.0-7.0).",
        "common_pests": "Cabbage worms, flea beetles, aphids, and diamondback moth larvae.",
        "healthy_appearance": "Broad crisp blue-green outer leaves protecting a compact, firm white curd."
    },
    "Cherry": {
        "crop_name": "Cherry (including sour)",
        "basic_info": "Fruit tree requiring well-drained soil and cold winter dormant period. Prune annually to maintain open canopy.",
        "irrigation": "Water young trees weekly. Established trees require deep soaking during dry dry spells, especially during fruit ripening.",
        "soil_fertilizer": "Prefers deep, well-drained loamy soil (pH 6.0-7.0). Avoid excessive nitrogen which encourages foliar disease.",
        "common_pests": "Cherry fruit fly, aphids, spider mites, and Japanese beetles.",
        "healthy_appearance": "Smooth green serrated leaves with clean bark and bright red/dark fruit clusters."
    },
    "Corn": {
        "crop_name": "Corn (maize)",
        "basic_info": "Heavy feeder growing best in block plantings for wind pollination under full direct sunlight.",
        "irrigation": "Critical watering periods are during tasseling and ear formation. Requires 1-1.5 inches of water weekly.",
        "soil_fertilizer": "Needs fertile, warm soil (pH 6.0-6.8). Requires heavy nitrogen application at planting and knee-high stage.",
        "common_pests": "Corn earworm, fall armyworm, corn borer, and rootworms.",
        "healthy_appearance": "Tall sturdy stalks with broad dark green leaves and full green husk ears."
    },
    "Cucumber": {
        "crop_name": "Cucumber",
        "basic_info": "Fast-growing warm-season crop that thrives on vertical trellises to increase airflow and reduce fruit rot.",
        "irrigation": "Needs consistent watering (1 inch per week). Irregular watering causes bitter tasting fruit.",
        "soil_fertilizer": "Warm, well-drained soil rich in organic matter (pH 6.0-7.0). Apply balanced fertilizer during vining.",
        "common_pests": "Cucumber beetles, aphids, squash bugs, and spider mites.",
        "healthy_appearance": "Hairy triangular green leaves, yellow blossoms, and crisp firm green cucumbers."
    },
    "Eggplant": {
        "crop_name": "Eggplant",
        "basic_info": "Warm-weather solanaceous crop requiring high heat (25-32°C) and sturdy staking support.",
        "irrigation": "Water deeply 1-2 times weekly. Drip irrigation and soil mulching maintain necessary root moisture.",
        "soil_fertilizer": "Rich, well-drained sandy loam soil (pH 5.5-6.8). Apply nitrogen and potassium during fruit set.",
        "common_pests": "Flea beetles, whiteflies, aphids, hornworms, and spider mites.",
        "healthy_appearance": "Large dark green leaves with purple leaf veins, star-shaped purple flowers, and glossy skin fruit."
    },
    "Grape": {
        "crop_name": "Grape",
        "basic_info": "Perennial vine requiring trellis management, full sunlight, and strategic annual winter pruning.",
        "irrigation": "Deep, infrequent watering encourages deep root growth. Avoid overhead wetting of foliage.",
        "soil_fertilizer": "Deep, well-drained soil (pH 5.5-7.0). Avoid over-fertilization to limit excessive canopy shade.",
        "common_pests": "Grape berry moth, leafhoppers, phylloxera, and Japanese beetles.",
        "healthy_appearance": "Clean lobed green leaves, strong tendril growth, and tight fruit clusters."
    },
    "Orange": {
        "crop_name": "Orange (Citrus)",
        "basic_info": "Subtropical evergreen citrus tree requiring sunny location and protection from severe freezing.",
        "irrigation": "Deep watering every 7-14 days depending on heat. Allow top soil layer to dry between waterings.",
        "soil_fertilizer": "Well-drained sandy or loam soil (pH 6.0-7.5). Apply specialized citrus fertilizer with micronutrients (zinc, iron).",
        "common_pests": "Asian citrus psyllid, citrus rust mite, scale insects, and whiteflies.",
        "healthy_appearance": "Glossy dark green leaves, fragrant white blossoms, and firm unblemished citrus fruits."
    },
    "Peach": {
        "crop_name": "Peach",
        "basic_info": "Deciduous fruit tree grown in warm temperate regions. Requires annual pruning to open center canopy.",
        "irrigation": "Requires regular water during fruit development (1-1.5 inches per week). Avoid soggy soil.",
        "soil_fertilizer": "Deep, well-drained sandy-loam soil (pH 6.0-6.5). Apply balanced nitrogen in spring.",
        "common_pests": "Peachtree borer, plum curculio, aphids, and oriental fruit moth.",
        "healthy_appearance": "Long lanceolate glossy green leaves and velvet fuzzy peaches."
    },
    "Pepper": {
        "crop_name": "Pepper, bell",
        "basic_info": "Warm-season crop that thrives in temperatures between 20-30°C. Staking is recommended.",
        "irrigation": "Keep soil evenly moist but not waterlogged. Mulching helps regulate moisture levels.",
        "soil_fertilizer": "Well-drained soil rich in organic material (pH 6.0-6.8). Requires adequate calcium to prevent blossom end rot.",
        "common_pests": "Pepper maggots, aphids, flea beetles, and hornworms.",
        "healthy_appearance": "Smooth dark green leaves, small white flowers, and thick-walled firm peppers."
    },
    "Potato": {
        "crop_name": "Potato",
        "basic_info": "Cool-season tuber crop grown by hilling soil around stems to encourage underground tuber development.",
        "irrigation": "Consistently moist soil is essential during tuber initiation and expansion (1-2 inches per week).",
        "soil_fertilizer": "Loose, well-drained acidic soil (pH 5.0-6.2). Apply balanced NPK prior to planting.",
        "common_pests": "Colorado potato beetle, aphids, wireworms, and leafhoppers.",
        "healthy_appearance": "Full bushy green leaf canopy with sturdy central stems."
    },
    "Raspberry": {
        "crop_name": "Raspberry",
        "basic_info": "Perennial cane crop grown on trellises. Canes are biennial while root system is perennial.",
        "irrigation": "Requires 1-1.5 inches of water per week, especially during flowering and fruit ripening.",
        "soil_fertilizer": "Well-drained soil rich in organic matter (pH 6.0-6.8). Apply compost and nitrogen early in spring.",
        "common_pests": "Raspberry cane borer, spider mites, and spotted wing drosophila.",
        "healthy_appearance": "Clean compound green leaves with silver under-sides and sturdy canes."
    },
    "Soybean": {
        "crop_name": "Soybean",
        "basic_info": "Legume crop capable of fixing atmospheric nitrogen in symbiotic relationship with Rhizobium bacteria.",
        "irrigation": "Most critical water needs occur during pod filling stage. Requires good field drainage.",
        "soil_fertilizer": "Adaptable to many soils (pH 6.0-6.8). Inoculate seeds with Rhizobium prior to planting.",
        "common_pests": "Soybean aphid, stink bugs, bean leaf beetle, and spider mites.",
        "healthy_appearance": "Clean green trifoliate leaves and hairy green pod clusters."
    },
    "Squash": {
        "crop_name": "Squash",
        "basic_info": "Warm-season crop including summer and winter squash. Requires abundant sunshine and pollinator activity.",
        "irrigation": "Deep watering at plant base (1-1.5 inches per week). Avoid wetting large broad leaves.",
        "soil_fertilizer": "Rich, well-drained soil with plenty of organic compost (pH 6.0-6.8).",
        "common_pests": "Squash vine borer, squash bugs, and cucumber beetles.",
        "healthy_appearance": "Large broad lobed green leaves and vibrant yellow-orange flowers."
    },
    "Strawberry": {
        "crop_name": "Strawberry",
        "basic_info": "Low-growing perennial fruit crop grown in raised beds mulched with clean straw or plastic.",
        "irrigation": "Shallow roots require 1 inch of water weekly. Drip irrigation keeps fruit and leaves dry.",
        "soil_fertilizer": "Well-drained sandy loam soil rich in organic matter (pH 5.5-6.5).",
        "common_pests": "Tarnished plant bug, spider mites, slugs, and strawberry sap beetle.",
        "healthy_appearance": "Deep green trifoliate leaves, white 5-petaled flowers, and clean red berries."
    },
    "Tomato": {
        "crop_name": "Tomato",
        "basic_info": "Popular solanaceous crop requiring full sun (6-8 hours daily), warm weather, and staking/caging support.",
        "irrigation": "Water deeply and regularly at the base (1-2 inches per week). Inconsistent watering causes blossom end rot.",
        "soil_fertilizer": "Fertile, well-drained loamy soil (pH 6.0-6.8). Requires nitrogen early, followed by high potassium and calcium.",
        "common_pests": "Tomato hornworm, whiteflies, aphids, spider mites, and flea beetles.",
        "healthy_appearance": "Deep green compound leaves, stout green stems, yellow star flowers, and smooth fruit."
    }
}

# General agricultural FAQs
general_faqs = [
    {
        "keywords": ["water", "watering", "irrigation", "how often water", "how much water"],
        "topic": "Irrigation Best Practices",
        "answer": "As a general rule, most vegetable crops and fruit trees require 1 to 1.5 inches of water per week. Water deeply at the base of the plant early in the morning using drip irrigation rather than overhead sprinklers to keep foliage dry and prevent fungal diseases."
    },
    {
        "keywords": ["fertilizer", "soil", "npk", "compost", "manure", "nutrition"],
        "topic": "Soil & Fertilizer Guidance",
        "answer": "Maintain soil health by incorporating well-rotted organic compost prior to planting. Nitrogen (N) promotes green leaf growth, Phosphorus (P) encourages root and flower development, and Potassium (K) strengthens disease resistance and fruit quality."
    },
    {
        "keywords": ["prevent", "prevention", "stop disease", "protection", "fungicide"],
        "topic": "General Disease Prevention",
        "answer": "Prevent plant diseases by: 1) Practicing 3-year crop rotation, 2) Ensuring wide plant spacing for canopy airflow, 3) Using drip irrigation instead of overhead watering, 4) Planting certified disease-free seeds/hybrids, and 5) Applying organic mulch to prevent soil splash."
    },
    {
        "keywords": ["healthy", "healthy plant", "good leaf", "normal leaf"],
        "topic": "Healthy Plant Characteristics",
        "answer": "A healthy crop leaf exhibits vibrant, uniform green color without yellowing, wilting, brown target spots, or fungal powder. Ensure consistent watering, proper sunlight (6-8 hours), and balanced fertilization to keep plants healthy."
    },
    {
        "keywords": ["pest", "insect", "bug", "pesticide", "neem oil"],
        "topic": "Pest & Insect Control",
        "answer": "Control common agricultural pests by inspecting leaf undersides regularly. Use physical barriers (insect netting), sticky traps, beneficial predator insects (ladybugs, lacewings), or spray organic treatments like neem oil or insecticidal soap at first sign of infestation."
    }
]

chatbot_db = {
    "version": "V2-B 60-Class Local Knowledge Base",
    "diseases": disease_info,
    "crops": crop_guides,
    "faqs": general_faqs
}

out_path = Path("data/chatbot_knowledge.json")
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(chatbot_db, f, indent=2)

print(f"Successfully generated {out_path} with {len(disease_info)} diseases, {len(crop_guides)} crop guides, and {len(general_faqs)} general FAQs.")
