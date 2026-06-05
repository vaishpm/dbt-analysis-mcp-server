-- Latest complete month: AB vs AB2 by platform (for bar chart and KPIs)
WITH latest_month AS (
    SELECT DATE_TRUNC('month', MAX(date))::date AS month
    FROM metrics_layer.active_buyers
    WHERE date >= '2024-11-01'
)
SELECT
    platform,
    COUNT(DISTINCT buyer_id) AS ab,
    COUNT(DISTINCT CASE WHEN is_ab2 = true THEN buyer_id END) AS ab2,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN is_ab2 = true THEN buyer_id END)
        / NULLIF(COUNT(DISTINCT buyer_id), 0),
        1
    ) AS ab2_rate_pct
FROM metrics_layer.active_buyers
WHERE DATE_TRUNC('month', date) = (SELECT month FROM latest_month)
GROUP BY 1
ORDER BY 1
