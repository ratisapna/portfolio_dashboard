# Technical Notes

## Why only Yahoo Finance, no Google Finance

The assignment originally asked for CMP from Yahoo Finance and P/E ratio plus
latest earnings from Google Finance. Google Finance has no public API and no
usable unofficial JSON endpoint either, so getting data from it would mean
scraping its web page with something like Puppeteer. That's slow, breaks the
moment Google changes their HTML, and is against their terms of use.

Instead I used the `yahoo-finance2` npm package, which wraps Yahoo's
unofficial quote endpoint. A single quote lookup for a stock already returns
`regularMarketPrice` (CMP), `trailingPE` (P/E ratio) and
`epsTrailingTwelveMonths` (latest earnings) together. So all three numbers
the assignment needs come from one source and one call per stock, and Google
Finance isn't used at all.

## Matching stocks to tickers

The holdings in the given excel sheet were listed with either an NSE symbol
(like `HDFCBANK`) or a bare BSE numeric code (like `532174`). I tried using
the BSE codes directly with a `.BO` suffix but Yahoo didn't return data for
most of them, so for every BSE-coded stock I looked up the company's actual
NSE ticker using Yahoo's search endpoint and used that instead (all of these
companies are listed on NSE too).

Two stocks could not be found on Yahoo at all under any symbol: Savani
Financials and LTIMindtree. These are kept in the portfolio data with
`sym: null`, and the backend skips fetching a quote for them. The dashboard
shows `N/A` for their CMP, present value, gain/loss, P/E and earnings instead
of crashing or hiding the row. This is a real example of the "data may be
inaccurate or unavailable" problem the assignment warns about with unofficial
APIs.

## Caching and rate limiting

All 26 symbols are fetched in a single batched call (`yahooFinance.quote([...])`)
instead of one call per stock, so one refresh cycle is one request to Yahoo,
not 26. The backend also keeps the last fetched result in memory for 15
seconds. If a REST request comes in while that cache is still fresh, it's
served straight from memory instead of hitting Yahoo again. This keeps the
dashboard well under any reasonable rate limit even with multiple browser
tabs open.

## Real-time updates: websockets over polling

The assignment allows a simple `setInterval` poll, but also mentions
websockets as a more efficient option, so that's what I used. The backend
refreshes the data from Yahoo every 15 seconds and pushes the result to every
connected client over a websocket. The frontend just listens for messages
instead of asking for data on a timer itself. This also means opening the
dashboard in several tabs doesn't multiply the number of calls to Yahoo, they
all share the same 15 second server-side refresh.

The frontend also does one plain REST fetch to `/api/portfolio` on page load,
so the table has something to show immediately instead of waiting for the
first websocket push.

## Error handling

- If Yahoo fails for a particular stock, that stock shows `N/A` instead of
  breaking the row or the whole table.
- If the whole fetch to Yahoo fails (network issue), the backend keeps
  serving the last good cached data instead of crashing, and logs the error.
- If the websocket disconnects, the frontend shows a message and retries the
  connection every 3 seconds on its own, recovering automatically once the
  backend is back.
- The backend also guards against overlapping refresh cycles if a single
  Yahoo call happens to take longer than 15 seconds.

## Security

No API key is required anywhere in this project since Yahoo's unofficial
quote endpoint doesn't need one, so there's nothing to hide on the client
side.

## Known limitations

- CMP reflects Yahoo's last traded price. Outside market hours this is the
  previous close, not a "live" price, same as it would be on Yahoo's own
  site.
- Portfolio % is calculated against total investment (purchase cost), not
  current present value, matching how it was set up in the original excel
  sheet.
- Two holdings (Savani Financials, LTIMindtree) have no live data available
  from Yahoo, see above.
