import { TimeZones } from 'index';

let getStubTimeZones = (): TimeZones => ({});
if (process.env.NODE_ENV !== 'production') {
    getStubTimeZones = (): TimeZones => ({
        '-12:00': [
            -43200,
            [[0, '(UTC-12:00) International Date Line West GMT+12', []]],
        ],
        '-11:00': [
            -39600,
            [[1, '(UTC-11:00) Coordinated Universal Time-11', []]],
        ],
        '-10:00': [
            -36000,
            [[2, '(UTC-10:00) Hawaii, Honolulu', [['Honolulu', 6.2, 38.2]]]],
        ],
        '-09:00': [
            -32400,
            [[3, '(UTC-09:00) Alaska, Anchorage', [['Anchorage', 8.6, 16]]]],
        ],
        '-08:00': [
            -28800,
            [
                [
                    4,
                    '(UTC-08:00) Baja California, Santa Isabel, Mexicali',
                    [
                        ['Santa Isabel', 31.6, 40],
                        ['Mexicali', 17.9, 31.9],
                    ],
                ],
                [
                    5,
                    '(UTC-08:00) Pacific Time (US and Canada), Los Angeles',
                    [['Los Angeles', 17.1, 31]],
                ],
            ],
        ],
        '-07:00': [
            -25200,
            [
                [
                    6,
                    '(UTC-07:00) Chihuahua, La Paz, Mazatlan',
                    [
                        ['Chihuahua', 20.5, 34.1],
                        ['La Paz', 31.1, 59.2],
                        ['Mazatlan', 20.4, 37.1],
                    ],
                ],
                [
                    7,
                    '(UTC-07:00) Mountain Time (US and Canada), Arizona, Phoenix',
                    [['Phoenix', 18.9, 31.3]],
                ],
            ],
        ],
        '-06:00': [
            -21600,
            [
                [
                    8,
                    '(UTC-06:00) Central America, Guatemala City, San Salvador, Panama City',
                    [
                        ['Guatemala City', 24.9, 41.9],
                        ['San Salvador', 25.2, 42.4],
                        ['Panama City', 27.9, 45],
                    ],
                ],
                [
                    9,
                    '(UTC-06:00) Central Time (US and Canada), Austin',
                    [['Austin', 22.8, 33.2]],
                ],
                [
                    10,
                    '(UTC-06:00) Saskatchewan, Saskatoon',
                    [['Saskatoon', 20.4, 21]],
                ],
                [
                    11,
                    '(UTC-06:00) Guadalajara, Mexico City, Monterey',
                    [
                        ['Guadalajara', 21.3, 38.5],
                        ['Mexico City', 22.5, 39.2],
                        ['Monterey', 16.1, 29.7],
                    ],
                ],
            ],
        ],
        '-05:00': [
            -18000,
            [
                [
                    12,
                    '(UTC-05:00) Bogota, Lima, Quito',
                    [
                        ['Bogota', 29.4, 47.4],
                        ['Lima', 28.6, 56.7],
                        ['Quito', 28.2, 50.1],
                    ],
                ],
                [
                    13,
                    '(UTC-05:00) Indiana (East), Indianapolis',
                    [['Indianapolis', 26.1, 27.9]],
                ],
                [14, '(UTC-05:00) Eastern Time (US and Canada)', []],
            ],
        ],
        '-04:30': [
            -16200,
            [[15, '(UTC-04:30) Caracas', [['Caracas', 31.4, 44.2]]]],
        ],
        '-04:00': [
            -14400,
            [
                [16, '(UTC-04:00) Atlantic Time (Canada)', []],
                [17, '(UTC-04:00) Asuncion', [['Asuncion', 34, 64.1]]],
                [
                    18,
                    '(UTC-04:00) Georgetown, La Paz, Manaus, San Juan',
                    [
                        ['Georgetown', 33.8, 46.2],
                        ['La Paz', 31.1, 59.2],
                        ['Manaus', 33.3, 51.7],
                        ['San Juan', 31, 67.5],
                    ],
                ],
                [19, '(UTC-04:00) Cuiaba', [['Cuiaba', 34.4, 58.7]]],
                [20, '(UTC-04:00) Santiago', [['Santiago', 30.4, 68.6]]],
            ],
        ],
        '-03:30': [-12600, [[21, '(UTC-03:30) Newfoundland', []]]],
        '-03:00': [
            -10800,
            [
                [22, '(UTC-03:00) Brasilia', [['Brasilia', 36.7, 58.8]]],
                [23, '(UTC-03:00) Greenland', []],
                [
                    24,
                    '(UTC-03:00) Cayenne, Fortaleza',
                    [
                        ['Cayenne', 35.5, 47.3],
                        ['Fortaleza', 39.3, 52.1],
                    ],
                ],
                [
                    25,
                    '(UTC-03:00) Buenos Aires',
                    [['Buenos Aires', 33.8, 69.2]],
                ],
                [26, '(UTC-03:00) Montevideo', [['Montevideo', 34.4, 69.4]]],
            ],
        ],
        '-02:00': [
            -7200,
            [[27, '(UTC-02:00) Coordinated Universal Time-2', []]],
        ],
        '-01:00': [
            -3600,
            [
                [28, '(UTC-01:00) Cape Verde, Praia', [['Praia', 43.5, 41.7]]],
                [
                    29,
                    '(UTC-01:00) Azores, Horta, Angra do Heroismo',
                    [
                        ['Horta', 42, 28.6],
                        ['Angra do Heroismo', 42.4, 28.5],
                    ],
                ],
            ],
        ],
        '+00:00': [
            0,
            [
                [30, '(UTC+00:00) Casablanca', [['Casablanca', 47.9, 31.3]]],
                [
                    31,
                    '(UTC+00:00) Monrovia, Reykjavik',
                    [
                        ['Monrovia', 47, 46.5],
                        ['Reykjavik', 43.9, 14.4],
                    ],
                ],
                [
                    32,
                    '(UTC+00:00) Dublin, Edinburgh, Lisbon, London',
                    [
                        ['Dublin', 48.3, 20.4],
                        ['Edinburgh', 49.1, 18.9],
                        ['Lisbon', 47.5, 28.5],
                        ['London', 50, 21.4],
                    ],
                ],
                [33, '(UTC+00:00) Coordinated Universal Time', []],
            ],
        ],
        '+01:00': [
            3600,
            [
                [
                    34,
                    '(UTC+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna',
                    [
                        ['Amsterdam', 51.4, 20.9],
                        ['Berlin', 53.7, 20.8],
                        ['Bern', 52.1, 23.9],
                        ['Rome', 53.5, 26.7],
                        ['Stockholm', 55, 17],
                        ['Vienna', 54.5, 23.2],
                    ],
                ],
                [
                    35,
                    '(UTC+01:00) Brussels, Copenhagen, Madrid, Paris',
                    [
                        ['Brussels', 51.2, 21.8],
                        ['Copenhagen', 53.5, 19.1],
                        ['Madrid', 49, 27.5],
                        ['Paris', 50.7, 22.9],
                    ],
                ],
                [36, '(UTC+01:00) West Central Africa', []],
                [
                    37,
                    '(UTC+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague',
                    [
                        ['Belgrade', 55.7, 25.1],
                        ['Bratislava', 54.8, 23.3],
                        ['Budapest', 55.3, 23.6],
                        ['Ljubljana', 54, 24.4],
                        ['Prague', 54, 22.2],
                    ],
                ],
                [
                    38,
                    '(UTC+01:00) Sarajevo, Skopje, Warsaw, Zagreb',
                    [
                        ['Sarajevo', 55.1, 25.6],
                        ['Skopje', 56, 26.7],
                        ['Warsaw', 55.8, 21],
                        ['Zagreb', 54.4, 24.5],
                    ],
                ],
                [39, '(UTC+01:00) Windhoek', [['Windhoek', 54.7, 62.5]]],
            ],
        ],
        '+02:00': [
            7200,
            [
                [
                    40,
                    '(UTC+02:00) Athens, Bucharest, Istanbul',
                    [
                        ['Athens', 56.6, 28.9],
                        ['Bucharest', 57.2, 25.3],
                        ['Istanbul', 58, 27.2],
                    ],
                ],
                [
                    41,
                    '(UTC+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius',
                    [
                        ['Helsinki', 56.9, 16.6],
                        ['Kiev', 58.5, 22],
                        ['Riga', 56.7, 18.4],
                        ['Sofia', 56.5, 26.3],
                        ['Tallinn', 56.9, 17],
                        ['Vilnius', 57, 19.6],
                    ],
                ],
                [42, '(UTC+02:00) Cairo', [['Cairo', 58.7, 33.3]]],
                [43, '(UTC+02:00) Damascus', [['Damascus', 60.1, 31.4]]],
                [44, '(UTC+02:00) Amman', [['Amman', 60, 32.3]]],
                [
                    45,
                    '(UTC+02:00) Harare, Pretoria',
                    [
                        ['Harare', 58.6, 59.9],
                        ['Pretoria', 57.8, 64.3],
                    ],
                ],
                [46, '(UTC+02:00) Jerusalem', [['Jerusalem', 59.8, 32.3]]],
                [47, '(UTC+02:00) Beirut', [['Beirut', 59.9, 31.2]]],
            ],
        ],
        '+03:00': [
            10800,
            [
                [48, '(UTC+03:00) Baghdad', [['Baghdad', 62.3, 31.5]]],
                [49, '(UTC+03:00) Minsk', [['Minsk', 57.7, 20.1]]],
                [
                    50,
                    '(UTC+03:00) Kuwait City, Riyadh',
                    [
                        ['Kuwait City', 63.3, 33.7],
                        ['Riyadh', 63, 36.3],
                    ],
                ],
                [51, '(UTC+03:00) Nairobi', [['Nairobi', 60.2, 50.7]]],
            ],
        ],
        '+03:30': [
            12600,
            [[52, '(UTC+03:30) Tehran', [['Tehran', 64.3, 30.2]]]],
        ],
        '+04:00': [
            14400,
            [
                [
                    53,
                    '(UTC+04:00) Moscow, St. Petersburg, Volgograd',
                    [
                        ['Moscow', 60.4, 19],
                        ['St. Petersburg', 27, 34.6],
                        ['Volgograd', 62.4, 22.9],
                    ],
                ],
                [54, '(UTC+04:00) Tbilisi', [['Tbilisi', 62.4, 26.8]]],
                [55, '(UTC+04:00) Yerevan', [['Yerevan', 62.4, 27.7]]],
                [
                    56,
                    '(UTC+04:00) Abu Dhabi, Muscat',
                    [
                        ['Abu Dhabi', 65.1, 36.4],
                        ['Muscat', 66.3, 36.9],
                    ],
                ],
                [57, '(UTC+04:00) Baku', [['Baku', 63.8, 27.6]]],
                [58, '(UTC+04:00) Port Louis', [['Port Louis', 66, 61.2]]],
            ],
        ],
        '+04:30': [16200, [[59, '(UTC+04:30) Kabul', [['Kabul', 69.2, 30.8]]]]],
        '+05:00': [
            18000,
            [
                [60, '(UTC+05:00) Tashkent', [['Tashkent', 69.2, 27.1]]],
                [
                    61,
                    '(UTC+05:00) Islamabad, Karachi',
                    [
                        ['Islamabad', 70.3, 31.3],
                        ['Karachi', 68.6, 36.2],
                    ],
                ],
            ],
        ],
        '+05:30': [
            19800,
            [
                [
                    62,
                    '(UTC+05:30) Sri Jayewardenepura Kotte',
                    [['Sri Jayewardenepura Kotte', 72.2, 46.2]],
                ],
                [
                    63,
                    '(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi',
                    [
                        ['Chennai', 72.3, 42.7],
                        ['Kolkata', 74.5, 37.5],
                        ['Mumbai', 70.2, 39.4],
                        ['New Delhi', 71.4, 34.1],
                    ],
                ],
            ],
        ],
        '+05:45': [
            19620,
            [[64, '(UTC+05:45) Kathmandu', [['Kathmandu', 73.7, 34.6]]]],
        ],
        '+06:00': [
            21600,
            [
                [65, '(UTC+06:00) Astana', []],
                [66, '(UTC+06:00) Dhaka', [['Dhaka', 75.1, 36.8]]],
                [
                    67,
                    '(UTC+06:00) Yekaterinburg',
                    [['Yekaterinburg', 66.8, 18.4]],
                ],
            ],
        ],
        '+06:30': [23400, [[68, '(UTC+06:30) Yangon', []]]],
        '+07:00': [
            25200,
            [
                [
                    69,
                    '(UTC+07:00) Bangkok, Hanoi, Jakarta',
                    [
                        ['Bangkok', 77.9, 42.4],
                        ['Hanoi', 79.4, 38.3],
                        ['Jakarta', 79.7, 53.5],
                    ],
                ],
                [70, '(UTC+07:00) Novosibirsk', [['Novosibirsk', 73, 19.4]]],
            ],
        ],
        '+08:00': [
            28800,
            [
                [71, '(UTC+08:00) Krasnoyarsk', [['Krasnoyarsk', 75.8, 18.9]]],
                [72, '(UTC+08:00) Ulaanbaatar', [['Ulaanbaatar', 79.7, 23.4]]],
                [
                    73,
                    '(UTC+08:00) Beijing, Chongqing, Hong Kong, Urumqi',
                    [
                        ['Beijing', 82.3, 27.8],
                        ['Chongqing', 79.6, 33.6],
                        ['Hong Kong', 81.7, 37.6],
                        ['Urumqi', 74.3, 25.7],
                    ],
                ],
                [74, '(UTC+08:00) Perth', [['Perth', 82.2, 67.8]]],
                [
                    75,
                    '(UTC+08:00) Kuala Lumpur, Singapore',
                    [
                        ['Kuala Lumpur', 78.2, 48.3],
                        ['Singapore', 78.8, 49.3],
                    ],
                ],
                [76, '(UTC+08:00) Taipei', [['Taipei', 83.8, 36.1]]],
            ],
        ],
        '+09:00': [
            32400,
            [
                [77, '(UTC+09:00) Irkutsk', [['Irkutsk', 79, 21]]],
                [78, '(UTC+09:00) Seoul', [['Seoul', 85.3, 29.1]]],
                [
                    79,
                    '(UTC+09:00) Osaka, Sapporo, Tokyo',
                    [
                        ['Osaka', 87.6, 30.7],
                        ['Sapporo', 89.3, 26.1],
                        ['Tokyo', 88.8, 30.2],
                    ],
                ],
            ],
        ],
        '+09:30': [
            34200,
            [
                [80, '(UTC+09:30) Darwin', [['Darwin', 86.3, 56.9]]],
                [81, '(UTC+09:30) Adelaide', [['Adelaide', 88.5, 69.4]]],
            ],
        ],
        '+10:00': [
            36000,
            [
                [82, '(UTC+10:00) Hobart', [['Hobart', 90.9, 73.8]]],
                [83, '(UTC+10:00) Yakutsk', [['Yakutsk', 86, 15.5]]],
                [84, '(UTC+10:00) Brisbane', [['Brisbane', 92.5, 65.3]]],
                [
                    85,
                    '(UTC+10:00) Guam, Port Moresby',
                    [['Port Moresby', 90.9, 55.3]],
                ],
                [
                    86,
                    '(UTC+10:00) Canberra, Melbourne, Sydney',
                    [
                        ['Canberra', 91.4, 69.6],
                        ['Melbourne', 90.3, 71],
                        ['Sydney', 92, 68.8],
                    ],
                ],
            ],
        ],
        '+11:00': [
            39600,
            [
                [87, '(UTC+11:00) Vladivostok', [['Vladivostok', 86.6, 26]]],
                [
                    88,
                    '(UTC+11:00) Solomon Islands, New Caledonia, Honiara',
                    [['Honiara', 94.4, 55.2]],
                ],
            ],
        ],
        '+12:00': [
            43200,
            [
                [89, '(UTC+12:00) Coordinated Universal Time+12', []],
                [
                    90,
                    '(UTC+12:00) Fiji, Marshall Islands, Suva',
                    [['Suva', 99.6, 60.1]],
                ],
                [91, '(UTC+12:00) Magadan', [['Magadan', 91.9, 16.9]]],
                [
                    92,
                    '(UTC+12:00) Auckland, Wellington',
                    [
                        ['Auckland', 98.6, 70.5],
                        ['Wellington', 98.5, 72.9],
                    ],
                ],
            ],
        ],
        '+13:00': [
            46800,
            [
                [93, "(UTC+13:00) Nuku'alofa", [["Nuku'alofa", 1.3, 61.7]]],
                [94, '(UTC+13:00) Samoa, Apia', [['Apia', 2.3, 57.7]]],
            ],
        ],
    });
}
export default getStubTimeZones;
