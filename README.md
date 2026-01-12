# AutoScout24 Scraper

Extract used and new car listings from AutoScout24, Europe's largest online car marketplace. Get comprehensive vehicle data including prices, specifications, mileage, and seller information from 8 European countries.

## Features

- **Multi-Country Coverage** — Search across Germany, Austria, Italy, Belgium, Netherlands, Spain, Luxembourg, and France
- **Comprehensive Vehicle Data** — Extract 20+ data fields per listing including make, model, price, mileage, year, fuel type, and more
- **Flexible Search Filters** — Filter by make, model, price range, year range, mileage, and fuel type
- **Fast & Cost-Efficient** — Lightweight scraping optimized for speed and minimal compute usage
- **Structured Output** — Clean JSON data ready for analysis, databases, or integrations

## Use Cases

- **Car Dealership Intelligence** — Monitor competitor pricing and inventory
- **Market Research** — Analyze used car price trends across European markets
- **Price Comparison** — Find the best deals on specific makes and models
- **Inventory Tracking** — Track vehicle availability and pricing changes over time
- **Data Analytics** — Build datasets for automotive market analysis

## Input Configuration

### Start URLs
Provide custom AutoScout24 search URLs to scrape specific searches. If omitted, the scraper builds a URL based on your filter settings.

### Search Filters

| Filter | Description | Example |
|--------|-------------|---------|
| Countries | European countries to search | Germany, Austria |
| Make | Car manufacturer | BMW, Audi, Mercedes-Benz |
| Model | Specific model | 3 Series, A4, Golf |
| Price Range | Min/max price in EUR | €5,000 - €25,000 |
| Year Range | Registration year | 2018 - 2023 |
| Mileage Range | Kilometers driven | 0 - 100,000 km |
| Fuel Type | Engine type | Gasoline, Diesel, Electric |

### Limits

| Setting | Description | Default |
|---------|-------------|---------|
| Max Results | Maximum listings to collect | 50 |
| Max Pages | Maximum search pages to process | 10 |

## Output Data

Each car listing contains the following fields:

```json
{
  "id": "listing-id",
  "make": "BMW",
  "model": "320i",
  "version": "Sport Line",
  "price": 24990,
  "currency": "EUR",
  "mileage_km": 45000,
  "first_registration": "2020",
  "fuel_type": "Gasoline",
  "transmission": "Automatic",
  "power_hp": 184,
  "power_kw": 135,
  "body_type": "Sedan",
  "color": "Black",
  "num_doors": 4,
  "num_seats": 5,
  "seller_name": "BMW München",
  "seller_type": "Dealer",
  "location_city": "Munich",
  "location_country": "D",
  "location_zip": "80331",
  "image_url": "https://...",
  "url": "https://www.autoscout24.com/offers/..."
}
```

## Sample Output

| Make | Model | Price (€) | Mileage | Year | Fuel | Location |
|------|-------|-----------|---------|------|------|----------|
| BMW | 320i | 24,990 | 45,000 km | 2020 | Gasoline | Munich |
| Audi | A4 Avant | 31,500 | 62,000 km | 2019 | Diesel | Vienna |
| Mercedes-Benz | C 200 | 28,900 | 38,000 km | 2021 | Gasoline | Milan |
| Volkswagen | Golf | 18,500 | 55,000 km | 2018 | Diesel | Berlin |

## Cost Estimation

The scraper is optimized for minimal compute usage:

| Results | Estimated Time | Estimated Cost |
|---------|---------------|----------------|
| 50 listings | ~30 seconds | ~$0.01 |
| 200 listings | ~2 minutes | ~$0.03 |
| 500 listings | ~5 minutes | ~$0.08 |

Actual costs depend on proxy usage and platform load.

## Tips for Best Results

1. **Use Specific Filters** — Narrowing your search by make, model, or price range returns more relevant results faster
2. **Start with Default Countries** — All 8 countries are searched by default; limit to specific markets if needed
3. **Moderate Result Limits** — Start with 50-100 results to verify the data meets your needs before scaling up
4. **Residential Proxies** — Default proxy configuration is recommended for reliable access

## Integrations

Export your data in multiple formats:
- **JSON** — Structured data for APIs and applications
- **CSV** — Import into spreadsheets or databases
- **Excel** — Direct download for business analysis

Connect to your workflow using:
- Apify API
- Webhooks
- Zapier, Make, or other automation platforms

## FAQ

**How often is the data updated?**  
Data is scraped in real-time from AutoScout24 listings. Run the scraper periodically to track changes.

**Are all listings included?**  
The scraper collects public listings from AutoScout24's search results. Premium or promoted listings are included.

**Can I scrape a specific dealer's inventory?**  
Yes, provide the dealer's AutoScout24 page URL as a Start URL.

**What happens if a listing is removed?**  
The scraper only collects currently available listings. Historical tracking requires periodic runs and data comparison.

## Legal Notice

This scraper accesses publicly available data from AutoScout24. Users are responsible for complying with applicable laws and the website's terms of service. Use responsibly and respect rate limits.

## Support

Need help or have feature requests? Contact the developer or open an issue in the repository.