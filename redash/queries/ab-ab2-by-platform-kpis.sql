-- Latest month KPI counters: one row with AB/AB2 per platform
WITH latest_month AS (
    SELECT DATE_TRUNC('month', MAX(date))::date AS month
    FROM metrics_layer.active_buyers
    WHERE date >= '2024-11-01'
),
by_platform AS (
    SELECT
        LOWER(platform) AS platform,
        COUNT(DISTINCT buyer_id) AS ab,
        COUNT(DISTINCT CASE WHEN is_ab2 = true THEN buyer_id END) AS ab2
    FROM metrics_layer.active_buyers
    WHERE DATE_TRUNC('month', date) = (SELECT month FROM latest_month)
    GROUP BY 1
)
SELECT
    MAX(CASE WHEN platform = 'ep' THEN ab END) AS ep_ab,
    MAX(CASE WHEN platform = 'ep' THEN ab2 END) AS ep_ab2,
    MAX(CASE WHEN platform = 'wlw' THEN ab END) AS wlw_ab,
    MAX(CASE WHEN platform = 'wlw' THEN ab2 END) AS wlw_ab2,
    SUM(ab) AS total_ab,
    SUM(ab2) AS total_ab2,
    ROUND(100.0 * SUM(ab2) / NULLIF(SUM(ab), 0), 1) AS total_ab2_rate_pct,
    (SELECT month FROM latest_month) AS month
FROM by_platform
