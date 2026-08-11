# Centripetal Excel Recipe (v2)

One custom function, `CentGet`, that pulls a single Centripetal number into Excel or
Power BI. Paste it once per workbook; call it as many times as you like.

## 1. Add the function

Excel: **Data → Get Data → Launch Power Query Editor → Home → New Source → Other Sources → Blank Query**,
then **Home → Advanced Editor**. Replace everything in the editor with the code below and click **Done**.
Rename the query to `CentGet` in the Queries pane.

```m
let
    CentGet = (entity as text, measure as text, optional period as nullable text) as any =>
        let
            AccessKey = "<YOUR-ACCESS-KEY>",

            Body = Json.FromValue(
                [
                    key     = AccessKey,
                    entity  = entity,
                    measure = measure,
                    period  = period
                ]
            ),

            Response = Web.Contents(
                "https://api.centripetal-ai.com/v1/get",
                [
                    Headers = [ #"Content-Type" = "application/json" ],
                    Content = Body
                ]
            ),

            Result = Json.Document(Response)
        in
            Result
in
    CentGet
```

Replace `<YOUR-ACCESS-KEY>` with the access key you were issued. The key is the only
thing that decides what you can see, so treat the workbook as you would the key.

Because `Content` is supplied, `Web.Contents` issues a **POST**. `Content-Type` is the
only header the call needs — no other headers, no authentication header, nothing else
to configure. When Power Query asks about credentials for the URL, choose **Anonymous**.

## 2. Call it

```m
// Invoke from another blank query
CentGet("DEAL-1042", "STILL_OWED")

// With a period
CentGet("DEAL-1042", "RENT_EXPENSE", "Jun-2026")
```

## 3. Measures

| Measure | What `entity` is | Period |
|---|---|---|
| `STATEMENT_GAP` | statement reference | not used |
| `CAM_OVERBILLED` | lease code | not used |
| `STILL_OWED` | `DEAL` or `PARTNER` identifier | not used |
| any line-item actual | deal code | required, e.g. `Jun-2026` |

For a line-item actual, `measure` is the line item's own name and `period` is a month
in `Mon-YYYY` form (`Jun-2026`).

## 4. Notes

- `period` is optional. Omit it for the three named measures above; it is sent as null.
- Errors come back as JSON with the HTTP status the request earned — a rejected key or
  an entity you are not entitled to see returns the refusal, not a blank cell.
- Refresh the query (**Data → Refresh All**) to re-pull the numbers.
