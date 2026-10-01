# Technical Notes

## Using both Yahoo Finance and Google Finance

As per the assignment: CMP comes from Yahoo Finance, and P/E ratio plus
latest earnings come from Google Finance.

**Yahoo Finance** has no public API, so I used the `yahoo-finance2` npm
package, which wraps Yahoo's unofficial quote endpoint. It returns
`regularMarketPrice` for CMP. All 26 holdings are fetched in a single
batched call (`yahooFinance.quote([...])`) instead of one request per stock.

**Google Finance** also has no public API and no JSON endpoint, but its
quote pages (e.g. `google.com/finance/quote/HDFCBANK:NSE`) turned out to be
plain server-rendered HTML, not something that needs a headless browser to
read. Every stat on that page follows the same repeating pattern:

```html
<div class="SwQK7">P/E ratio</div><div class="dO6ijd">14.08</div>
```

So the backend fetches that page with a plain `fetch()` call (no scraping
library) and pulls out the "P/E ratio" and "EPS" values with one regex over
that pattern. Google doesn't provide a batch endpoint like Yahoo does, so
this is one request per stock, fired concurrently for all 26.

If Google's scrape fails or times out for a particular stock (network hiccup,
or Google occasionally not answering one request out of many sent at once),
that stock's P/E and earnings fall back to Yahoo's own `trailingPE` /
`epsTrailingTwelveMonths` instead of just showing nothing. In testing this
only happened to one or two stocks per refresh cycle, if any, so it's a rare
safety net rather than the normal path.

## Matching stocks to tickers

The holdings in the given excel sheet were listed with either an NSE symbol
(like `HDFCBANK`) or a bare BSE numeric code (like `532174`). I tried using
the BSE codes directly with a `.BO` suffix on Yahoo but it didn't return data
for most of them, so for every BSE-coded stock I looked up the company's
actual NSE ticker using Yahoo's search endpoint and used that instead (all
of these companies are listed on NSE too). The same NSE code is used to
build the Google Finance URL (`CODE:NSE`), or `CODE:BOM` for the one holding
that's BSE-only.

Two stocks could not be found on Yahoo at all under any symbol: Savani
Financials and LTIMindtree. Google Finance doesn't have LTIMindtree either,
but it does have Savani Financials, so that row shows a real "Latest
Earnings" figure from Google even though its CMP, present value and
gain/loss stay `N/A` because Yahoo has no quote for it at all. This mix is
left as-is on purpose rather than hidden, as a real example of the "data may
be inaccurate or unavailable" problem the assignment warns about with
unofficial APIs.

## Caching, batching and rate limiting

- Yahoo: one batched call for all 26 symbols, not 26 separate calls.
- Google: 26 concurrent requests (no batch endpoint exists for it), each
  wrapped with a timeout so one slow response can't stall the whole cycle.
- The backend keeps the last fully-merged result in memory for 20 seconds.
  A REST request that arrives while that cache is still fresh is served
  straight from memory instead of triggering new calls to either API. This
  keeps the dashboard well under any reasonable rate limit even with
  multiple browser tabs open, since they all share one server-side refresh.

The 26 Google requests together take somewhere between about 4 and 10
seconds depending on Google's response time, compared to Yahoo's single
batched call which is near instant. Because of that, the refresh interval is
20 seconds rather than the 15 seconds mentioned in the assignment, so a full
cycle always finishes before the next one starts. A `busy` flag also stops a
second refresh from starting if one is still running.

## Real-time updates: websockets over polling

The assignment allows a simple `setInterval` poll, but also mentions
websockets as a more efficient option, so that's what I used. The backend
refreshes the data every 20 seconds and pushes the result to every connected
client over a websocket, instead of each browser tab polling on its own
timer. Opening the dashboard in several tabs doesn't multiply the number of
calls to Yahoo or Google, they all share the same server-side refresh.

The frontend also does one plain REST fetch to `/api/portfolio` on page
load, so the table has something to show immediately instead of waiting for
the first websocket push.

## Error handling

- If Yahoo has no data for a stock, CMP/present value/gain-loss show `N/A`.
- If Google's scrape fails for a stock, its P/E and earnings fall back to
  Yahoo's numbers if Yahoo has them, otherwise `N/A`. Either way a single
  failure never breaks the row or the table.
- If the whole fetch to Yahoo or Google fails outright (network issue), the
  backend keeps serving the last good cached data instead of crashing, and
  logs the error.
- If the websocket disconnects, the frontend shows a message and retries the
  connection every 3 seconds on its own, recovering automatically once the
  backend is back.
- The backend guards against overlapping refresh cycles if one happens to
  run longer than the 20 second interval.

## Security

No API key is required anywhere in this project, neither Yahoo's unofficial
quote endpoint nor Google's quote page needs one, so there's nothing to hide
on the client side.

## Known limitations

- CMP reflects Yahoo's last traded price. Outside market hours this is the
  previous close, not a "live" price, same as it would be on Yahoo's own
  site.
- Portfolio % is calculated against total investment (purchase cost), not
  current present value, matching how it was set up in the original excel
  sheet.
- LTIMindtree has no data on either Yahoo or Google right now, so it shows
  `N/A` across the board. Savani Financials is similar except Google does
  have its EPS.
- Scraping Google Finance's HTML means this can break if Google changes
  their page's class names. The Yahoo-based fallback for P/E/earnings
  softens that risk but doesn't remove it.
