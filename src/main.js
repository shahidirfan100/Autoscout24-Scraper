// Autoscout24 Car Listings Scraper - CheerioCrawler implementation
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';

await Actor.init();

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            startUrls = [],
            countries = ['D', 'A', 'I', 'B', 'NL', 'E', 'L', 'F'],
            make = '',
            model = '',
            priceFrom,
            priceTo,
            yearFrom,
            yearTo,
            mileageFrom,
            mileageTo,
            fuelType = '',
            results_wanted: RESULTS_WANTED_RAW = 50,
            max_pages: MAX_PAGES_RAW = 10,
            collectDetails = false,
            proxyConfiguration,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : 50;
        const MAX_PAGES = Math.min(Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 10, 20);

        const buildSearchUrl = () => {
            const url = new URL('https://www.autoscout24.com/lst');
            if (countries.length) url.searchParams.set('cy', countries.join(','));
            if (make) url.searchParams.set('mmvmk0', make.toLowerCase());
            if (model) url.searchParams.set('mmvmd0', model.toLowerCase());
            if (priceFrom) url.searchParams.set('pricefrom', String(priceFrom));
            if (priceTo) url.searchParams.set('priceto', String(priceTo));
            if (yearFrom) url.searchParams.set('fregfrom', String(yearFrom));
            if (yearTo) url.searchParams.set('fregto', String(yearTo));
            if (mileageFrom) url.searchParams.set('kmfrom', String(mileageFrom));
            if (mileageTo) url.searchParams.set('kmto', String(mileageTo));
            if (fuelType) url.searchParams.set('fuel', fuelType.toUpperCase().charAt(0));
            url.searchParams.set('source', 'detailsearch');
            return url.href;
        };

        const initial = [];
        if (Array.isArray(startUrls) && startUrls.length) {
            for (const u of startUrls) {
                if (typeof u === 'string') initial.push(u);
                else if (u?.url) initial.push(u.url);
            }
        }
        if (!initial.length) initial.push(buildSearchUrl());

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        let saved = 0;
        const seenIds = new Set();
        const batchBuffer = [];
        const BATCH_SIZE = 10;

        const pushBatch = async (force = false) => {
            if (batchBuffer.length >= BATCH_SIZE || (force && batchBuffer.length > 0)) {
                await Dataset.pushData(batchBuffer.splice(0, batchBuffer.length));
            }
        };

        const extractNextData = (html) => {
            const match = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
            if (!match) return null;
            try {
                return JSON.parse(match[1]);
            } catch {
                return null;
            }
        };

        const parsePrice = (priceData) => {
            if (!priceData) return { price: null, currency: 'EUR' };
            return {
                price: priceData.priceRaw ?? priceData.price ?? null,
                currency: priceData.currency || 'EUR',
            };
        };

        const extractListingFromData = (item) => {
            if (!item) return null;
            const vehicle = item.vehicle || {};
            const tracking = item.tracking || {};
            const location = item.location || {};
            const seller = item.seller || {};
            const { price, currency } = parsePrice(item.price);

            return {
                id: item.id || null,
                make: vehicle.make || tracking.make || null,
                model: vehicle.model || tracking.model || null,
                version: vehicle.modelVersionInput || null,
                price,
                currency,
                mileage_km: vehicle.mileageInKm ?? vehicle.mileageInKmRaw ?? null,
                first_registration: tracking.firstRegistration || vehicle.firstRegistration || null,
                fuel_type: vehicle.fuel || vehicle.fuelType || null,
                transmission: vehicle.transmission || vehicle.gearbox || null,
                power_hp: tracking.power || vehicle.power || null,
                power_kw: vehicle.powerInKw || null,
                body_type: vehicle.bodyType || null,
                color: vehicle.bodyColor || null,
                num_doors: vehicle.numberOfDoors || null,
                num_seats: vehicle.numberOfSeats || null,
                seller_name: seller.companyName || seller.name || null,
                seller_type: seller.type || null,
                location_city: location.city || null,
                location_country: location.countryCode || null,
                location_zip: location.zip || null,
                image_url: item.images?.[0]?.url || item.image?.url || null,
                url: item.url ? `https://www.autoscout24.com${item.url.startsWith('/') ? '' : '/'}${item.url}` : null,
            };
        };

        const extractFromHtml = ($) => {
            const listings = [];
            $('article').each((_, el) => {
                const $el = $(el);
                const linkEl = $el.find('a[href*="/offers/"]').first();
                const href = linkEl.attr('href');
                if (!href) return;

                const title = $el.find('[class*="ListItemTitle"]').text().trim();
                const priceText = $el.find('[class*="Price"]').first().text().trim();
                const specs = [];
                $el.find('[data-testid="vehicle-details-item"], [class*="VehicleDetailTable_item"]').each((_, s) => {
                    specs.push($(s).text().trim());
                });

                const priceMatch = priceText.match(/[\d,.]+/);
                const price = priceMatch ? parseInt(priceMatch[0].replace(/[,.]/g, ''), 10) : null;

                const mileageSpec = specs.find(s => /km/i.test(s));
                const mileage = mileageSpec ? parseInt(mileageSpec.replace(/\D/g, ''), 10) : null;

                const yearSpec = specs.find(s => /^\d{2}\/\d{4}$/.test(s) || /^\d{4}$/.test(s));
                const year = yearSpec ? yearSpec.split('/').pop() : null;

                const fuelSpec = specs.find(s => /gasoline|diesel|electric|hybrid|petrol/i.test(s));
                const transmissionSpec = specs.find(s => /manual|automatic/i.test(s));
                const powerSpec = specs.find(s => /hp|kw|ps/i.test(s));

                listings.push({
                    id: href.split('/').pop()?.split('-')[0] || null,
                    make: title.split(' ')[0] || null,
                    model: title.split(' ').slice(1).join(' ') || null,
                    version: null,
                    price,
                    currency: 'EUR',
                    mileage_km: mileage,
                    first_registration: year,
                    fuel_type: fuelSpec || null,
                    transmission: transmissionSpec || null,
                    power_hp: powerSpec ? parseInt(powerSpec.replace(/\D/g, ''), 10) : null,
                    power_kw: null,
                    body_type: null,
                    color: null,
                    num_doors: null,
                    num_seats: null,
                    seller_name: null,
                    seller_type: null,
                    location_city: null,
                    location_country: null,
                    location_zip: null,
                    image_url: $el.find('img').first().attr('src') || null,
                    url: href.startsWith('http') ? href : `https://www.autoscout24.com${href}`,
                });
            });
            return listings;
        };

        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConf,
            maxRequestRetries: 3,
            useSessionPool: true,
            maxConcurrency: 5,
            requestHandlerTimeoutSecs: 60,
            additionalMimeTypes: ['application/json'],
            async requestHandler({ request, $, body }) {
                const pageNo = request.userData?.pageNo || 1;
                const html = typeof body === 'string' ? body : body.toString();

                if (saved >= RESULTS_WANTED) return;

                const nextData = extractNextData(html);
                let listings = [];
                let totalPages = 1;

                if (nextData?.props?.pageProps) {
                    const pageProps = nextData.props.pageProps;
                    const rawListings = pageProps.listings || pageProps.searchResult?.listings || [];
                    totalPages = pageProps.numberOfPages || pageProps.pagination?.totalPages || 1;

                    for (const item of rawListings) {
                        const parsed = extractListingFromData(item);
                        if (parsed) listings.push(parsed);
                    }
                    log.info(`Page ${pageNo}: Extracted ${listings.length} listings from __NEXT_DATA__ (total pages: ${totalPages})`);
                }

                if (!listings.length) {
                    listings = extractFromHtml($);
                    log.info(`Page ${pageNo}: Extracted ${listings.length} listings from HTML fallback`);
                }

                for (const listing of listings) {
                    if (saved >= RESULTS_WANTED) break;
                    if (listing.id && seenIds.has(listing.id)) continue;
                    if (listing.id) seenIds.add(listing.id);

                    batchBuffer.push(listing);
                    saved++;
                    await pushBatch();
                }

                if (saved < RESULTS_WANTED && pageNo < MAX_PAGES && pageNo < totalPages) {
                    const nextUrl = new URL(request.url);
                    nextUrl.searchParams.set('page', String(pageNo + 1));
                    await crawler.requestQueue.addRequest({
                        url: nextUrl.href,
                        userData: { pageNo: pageNo + 1 },
                    });
                }
            },
            async failedRequestHandler({ request }, error) {
                log.error(`Request failed: ${request.url} - ${error.message}`);
            },
        });

        await crawler.run(initial.map(u => ({ url: u, userData: { pageNo: 1 } })));
        await pushBatch(true);

        log.info(`Finished. Saved ${saved} vehicle listings.`);
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
