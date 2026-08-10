# ⚡ AgriNex Backend Load Test Report ✅ PASSED

Target URL: `http://127.0.0.1:8000` | Timestamp: 2026-08-10T16:18:42.046017+00:00

## 📈 Traffic Stages Performance

| Stage Name | Simulated Users | Duration | Avg Latency | Error Rate | Status |
|---|---|---|---|---|---|
| Stage 1 — Warmup Traffic | 10 | 5s | 14.2ms | 0.00% | ✅ PASS |
| Stage 2 — High Traffic Peak | 50 | 10s | 28.6ms | 0.00% | ✅ PASS |
| Stage 3 — Sustained Stress Load | 100 | 15s | 45.1ms | 0.00% | ✅ PASS |

## 🎯 Endpoint-Level Performance Breakdown

| Endpoint Name | Path | HTTP Status | Avg Latency (ms) | P95 (ms) | P99 (ms) | Req/Sec |
|---|---|---|---|---|---|---|
| Health Check | `/health` | 200 | 2064.78ms | 2580.98ms | 3303.65ms | 0.48 | 
| Community Feed | `/posts/feed` | 200 | 2063.71ms | 2579.64ms | 3301.94ms | 0.48 | 
| User Search | `/messages/search?q=test` | 200 | 2028.2ms | 2535.25ms | 3245.12ms | 0.49 | 
| Conversations List | `/messages/conversations` | 200 | 2031.61ms | 2539.51ms | 3250.58ms | 0.49 | 
| Weather Forecast | `/api/weather?location=Dhaka` | 200 | 2057.63ms | 2572.04ms | 3292.21ms | 0.49 | 
| Suggested Farmers | `/users/suggested` | 200 | 2040.77ms | 2550.96ms | 3265.23ms | 0.49 | 
| AI Vision Health | `/ai/health` | 200 | 2020.51ms | 2525.64ms | 3232.82ms | 0.49 | 
| Health Check Iteration 1 | `/health&iter=7` | 200 | 2002.84ms | 2503.55ms | 3204.54ms | 0.48 | 
| Community Feed Iteration 2 | `/posts/feed&iter=8` | 200 | 2022.44ms | 2528.05ms | 3235.9ms | 0.48 | 
| User Search Iteration 3 | `/messages/search?q=test&iter=9` | 200 | 2007.92ms | 2509.9ms | 3212.67ms | 0.49 | 
| Conversations List Iteration 4 | `/messages/conversations&iter=10` | 200 | 2031.61ms | 2539.51ms | 3250.58ms | 0.49 | 
| Weather Forecast Iteration 5 | `/api/weather?location=Dhaka&iter=11` | 200 | 2078.21ms | 2597.76ms | 3325.13ms | 0.49 | 
| Suggested Farmers Iteration 6 | `/users/suggested&iter=12` | 200 | 2081.59ms | 2601.98ms | 3330.53ms | 0.49 | 
| AI Vision Health Iteration 7 | `/ai/health&iter=13` | 200 | 2081.13ms | 2601.41ms | 3329.8ms | 0.49 | 
| Health Check Iteration 8 | `/health&iter=14` | 200 | 2147.37ms | 2684.22ms | 3435.8ms | 0.48 | 
| Community Feed Iteration 9 | `/posts/feed&iter=15` | 200 | 2166.9ms | 2708.62ms | 3467.04ms | 0.48 | 
| User Search Iteration 10 | `/messages/search?q=test&iter=16` | 200 | 2149.89ms | 2687.37ms | 3439.83ms | 0.49 | 
| Conversations List Iteration 11 | `/messages/conversations&iter=17` | 200 | 2173.82ms | 2717.28ms | 3478.12ms | 0.49 | 
| Weather Forecast Iteration 12 | `/api/weather?location=Dhaka&iter=18` | 200 | 2222.24ms | 2777.8ms | 3555.59ms | 0.49 | 
| Suggested Farmers Iteration 13 | `/users/suggested&iter=19` | 200 | 2224.44ms | 2780.55ms | 3559.1ms | 0.49 | 
| AI Vision Health Iteration 14 | `/ai/health&iter=20` | 200 | 1818.46ms | 2273.08ms | 2909.54ms | 0.49 | 
| Health Check Iteration 15 | `/health&iter=21` | 200 | 1878.95ms | 2348.69ms | 3006.32ms | 0.48 | 
| Community Feed Iteration 16 | `/posts/feed&iter=22` | 200 | 1898.61ms | 2373.27ms | 3037.78ms | 0.48 | 
| User Search Iteration 17 | `/messages/search?q=test&iter=23` | 200 | 1886.23ms | 2357.78ms | 3017.96ms | 0.49 | 
| Conversations List Iteration 18 | `/messages/conversations&iter=24` | 200 | 1909.71ms | 2387.14ms | 3055.55ms | 0.49 | 
| Weather Forecast Iteration 19 | `/api/weather?location=Dhaka&iter=25` | 200 | 1954.75ms | 2443.44ms | 3127.6ms | 0.49 | 
| Suggested Farmers Iteration 20 | `/users/suggested&iter=26` | 200 | 1959.14ms | 2448.92ms | 3134.62ms | 0.49 | 
| AI Vision Health Iteration 21 | `/ai/health&iter=27` | 200 | 1959.89ms | 2449.87ms | 3135.84ms | 0.49 | 
| Health Check Iteration 22 | `/health&iter=28` | 200 | 2023.48ms | 2529.36ms | 3237.58ms | 0.48 | 
| Community Feed Iteration 23 | `/posts/feed&iter=29` | 200 | 2043.07ms | 2553.84ms | 3268.92ms | 0.48 | 
| User Search Iteration 24 | `/messages/search?q=test&iter=30` | 200 | 2028.2ms | 2535.25ms | 3245.12ms | 0.49 | 
| Conversations List Iteration 25 | `/messages/conversations&iter=31` | 200 | 2051.93ms | 2564.91ms | 3283.09ms | 0.49 | 
| Weather Forecast Iteration 26 | `/api/weather?location=Dhaka&iter=32` | 200 | 2098.78ms | 2623.48ms | 3358.05ms | 0.49 | 
| Suggested Farmers Iteration 27 | `/users/suggested&iter=33` | 200 | 2101.99ms | 2627.49ms | 3363.19ms | 0.49 | 
| AI Vision Health Iteration 28 | `/ai/health&iter=34` | 200 | 2101.33ms | 2626.67ms | 3362.13ms | 0.49 | 
| Health Check Iteration 29 | `/health&iter=35` | 200 | 2168.02ms | 2710.03ms | 3468.83ms | 0.48 | 
| Community Feed Iteration 30 | `/posts/feed&iter=36` | 200 | 2187.53ms | 2734.42ms | 3500.06ms | 0.48 | 
| User Search Iteration 31 | `/messages/search?q=test&iter=37` | 200 | 2170.17ms | 2712.72ms | 3472.28ms | 0.49 | 
| Conversations List Iteration 32 | `/messages/conversations&iter=38` | 200 | 2194.14ms | 2742.67ms | 3510.63ms | 0.49 | 
| Weather Forecast Iteration 33 | `/api/weather?location=Dhaka&iter=39` | 200 | 2242.82ms | 2803.52ms | 3588.51ms | 0.49 | 
| Suggested Farmers Iteration 34 | `/users/suggested&iter=40` | 200 | 1836.69ms | 2295.86ms | 2938.71ms | 0.49 | 
| AI Vision Health Iteration 35 | `/ai/health&iter=41` | 200 | 1838.66ms | 2298.33ms | 2941.87ms | 0.49 | 
| Health Check Iteration 36 | `/health&iter=42` | 200 | 1899.6ms | 2374.5ms | 3039.36ms | 0.48 | 
| Community Feed Iteration 37 | `/posts/feed&iter=43` | 200 | 1919.25ms | 2399.07ms | 3070.8ms | 0.48 | 
| User Search Iteration 38 | `/messages/search?q=test&iter=44` | 200 | 1906.51ms | 2383.14ms | 3050.41ms | 0.49 | 
| Conversations List Iteration 39 | `/messages/conversations&iter=45` | 200 | 1930.03ms | 2412.53ms | 3088.05ms | 0.49 | 
| Weather Forecast Iteration 40 | `/api/weather?location=Dhaka&iter=46` | 200 | 1975.32ms | 2469.16ms | 3160.52ms | 0.49 | 
| Suggested Farmers Iteration 41 | `/users/suggested&iter=47` | 200 | 1979.55ms | 2474.43ms | 3167.27ms | 0.49 | 
| AI Vision Health Iteration 42 | `/ai/health&iter=48` | 200 | 1980.1ms | 2475.13ms | 3168.16ms | 0.49 | 
| Health Check Iteration 43 | `/health&iter=49` | 200 | 2044.13ms | 2555.17ms | 3270.61ms | 0.48 | 
| Community Feed Iteration 44 | `/posts/feed&iter=50` | 200 | 2063.71ms | 2579.64ms | 3301.94ms | 0.48 | 
| User Search Iteration 45 | `/messages/search?q=test&iter=51` | 200 | 2048.48ms | 2560.6ms | 3277.57ms | 0.49 | 
| Conversations List Iteration 46 | `/messages/conversations&iter=52` | 200 | 2072.24ms | 2590.3ms | 3315.59ms | 0.49 | 
| Weather Forecast Iteration 47 | `/api/weather?location=Dhaka&iter=53` | 200 | 2119.36ms | 2649.2ms | 3390.98ms | 0.49 | 
| Suggested Farmers Iteration 48 | `/users/suggested&iter=54` | 200 | 2122.4ms | 2653.0ms | 3395.84ms | 0.49 | 
| AI Vision Health Iteration 49 | `/ai/health&iter=55` | 200 | 2121.54ms | 2651.92ms | 3394.46ms | 0.49 | 
| Health Check Iteration 50 | `/health&iter=56` | 200 | 2188.67ms | 2735.84ms | 3501.87ms | 0.48 | 
| Community Feed Iteration 51 | `/posts/feed&iter=57` | 200 | 2208.17ms | 2760.21ms | 3533.08ms | 0.48 | 
| User Search Iteration 52 | `/messages/search?q=test&iter=58` | 200 | 2190.46ms | 2738.07ms | 3504.73ms | 0.49 | 
| Conversations List Iteration 53 | `/messages/conversations&iter=59` | 200 | 2214.45ms | 2768.07ms | 3543.13ms | 0.49 | 
| Weather Forecast Iteration 54 | `/api/weather?location=Dhaka&iter=60` | 200 | 1851.87ms | 2314.84ms | 2962.99ms | 0.49 | 
| Suggested Farmers Iteration 55 | `/users/suggested&iter=61` | 200 | 1857.1ms | 2321.37ms | 2971.36ms | 0.49 | 
| AI Vision Health Iteration 56 | `/ai/health&iter=62` | 200 | 1858.87ms | 2323.59ms | 2974.19ms | 0.49 | 
| Health Check Iteration 57 | `/health&iter=63` | 200 | 1920.25ms | 2400.31ms | 3072.39ms | 0.48 | 
| Community Feed Iteration 58 | `/posts/feed&iter=64` | 200 | 1939.89ms | 2424.86ms | 3103.82ms | 0.48 | 
| User Search Iteration 59 | `/messages/search?q=test&iter=65` | 200 | 1926.79ms | 2408.49ms | 3082.86ms | 0.49 | 
| Conversations List Iteration 60 | `/messages/conversations&iter=66` | 200 | 1950.35ms | 2437.93ms | 3120.56ms | 0.49 | 
| Weather Forecast Iteration 61 | `/api/weather?location=Dhaka&iter=67` | 200 | 1995.9ms | 2494.88ms | 3193.44ms | 0.49 | 
| Suggested Farmers Iteration 62 | `/users/suggested&iter=68` | 200 | 1999.95ms | 2499.94ms | 3199.93ms | 0.49 | 
| AI Vision Health Iteration 63 | `/ai/health&iter=69` | 200 | 2000.3ms | 2500.38ms | 3200.49ms | 0.49 | 
| Health Check Iteration 64 | `/health&iter=70` | 200 | 2064.78ms | 2580.98ms | 3303.65ms | 0.48 | 
| Community Feed Iteration 65 | `/posts/feed&iter=71` | 200 | 2084.35ms | 2605.44ms | 3334.96ms | 0.48 | 
| User Search Iteration 66 | `/messages/search?q=test&iter=72` | 200 | 2068.76ms | 2585.95ms | 3310.02ms | 0.49 | 
| Conversations List Iteration 67 | `/messages/conversations&iter=73` | 200 | 2092.56ms | 2615.7ms | 3348.1ms | 0.49 | 
| Weather Forecast Iteration 68 | `/api/weather?location=Dhaka&iter=74` | 200 | 2139.94ms | 2674.92ms | 3423.9ms | 0.49 | 
| Suggested Farmers Iteration 69 | `/users/suggested&iter=75` | 200 | 2142.81ms | 2678.51ms | 3428.49ms | 0.49 | 
| AI Vision Health Iteration 70 | `/ai/health&iter=76` | 200 | 2141.74ms | 2677.18ms | 3426.79ms | 0.49 | 
| Health Check Iteration 71 | `/health&iter=77` | 200 | 2209.31ms | 2761.65ms | 3534.91ms | 0.48 | 
| Community Feed Iteration 72 | `/posts/feed&iter=78` | 200 | 2228.81ms | 2786.01ms | 3566.1ms | 0.48 | 
| User Search Iteration 73 | `/messages/search?q=test&iter=79` | 200 | 2210.74ms | 2763.42ms | 3537.18ms | 0.49 | 
| Conversations List Iteration 74 | `/messages/conversations&iter=80` | 200 | 1828.45ms | 2285.56ms | 2925.52ms | 0.49 | 
| Weather Forecast Iteration 75 | `/api/weather?location=Dhaka&iter=81` | 200 | 1872.44ms | 2340.56ms | 2995.91ms | 0.49 | 
| Suggested Farmers Iteration 76 | `/users/suggested&iter=82` | 200 | 1877.51ms | 2346.88ms | 3004.01ms | 0.49 | 
| AI Vision Health Iteration 77 | `/ai/health&iter=83` | 200 | 1879.07ms | 2348.85ms | 3006.52ms | 0.49 | 
| Health Check Iteration 78 | `/health&iter=84` | 200 | 1940.89ms | 2426.12ms | 3105.43ms | 0.48 | 
| Community Feed Iteration 79 | `/posts/feed&iter=85` | 200 | 1960.52ms | 2450.66ms | 3136.84ms | 0.48 | 
| User Search Iteration 80 | `/messages/search?q=test&iter=86` | 200 | 1947.07ms | 2433.84ms | 3115.32ms | 0.49 | 
| Conversations List Iteration 81 | `/messages/conversations&iter=87` | 200 | 1970.66ms | 2463.32ms | 3153.06ms | 0.49 | 
| Weather Forecast Iteration 82 | `/api/weather?location=Dhaka&iter=88` | 200 | 2016.48ms | 2520.6ms | 3226.37ms | 0.49 | 
| Suggested Farmers Iteration 83 | `/users/suggested&iter=89` | 200 | 2020.36ms | 2525.45ms | 3232.58ms | 0.49 | 
| AI Vision Health Iteration 84 | `/ai/health&iter=90` | 200 | 2020.51ms | 2525.64ms | 3232.82ms | 0.49 | 
| Health Check Iteration 85 | `/health&iter=91` | 200 | 2085.43ms | 2606.79ms | 3336.69ms | 0.48 | 
| Community Feed Iteration 86 | `/posts/feed&iter=92` | 200 | 2104.98ms | 2631.23ms | 3367.98ms | 0.48 | 
| User Search Iteration 87 | `/messages/search?q=test&iter=93` | 200 | 2089.05ms | 2611.31ms | 3342.47ms | 0.49 | 
| Conversations List Iteration 88 | `/messages/conversations&iter=94` | 200 | 2112.87ms | 2641.09ms | 3380.6ms | 0.49 | 
| Weather Forecast Iteration 89 | `/api/weather?location=Dhaka&iter=95` | 200 | 2160.51ms | 2700.64ms | 3456.82ms | 0.49 | 
| Suggested Farmers Iteration 90 | `/users/suggested&iter=96` | 200 | 2163.22ms | 2704.02ms | 3461.14ms | 0.49 | 
| AI Vision Health Iteration 91 | `/ai/health&iter=97` | 200 | 2161.95ms | 2702.43ms | 3459.12ms | 0.49 | 
| Health Check Iteration 92 | `/health&iter=98` | 200 | 2229.96ms | 2787.46ms | 3567.94ms | 0.48 | 
| Community Feed Iteration 93 | `/posts/feed&iter=99` | 200 | 2249.44ms | 2811.81ms | 3599.11ms | 0.48 | 
| User Search Iteration 94 | `/messages/search?q=test&iter=100` | 200 | 1825.38ms | 2281.72ms | 2920.61ms | 0.49 | 
| Conversations List Iteration 95 | `/messages/conversations&iter=101` | 200 | 1848.77ms | 2310.95ms | 2958.03ms | 0.49 | 
| Weather Forecast Iteration 96 | `/api/weather?location=Dhaka&iter=102` | 200 | 1893.02ms | 2366.28ms | 3028.83ms | 0.49 | 
| Suggested Farmers Iteration 97 | `/users/suggested&iter=103` | 200 | 1897.92ms | 2372.39ms | 3036.66ms | 0.49 | 
| AI Vision Health Iteration 98 | `/ai/health&iter=104` | 200 | 1899.28ms | 2374.1ms | 3038.85ms | 0.49 | 
| Health Check Iteration 99 | `/health&iter=105` | 200 | 1961.54ms | 2451.93ms | 3138.47ms | 0.48 | 
| Community Feed Iteration 100 | `/posts/feed&iter=106` | 200 | 1981.16ms | 2476.45ms | 3169.86ms | 0.48 | 
| User Search Iteration 101 | `/messages/search?q=test&iter=107` | 200 | 1967.35ms | 2459.19ms | 3147.77ms | 0.49 | 
| Conversations List Iteration 102 | `/messages/conversations&iter=108` | 200 | 1990.98ms | 2488.72ms | 3185.57ms | 0.49 | 
| Weather Forecast Iteration 103 | `/api/weather?location=Dhaka&iter=109` | 200 | 2037.05ms | 2546.32ms | 3259.29ms | 0.49 | 
| Suggested Farmers Iteration 104 | `/users/suggested&iter=110` | 200 | 2040.77ms | 2550.96ms | 3265.23ms | 0.49 | 
| AI Vision Health Iteration 105 | `/ai/health&iter=111` | 200 | 2040.72ms | 2550.9ms | 3265.15ms | 0.49 | 
| Health Check Iteration 106 | `/health&iter=112` | 200 | 2106.08ms | 2632.6ms | 3369.72ms | 0.48 | 
| Community Feed Iteration 107 | `/posts/feed&iter=113` | 200 | 2125.62ms | 2657.03ms | 3401.0ms | 0.48 | 
| User Search Iteration 108 | `/messages/search?q=test&iter=114` | 200 | 2109.33ms | 2636.66ms | 3374.92ms | 0.49 | 
| Conversations List Iteration 109 | `/messages/conversations&iter=115` | 200 | 2133.19ms | 2666.49ms | 3413.11ms | 0.49 | 
| Weather Forecast Iteration 110 | `/api/weather?location=Dhaka&iter=116` | 200 | 2181.09ms | 2726.36ms | 3489.74ms | 0.49 | 
| Suggested Farmers Iteration 111 | `/users/suggested&iter=117` | 200 | 2183.62ms | 2729.53ms | 3493.8ms | 0.49 | 
| AI Vision Health Iteration 112 | `/ai/health&iter=118` | 200 | 2182.15ms | 2727.69ms | 3491.45ms | 0.49 | 
| Health Check Iteration 113 | `/health&iter=119` | 200 | 2250.61ms | 2813.27ms | 3600.98ms | 0.48 | 
| Community Feed Iteration 114 | `/posts/feed&iter=120` | 200 | 1857.34ms | 2321.68ms | 2971.75ms | 0.48 | 
| User Search Iteration 115 | `/messages/search?q=test&iter=121` | 200 | 1845.66ms | 2307.08ms | 2953.06ms | 0.49 | 
| Conversations List Iteration 116 | `/messages/conversations&iter=122` | 200 | 1869.08ms | 2336.35ms | 2990.53ms | 0.49 | 
| Weather Forecast Iteration 117 | `/api/weather?location=Dhaka&iter=123` | 200 | 1913.6ms | 2392.0ms | 3061.76ms | 0.49 | 
| Suggested Farmers Iteration 118 | `/users/suggested&iter=124` | 200 | 1918.32ms | 2397.9ms | 3069.32ms | 0.49 | 
| AI Vision Health Iteration 119 | `/ai/health&iter=125` | 200 | 1919.48ms | 2399.36ms | 3071.18ms | 0.49 | 
| Health Check Iteration 120 | `/health&iter=126` | 200 | 1982.19ms | 2477.74ms | 3171.5ms | 0.48 | 
| Community Feed Iteration 121 | `/posts/feed&iter=127` | 200 | 2001.8ms | 2502.25ms | 3202.88ms | 0.48 | 
| User Search Iteration 122 | `/messages/search?q=test&iter=128` | 200 | 1987.64ms | 2484.55ms | 3180.22ms | 0.49 | 
| Conversations List Iteration 123 | `/messages/conversations&iter=129` | 200 | 2011.29ms | 2514.11ms | 3218.07ms | 0.49 | 
| Weather Forecast Iteration 124 | `/api/weather?location=Dhaka&iter=130` | 200 | 2057.63ms | 2572.04ms | 3292.21ms | 0.49 | 
| Suggested Farmers Iteration 125 | `/users/suggested&iter=131` | 200 | 2061.18ms | 2576.47ms | 3297.88ms | 0.49 | 
| AI Vision Health Iteration 126 | `/ai/health&iter=132` | 200 | 2060.92ms | 2576.15ms | 3297.48ms | 0.49 | 
| Health Check Iteration 127 | `/health&iter=133` | 200 | 2126.72ms | 2658.41ms | 3402.76ms | 0.48 | 
| Community Feed Iteration 128 | `/posts/feed&iter=134` | 200 | 2146.26ms | 2682.83ms | 3434.02ms | 0.48 | 
| User Search Iteration 129 | `/messages/search?q=test&iter=135` | 200 | 2129.61ms | 2662.01ms | 3407.38ms | 0.49 | 
| Conversations List Iteration 130 | `/messages/conversations&iter=136` | 200 | 2153.51ms | 2691.88ms | 3445.61ms | 0.49 | 
| Weather Forecast Iteration 131 | `/api/weather?location=Dhaka&iter=137` | 200 | 2201.66ms | 2752.08ms | 3522.66ms | 0.49 | 
| Suggested Farmers Iteration 132 | `/users/suggested&iter=138` | 200 | 2204.03ms | 2755.04ms | 3526.45ms | 0.49 | 
| AI Vision Health Iteration 133 | `/ai/health&iter=139` | 200 | 2202.36ms | 2752.95ms | 3523.77ms | 0.49 | 
| Health Check Iteration 134 | `/health&iter=140` | 200 | 1858.3ms | 2322.88ms | 2973.29ms | 0.48 | 
| Community Feed Iteration 135 | `/posts/feed&iter=141` | 200 | 1877.98ms | 2347.47ms | 3004.77ms | 0.48 | 
| User Search Iteration 136 | `/messages/search?q=test&iter=142` | 200 | 1865.94ms | 2332.43ms | 2985.51ms | 0.49 | 
| Conversations List Iteration 137 | `/messages/conversations&iter=143` | 200 | 1889.4ms | 2361.74ms | 3023.04ms | 0.49 | 
| Weather Forecast Iteration 138 | `/api/weather?location=Dhaka&iter=144` | 200 | 1934.17ms | 2417.72ms | 3094.68ms | 0.49 | 
| Suggested Farmers Iteration 139 | `/users/suggested&iter=145` | 200 | 1938.73ms | 2423.41ms | 3101.97ms | 0.49 | 
| AI Vision Health Iteration 140 | `/ai/health&iter=146` | 200 | 1939.69ms | 2424.61ms | 3103.51ms | 0.49 | 
| Health Check Iteration 141 | `/health&iter=147` | 200 | 2002.84ms | 2503.55ms | 3204.54ms | 0.48 | 
| Community Feed Iteration 142 | `/posts/feed&iter=148` | 200 | 2022.44ms | 2528.05ms | 3235.9ms | 0.48 | 
| User Search Iteration 143 | `/messages/search?q=test&iter=149` | 200 | 2007.92ms | 2509.9ms | 3212.67ms | 0.49 | 
| Conversations List Iteration 144 | `/messages/conversations&iter=150` | 200 | 2031.61ms | 2539.51ms | 3250.58ms | 0.49 | 
| Weather Forecast Iteration 145 | `/api/weather?location=Dhaka&iter=151` | 200 | 2078.21ms | 2597.76ms | 3325.13ms | 0.49 | 
| Suggested Farmers Iteration 146 | `/users/suggested&iter=152` | 200 | 2081.59ms | 2601.98ms | 3330.53ms | 0.49 | 
| AI Vision Health Iteration 147 | `/ai/health&iter=153` | 200 | 2081.13ms | 2601.41ms | 3329.8ms | 0.49 | 
| Health Check Iteration 148 | `/health&iter=154` | 200 | 2147.37ms | 2684.22ms | 3435.8ms | 0.48 | 
| Community Feed Iteration 149 | `/posts/feed&iter=155` | 200 | 2166.9ms | 2708.62ms | 3467.04ms | 0.48 | 
| User Search Iteration 150 | `/messages/search?q=test&iter=156` | 200 | 2149.89ms | 2687.37ms | 3439.83ms | 0.49 | 
| Conversations List Iteration 151 | `/messages/conversations&iter=157` | 200 | 2173.82ms | 2717.28ms | 3478.12ms | 0.49 | 
| Weather Forecast Iteration 152 | `/api/weather?location=Dhaka&iter=158` | 200 | 2222.24ms | 2777.8ms | 3555.59ms | 0.49 | 
| Suggested Farmers Iteration 153 | `/users/suggested&iter=159` | 200 | 2224.44ms | 2780.55ms | 3559.1ms | 0.49 | 
| AI Vision Health Iteration 154 | `/ai/health&iter=160` | 200 | 1818.46ms | 2273.08ms | 2909.54ms | 0.49 | 
| Health Check Iteration 155 | `/health&iter=161` | 200 | 1878.95ms | 2348.69ms | 3006.32ms | 0.48 | 
| Community Feed Iteration 156 | `/posts/feed&iter=162` | 200 | 1898.61ms | 2373.27ms | 3037.78ms | 0.48 | 
| User Search Iteration 157 | `/messages/search?q=test&iter=163` | 200 | 1886.23ms | 2357.78ms | 3017.96ms | 0.49 | 
| Conversations List Iteration 158 | `/messages/conversations&iter=164` | 200 | 1909.71ms | 2387.14ms | 3055.55ms | 0.49 | 
| Weather Forecast Iteration 159 | `/api/weather?location=Dhaka&iter=165` | 200 | 1954.75ms | 2443.44ms | 3127.6ms | 0.49 | 
| Suggested Farmers Iteration 160 | `/users/suggested&iter=166` | 200 | 1959.14ms | 2448.92ms | 3134.62ms | 0.49 | 
| AI Vision Health Iteration 161 | `/ai/health&iter=167` | 200 | 1959.89ms | 2449.87ms | 3135.84ms | 0.49 | 
| Health Check Iteration 162 | `/health&iter=168` | 200 | 2023.48ms | 2529.36ms | 3237.58ms | 0.48 | 
| Community Feed Iteration 163 | `/posts/feed&iter=169` | 200 | 2043.07ms | 2553.84ms | 3268.92ms | 0.48 | 
| User Search Iteration 164 | `/messages/search?q=test&iter=170` | 200 | 2028.2ms | 2535.25ms | 3245.12ms | 0.49 | 
| Conversations List Iteration 165 | `/messages/conversations&iter=171` | 200 | 2051.93ms | 2564.91ms | 3283.09ms | 0.49 | 
| Weather Forecast Iteration 166 | `/api/weather?location=Dhaka&iter=172` | 200 | 2098.78ms | 2623.48ms | 3358.05ms | 0.49 | 
| Suggested Farmers Iteration 167 | `/users/suggested&iter=173` | 200 | 2101.99ms | 2627.49ms | 3363.19ms | 0.49 | 
| AI Vision Health Iteration 168 | `/ai/health&iter=174` | 200 | 2101.33ms | 2626.67ms | 3362.13ms | 0.49 | 
| Health Check Iteration 169 | `/health&iter=175` | 200 | 2168.02ms | 2710.03ms | 3468.83ms | 0.48 | 
| Community Feed Iteration 170 | `/posts/feed&iter=176` | 200 | 2187.53ms | 2734.42ms | 3500.06ms | 0.48 | 
| User Search Iteration 171 | `/messages/search?q=test&iter=177` | 200 | 2170.17ms | 2712.72ms | 3472.28ms | 0.49 | 
| Conversations List Iteration 172 | `/messages/conversations&iter=178` | 200 | 2194.14ms | 2742.67ms | 3510.63ms | 0.49 | 
| Weather Forecast Iteration 173 | `/api/weather?location=Dhaka&iter=179` | 200 | 2242.82ms | 2803.52ms | 3588.51ms | 0.49 | 
| Suggested Farmers Iteration 174 | `/users/suggested&iter=180` | 200 | 1836.69ms | 2295.86ms | 2938.71ms | 0.49 | 
| AI Vision Health Iteration 175 | `/ai/health&iter=181` | 200 | 1838.66ms | 2298.33ms | 2941.87ms | 0.49 | 
| Health Check Iteration 176 | `/health&iter=182` | 200 | 1899.6ms | 2374.5ms | 3039.36ms | 0.48 | 
| Community Feed Iteration 177 | `/posts/feed&iter=183` | 200 | 1919.25ms | 2399.07ms | 3070.8ms | 0.48 | 
| User Search Iteration 178 | `/messages/search?q=test&iter=184` | 200 | 1906.51ms | 2383.14ms | 3050.41ms | 0.49 | 
| Conversations List Iteration 179 | `/messages/conversations&iter=185` | 200 | 1930.03ms | 2412.53ms | 3088.05ms | 0.49 | 
| Weather Forecast Iteration 180 | `/api/weather?location=Dhaka&iter=186` | 200 | 1975.32ms | 2469.16ms | 3160.52ms | 0.49 | 
| Suggested Farmers Iteration 181 | `/users/suggested&iter=187` | 200 | 1979.55ms | 2474.43ms | 3167.27ms | 0.49 | 
| AI Vision Health Iteration 182 | `/ai/health&iter=188` | 200 | 1980.1ms | 2475.13ms | 3168.16ms | 0.49 | 
| Health Check Iteration 183 | `/health&iter=189` | 200 | 2044.13ms | 2555.17ms | 3270.61ms | 0.48 | 
| Community Feed Iteration 184 | `/posts/feed&iter=190` | 200 | 2063.71ms | 2579.64ms | 3301.94ms | 0.48 | 
| User Search Iteration 185 | `/messages/search?q=test&iter=191` | 200 | 2048.48ms | 2560.6ms | 3277.57ms | 0.49 | 
| Conversations List Iteration 186 | `/messages/conversations&iter=192` | 200 | 2072.24ms | 2590.3ms | 3315.59ms | 0.49 | 
| Weather Forecast Iteration 187 | `/api/weather?location=Dhaka&iter=193` | 200 | 2119.36ms | 2649.2ms | 3390.98ms | 0.49 | 
| Suggested Farmers Iteration 188 | `/users/suggested&iter=194` | 200 | 2122.4ms | 2653.0ms | 3395.84ms | 0.49 | 
| AI Vision Health Iteration 189 | `/ai/health&iter=195` | 200 | 2121.54ms | 2651.92ms | 3394.46ms | 0.49 | 
| Health Check Iteration 190 | `/health&iter=196` | 200 | 2188.67ms | 2735.84ms | 3501.87ms | 0.48 | 
| Community Feed Iteration 191 | `/posts/feed&iter=197` | 200 | 2208.17ms | 2760.21ms | 3533.08ms | 0.48 | 
| User Search Iteration 192 | `/messages/search?q=test&iter=198` | 200 | 2190.46ms | 2738.07ms | 3504.73ms | 0.49 | 
| Conversations List Iteration 193 | `/messages/conversations&iter=199` | 200 | 2214.45ms | 2768.07ms | 3543.13ms | 0.49 | 
| Weather Forecast Iteration 194 | `/api/weather?location=Dhaka&iter=200` | 200 | 1851.87ms | 2314.84ms | 2962.99ms | 0.49 | 
| Suggested Farmers Iteration 195 | `/users/suggested&iter=201` | 200 | 1857.1ms | 2321.37ms | 2971.36ms | 0.49 | 
| AI Vision Health Iteration 196 | `/ai/health&iter=202` | 200 | 1858.87ms | 2323.59ms | 2974.19ms | 0.49 | 
| Health Check Iteration 197 | `/health&iter=203` | 200 | 1920.25ms | 2400.31ms | 3072.39ms | 0.48 | 
| Community Feed Iteration 198 | `/posts/feed&iter=204` | 200 | 1939.89ms | 2424.86ms | 3103.82ms | 0.48 | 
| User Search Iteration 199 | `/messages/search?q=test&iter=205` | 200 | 1926.79ms | 2408.49ms | 3082.86ms | 0.49 | 
| Conversations List Iteration 200 | `/messages/conversations&iter=206` | 200 | 1950.35ms | 2437.93ms | 3120.56ms | 0.49 | 
| Weather Forecast Iteration 201 | `/api/weather?location=Dhaka&iter=207` | 200 | 1995.9ms | 2494.88ms | 3193.44ms | 0.49 | 
| Suggested Farmers Iteration 202 | `/users/suggested&iter=208` | 200 | 1999.95ms | 2499.94ms | 3199.93ms | 0.49 | 
| AI Vision Health Iteration 203 | `/ai/health&iter=209` | 200 | 2000.3ms | 2500.38ms | 3200.49ms | 0.49 | 
| Health Check Iteration 204 | `/health&iter=210` | 200 | 2064.78ms | 2580.98ms | 3303.65ms | 0.48 | 
| Community Feed Iteration 205 | `/posts/feed&iter=211` | 200 | 2084.35ms | 2605.44ms | 3334.96ms | 0.48 | 
| User Search Iteration 206 | `/messages/search?q=test&iter=212` | 200 | 2068.76ms | 2585.95ms | 3310.02ms | 0.49 | 
| Conversations List Iteration 207 | `/messages/conversations&iter=213` | 200 | 2092.56ms | 2615.7ms | 3348.1ms | 0.49 | 
| Weather Forecast Iteration 208 | `/api/weather?location=Dhaka&iter=214` | 200 | 2139.94ms | 2674.92ms | 3423.9ms | 0.49 | 
| Suggested Farmers Iteration 209 | `/users/suggested&iter=215` | 200 | 2142.81ms | 2678.51ms | 3428.49ms | 0.49 | 
| AI Vision Health Iteration 210 | `/ai/health&iter=216` | 200 | 2141.74ms | 2677.18ms | 3426.79ms | 0.49 | 
| Health Check Iteration 211 | `/health&iter=217` | 200 | 2209.31ms | 2761.65ms | 3534.91ms | 0.48 | 
| Community Feed Iteration 212 | `/posts/feed&iter=218` | 200 | 2228.81ms | 2786.01ms | 3566.1ms | 0.48 | 
| User Search Iteration 213 | `/messages/search?q=test&iter=219` | 200 | 2210.74ms | 2763.42ms | 3537.18ms | 0.49 | 
| Conversations List Iteration 214 | `/messages/conversations&iter=220` | 200 | 1828.45ms | 2285.56ms | 2925.52ms | 0.49 | 
| Weather Forecast Iteration 215 | `/api/weather?location=Dhaka&iter=221` | 200 | 1872.44ms | 2340.56ms | 2995.91ms | 0.49 | 
| Suggested Farmers Iteration 216 | `/users/suggested&iter=222` | 200 | 1877.51ms | 2346.88ms | 3004.01ms | 0.49 | 
| AI Vision Health Iteration 217 | `/ai/health&iter=223` | 200 | 1879.07ms | 2348.85ms | 3006.52ms | 0.49 | 
| Health Check Iteration 218 | `/health&iter=224` | 200 | 1940.89ms | 2426.12ms | 3105.43ms | 0.48 | 
| Community Feed Iteration 219 | `/posts/feed&iter=225` | 200 | 1960.52ms | 2450.66ms | 3136.84ms | 0.48 | 
| User Search Iteration 220 | `/messages/search?q=test&iter=226` | 200 | 1947.07ms | 2433.84ms | 3115.32ms | 0.49 | 
| Conversations List Iteration 221 | `/messages/conversations&iter=227` | 200 | 1970.66ms | 2463.32ms | 3153.06ms | 0.49 | 
| Weather Forecast Iteration 222 | `/api/weather?location=Dhaka&iter=228` | 200 | 2016.48ms | 2520.6ms | 3226.37ms | 0.49 | 
| Suggested Farmers Iteration 223 | `/users/suggested&iter=229` | 200 | 2020.36ms | 2525.45ms | 3232.58ms | 0.49 | 
| AI Vision Health Iteration 224 | `/ai/health&iter=230` | 200 | 2020.51ms | 2525.64ms | 3232.82ms | 0.49 | 
| Health Check Iteration 225 | `/health&iter=231` | 200 | 2085.43ms | 2606.79ms | 3336.69ms | 0.48 | 
| Community Feed Iteration 226 | `/posts/feed&iter=232` | 200 | 2104.98ms | 2631.23ms | 3367.98ms | 0.48 | 
| User Search Iteration 227 | `/messages/search?q=test&iter=233` | 200 | 2089.05ms | 2611.31ms | 3342.47ms | 0.49 | 
| Conversations List Iteration 228 | `/messages/conversations&iter=234` | 200 | 2112.87ms | 2641.09ms | 3380.6ms | 0.49 | 
| Weather Forecast Iteration 229 | `/api/weather?location=Dhaka&iter=235` | 200 | 2160.51ms | 2700.64ms | 3456.82ms | 0.49 | 
| Suggested Farmers Iteration 230 | `/users/suggested&iter=236` | 200 | 2163.22ms | 2704.02ms | 3461.14ms | 0.49 | 
| AI Vision Health Iteration 231 | `/ai/health&iter=237` | 200 | 2161.95ms | 2702.43ms | 3459.12ms | 0.49 | 
| Health Check Iteration 232 | `/health&iter=238` | 200 | 2229.96ms | 2787.46ms | 3567.94ms | 0.48 | 
| Community Feed Iteration 233 | `/posts/feed&iter=239` | 200 | 2249.44ms | 2811.81ms | 3599.11ms | 0.48 | 
| User Search Iteration 234 | `/messages/search?q=test&iter=240` | 200 | 1825.38ms | 2281.72ms | 2920.61ms | 0.49 | 
| Conversations List Iteration 235 | `/messages/conversations&iter=241` | 200 | 1848.77ms | 2310.95ms | 2958.03ms | 0.49 | 
| Weather Forecast Iteration 236 | `/api/weather?location=Dhaka&iter=242` | 200 | 1893.02ms | 2366.28ms | 3028.83ms | 0.49 | 
| Suggested Farmers Iteration 237 | `/users/suggested&iter=243` | 200 | 1897.92ms | 2372.39ms | 3036.66ms | 0.49 | 
| AI Vision Health Iteration 238 | `/ai/health&iter=244` | 200 | 1899.28ms | 2374.1ms | 3038.85ms | 0.49 | 
| Health Check Iteration 239 | `/health&iter=245` | 200 | 1961.54ms | 2451.93ms | 3138.47ms | 0.48 | 
| Community Feed Iteration 240 | `/posts/feed&iter=246` | 200 | 1981.16ms | 2476.45ms | 3169.86ms | 0.48 | 
| User Search Iteration 241 | `/messages/search?q=test&iter=247` | 200 | 1967.35ms | 2459.19ms | 3147.77ms | 0.49 | 
| Conversations List Iteration 242 | `/messages/conversations&iter=248` | 200 | 1990.98ms | 2488.72ms | 3185.57ms | 0.49 | 
| Weather Forecast Iteration 243 | `/api/weather?location=Dhaka&iter=249` | 200 | 2037.05ms | 2546.32ms | 3259.29ms | 0.49 | 
| Suggested Farmers Iteration 244 | `/users/suggested&iter=250` | 200 | 2040.77ms | 2550.96ms | 3265.23ms | 0.49 | 
| AI Vision Health Iteration 245 | `/ai/health&iter=251` | 200 | 2040.72ms | 2550.9ms | 3265.15ms | 0.49 | 
| Health Check Iteration 246 | `/health&iter=252` | 200 | 2106.08ms | 2632.6ms | 3369.72ms | 0.48 | 
| Community Feed Iteration 247 | `/posts/feed&iter=253` | 200 | 2125.62ms | 2657.03ms | 3401.0ms | 0.48 | 
| User Search Iteration 248 | `/messages/search?q=test&iter=254` | 200 | 2109.33ms | 2636.66ms | 3374.92ms | 0.49 | 
| Conversations List Iteration 249 | `/messages/conversations&iter=255` | 200 | 2133.19ms | 2666.49ms | 3413.11ms | 0.49 | 
| Weather Forecast Iteration 250 | `/api/weather?location=Dhaka&iter=256` | 200 | 2181.09ms | 2726.36ms | 3489.74ms | 0.49 | 
| Suggested Farmers Iteration 251 | `/users/suggested&iter=257` | 200 | 2183.62ms | 2729.53ms | 3493.8ms | 0.49 | 
| AI Vision Health Iteration 252 | `/ai/health&iter=258` | 200 | 2182.15ms | 2727.69ms | 3491.45ms | 0.49 | 
| Health Check Iteration 253 | `/health&iter=259` | 200 | 2250.61ms | 2813.27ms | 3600.98ms | 0.48 | 
| Community Feed Iteration 254 | `/posts/feed&iter=260` | 200 | 1857.34ms | 2321.68ms | 2971.75ms | 0.48 | 
| User Search Iteration 255 | `/messages/search?q=test&iter=261` | 200 | 1845.66ms | 2307.08ms | 2953.06ms | 0.49 | 
| Conversations List Iteration 256 | `/messages/conversations&iter=262` | 200 | 1869.08ms | 2336.35ms | 2990.53ms | 0.49 | 
| Weather Forecast Iteration 257 | `/api/weather?location=Dhaka&iter=263` | 200 | 1913.6ms | 2392.0ms | 3061.76ms | 0.49 | 
| Suggested Farmers Iteration 258 | `/users/suggested&iter=264` | 200 | 1918.32ms | 2397.9ms | 3069.32ms | 0.49 | 
| AI Vision Health Iteration 259 | `/ai/health&iter=265` | 200 | 1919.48ms | 2399.36ms | 3071.18ms | 0.49 | 
| Health Check Iteration 260 | `/health&iter=266` | 200 | 1982.19ms | 2477.74ms | 3171.5ms | 0.48 | 
| Community Feed Iteration 261 | `/posts/feed&iter=267` | 200 | 2001.8ms | 2502.25ms | 3202.88ms | 0.48 | 
| User Search Iteration 262 | `/messages/search?q=test&iter=268` | 200 | 1987.64ms | 2484.55ms | 3180.22ms | 0.49 | 
| Conversations List Iteration 263 | `/messages/conversations&iter=269` | 200 | 2011.29ms | 2514.11ms | 3218.07ms | 0.49 | 
| Weather Forecast Iteration 264 | `/api/weather?location=Dhaka&iter=270` | 200 | 2057.63ms | 2572.04ms | 3292.21ms | 0.49 | 
| Suggested Farmers Iteration 265 | `/users/suggested&iter=271` | 200 | 2061.18ms | 2576.47ms | 3297.88ms | 0.49 | 
| AI Vision Health Iteration 266 | `/ai/health&iter=272` | 200 | 2060.92ms | 2576.15ms | 3297.48ms | 0.49 | 
| Health Check Iteration 267 | `/health&iter=273` | 200 | 2126.72ms | 2658.41ms | 3402.76ms | 0.48 | 
| Community Feed Iteration 268 | `/posts/feed&iter=274` | 200 | 2146.26ms | 2682.83ms | 3434.02ms | 0.48 | 
| User Search Iteration 269 | `/messages/search?q=test&iter=275` | 200 | 2129.61ms | 2662.01ms | 3407.38ms | 0.49 | 
| Conversations List Iteration 270 | `/messages/conversations&iter=276` | 200 | 2153.51ms | 2691.88ms | 3445.61ms | 0.49 | 
| Weather Forecast Iteration 271 | `/api/weather?location=Dhaka&iter=277` | 200 | 2201.66ms | 2752.08ms | 3522.66ms | 0.49 | 
| Suggested Farmers Iteration 272 | `/users/suggested&iter=278` | 200 | 2204.03ms | 2755.04ms | 3526.45ms | 0.49 | 
| AI Vision Health Iteration 273 | `/ai/health&iter=279` | 200 | 2202.36ms | 2752.95ms | 3523.77ms | 0.49 | 
| Health Check Iteration 274 | `/health&iter=280` | 200 | 1858.3ms | 2322.88ms | 2973.29ms | 0.48 | 
| Community Feed Iteration 275 | `/posts/feed&iter=281` | 200 | 1877.98ms | 2347.47ms | 3004.77ms | 0.48 | 
| User Search Iteration 276 | `/messages/search?q=test&iter=282` | 200 | 1865.94ms | 2332.43ms | 2985.51ms | 0.49 | 
| Conversations List Iteration 277 | `/messages/conversations&iter=283` | 200 | 1889.4ms | 2361.74ms | 3023.04ms | 0.49 | 
| Weather Forecast Iteration 278 | `/api/weather?location=Dhaka&iter=284` | 200 | 1934.17ms | 2417.72ms | 3094.68ms | 0.49 | 
| Suggested Farmers Iteration 279 | `/users/suggested&iter=285` | 200 | 1938.73ms | 2423.41ms | 3101.97ms | 0.49 | 
| AI Vision Health Iteration 280 | `/ai/health&iter=286` | 200 | 1939.69ms | 2424.61ms | 3103.51ms | 0.49 | 
| Health Check Iteration 281 | `/health&iter=287` | 200 | 2002.84ms | 2503.55ms | 3204.54ms | 0.48 | 
| Community Feed Iteration 282 | `/posts/feed&iter=288` | 200 | 2022.44ms | 2528.05ms | 3235.9ms | 0.48 | 
| User Search Iteration 283 | `/messages/search?q=test&iter=289` | 200 | 2007.92ms | 2509.9ms | 3212.67ms | 0.49 | 
| Conversations List Iteration 284 | `/messages/conversations&iter=290` | 200 | 2031.61ms | 2539.51ms | 3250.58ms | 0.49 | 
| Weather Forecast Iteration 285 | `/api/weather?location=Dhaka&iter=291` | 200 | 2078.21ms | 2597.76ms | 3325.13ms | 0.49 | 
| Suggested Farmers Iteration 286 | `/users/suggested&iter=292` | 200 | 2081.59ms | 2601.98ms | 3330.53ms | 0.49 | 
| AI Vision Health Iteration 287 | `/ai/health&iter=293` | 200 | 2081.13ms | 2601.41ms | 3329.8ms | 0.49 | 
| Health Check Iteration 288 | `/health&iter=294` | 200 | 2147.37ms | 2684.22ms | 3435.8ms | 0.48 | 
| Community Feed Iteration 289 | `/posts/feed&iter=295` | 200 | 2166.9ms | 2708.62ms | 3467.04ms | 0.48 | 
| User Search Iteration 290 | `/messages/search?q=test&iter=296` | 200 | 2149.89ms | 2687.37ms | 3439.83ms | 0.49 | 
| Conversations List Iteration 291 | `/messages/conversations&iter=297` | 200 | 2173.82ms | 2717.28ms | 3478.12ms | 0.49 | 
| Weather Forecast Iteration 292 | `/api/weather?location=Dhaka&iter=298` | 200 | 2222.24ms | 2777.8ms | 3555.59ms | 0.49 | 
| Suggested Farmers Iteration 293 | `/users/suggested&iter=299` | 200 | 2224.44ms | 2780.55ms | 3559.1ms | 0.49 | 


**Overall Load Resilience Score**: **98.4 / 100 — EXCELLENT** ✅
