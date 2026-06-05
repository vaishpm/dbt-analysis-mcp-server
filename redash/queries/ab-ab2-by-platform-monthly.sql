-- Monthly Active Buyers (AB) vs AB2 by platform
-- Source: metrics_layer.active_buyers (data from 2024-11-01)
SELECT
    DATE_TRUNC('month', date)::date AS month,
    platform,
    COUNT(DISTINCT buyer_id) AS ab,
    COUNT(DISTINCT CASE WHEN is_ab2 = true THEN buyer_id END) AS ab2,
    ROUND(
        100.0 * COUNT(DISTINCT CASE WHEN is_ab2 = true THEN buyer_id END)
        / NULLIF(COUNT(DISTINCT buyer_id), 0),
        1
    ) AS ab2_rate_pct
FROM metrics_layer.active_buyers
WHERE date >= '2024-11-01'
GROUP BY 1, 2
ORDER BY 1, 2
