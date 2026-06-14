// AUTO-GENERATED — run scripts/merge_scenario_packs.py after editing scenario packs
(function (global) {
  const WALK_FIELD_LOG_RULES = {
  "commute-area-3km": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "offer-radius-density",
      "description": "Enough offers inside user offer-radius setting",
      "where": {
        "offerRadiusDensityMet": true
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "commute-area-5km": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "offer-radius-density",
      "description": "Enough offers inside user offer-radius setting",
      "where": {
        "offerRadiusDensityMet": true
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "commute-area-10km": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "offer-radius-density",
      "description": "Enough offers inside user offer-radius setting",
      "where": {
        "offerRadiusDensityMet": true
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "below-gate": [
    {
      "id": "offers-loaded",
      "description": "Feed was loaded near scenario",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "below-score",
      "description": "Intent score below allow bar (70)",
      "where": {
        "maxIntentScore": 69,
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "no-allow",
      "description": "No allow decision",
      "where": {
        "gateDecision": "allow"
      },
      "expect": {
        "none": true
      }
    }
  ],
  "walk-allow": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "walking-near-offers",
      "description": "On foot near seeded offers",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "lunch-corridor": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "lunch-walking",
      "description": "Midday walk near offers",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "food-affinity-3day": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "walking-near-offers",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "category-off": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "engine-ran-walking",
      "description": "Engine evaluated while on foot (copy check manual)",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "driving-suppress": [
    {
      "id": "driving-hs05",
      "where": {
        "hardSuppressRule": "HS-05"
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "blacklist-merchant": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "engine-ran-walking",
      "description": "Engine evaluated while on foot (hidden merchant copy manual)",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "transit-suppress": [
    {
      "id": "transit-hs07",
      "description": "Transit hard suppress HS-07",
      "where": {
        "hardSuppressRule": "HS-07"
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "no-ping-transit",
      "description": "No surfaced alert while in transit",
      "where": {
        "surfaced": true,
        "activity": [
          "inTransit",
          "inVehicle",
          "driving"
        ]
      },
      "expect": {
        "none": true
      }
    }
  ],
  "quiet-allow": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 10
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "mall-walking",
      "description": "Dense ring while on foot",
      "where": {
        "minOfferCount": 10,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "bootstrap-day3": [
    {
      "id": "bootstrap-lunch-walk",
      "description": "Day-3 lunch window walk with offers loaded",
      "where": {
        "minOfferCount": 1,
        "inLunchWindow": true,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "bootstrap-handoff": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "walking-near-offers",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "lunch-ignore-3day": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "parcel-run": [
    {
      "id": "parcel-walking",
      "description": "Errand walk with offers in ring",
      "where": {
        "minOfferCount": 1,
        "activity": [
          "walking",
          "stationary",
          "unknown"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "context-block-6h": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "real-outing-walk": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "real-outing",
      "description": "Walk \u22655 min beyond anchor radius",
      "where": {
        "realOuting": true,
        "activity": "walking"
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "visit-wake": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "engagement-cooldown": [
    {
      "id": "offers-loaded",
      "description": "Feed loaded near scenario",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "engagement-defer-high-score",
      "description": "After feed engagement, gate defers even with score \u2265 70",
      "where": {
        "gateDecision": "defer",
        "deferReason": "engagement_cooldown",
        "minIntentScore": 70
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "no-delivery-while-deferred",
      "description": "No surfaced alert on engagement-cooldown defer rows",
      "where": {
        "gateDecision": "defer",
        "surfaced": true
      },
      "expect": {
        "none": true
      }
    }
  ],
  "map-engagement-cooldown": [
    {
      "id": "offers-loaded",
      "description": "Map loaded near scenario",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "engagement-defer-high-score",
      "description": "After map pan or pin tap, gate defers even with score \u2265 70",
      "where": {
        "gateDecision": "defer",
        "deferReason": "engagement_cooldown",
        "minIntentScore": 70
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "no-delivery-while-deferred",
      "description": "No surfaced alert on engagement-cooldown defer rows",
      "where": {
        "gateDecision": "defer",
        "surfaced": true
      },
      "expect": {
        "none": true
      }
    }
  ],
  "activity-wake": [
    {
      "id": "activity-wake",
      "description": "Activity change background wake",
      "where": {
        "wakeSource": "activity"
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "wifi-anchor-hint": [
    {
      "id": "wifi-hint",
      "description": "Known Wi\u2011Fi strengthens anchor",
      "where": {
        "wifiHint": [
          "matched",
          "departure"
        ]
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "commute-to-walk": [
    {
      "id": "commute-to-walk",
      "description": "Walking after commute / transit session",
      "where": {
        "commuteToWalk": true,
        "activity": "walking"
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "anchor-opportunity-ring": [
    {
      "id": "offer-radius-density",
      "description": "Enough offers inside user offer-radius setting",
      "where": {
        "offerRadiusDensityMet": true
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "commute-corridor": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "stochastic-skip": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    },
    {
      "id": "stochastic-block",
      "description": "Gate allow but stochastic coin skipped delivery",
      "where": {
        "gateDecision": "allow",
        "minIntentScore": 70,
        "deliveryBlockReason": "stochastic_skip"
      },
      "expect": {
        "minMatches": 1
      }
    }
  ],
  "disengaged-allow-60": [
    {
      "id": "offers-loaded",
      "where": {
        "minOfferCount": 1
      },
      "expect": {
        "minMatches": 1
      }
    }
  ]
};
  const WALK_ENGINE_PASS_IF_ANY = {
  "commute-area-3km": [
    {
      "id": "movement-or-commute",
      "description": "Walking or commute session while crossing the area",
      "rules": [
        {
          "id": "walking",
          "where": {
            "activity": "walking"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "commute-walk",
          "where": {
            "commuteToWalk": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "on-route",
          "where": {
            "onRouteOnTime": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "commute-area-5km": [
    {
      "id": "movement-or-commute",
      "description": "Walking or commute session while crossing the area",
      "rules": [
        {
          "id": "walking",
          "where": {
            "activity": "walking"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "commute-walk",
          "where": {
            "commuteToWalk": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "on-route",
          "where": {
            "onRouteOnTime": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "commute-area-10km": [
    {
      "id": "movement-or-commute",
      "description": "Walking or commute session while crossing the area",
      "rules": [
        {
          "id": "walking",
          "where": {
            "activity": "walking"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "commute-walk",
          "where": {
            "commuteToWalk": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "on-route",
          "where": {
            "onRouteOnTime": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "station-cluster",
          "where": {
            "nearStationCluster": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "walk-allow": [
    {
      "id": "delivery-path",
      "description": "Would deliver OR allow score \u2265 70",
      "rules": [
        {
          "id": "would-deliver",
          "where": {
            "wouldDeliver": true,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "allow-band",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 70,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "lunch-corridor": [
    {
      "id": "lunch-window",
      "description": "mealCorridor lunch OR inLunchWindow",
      "rules": [
        {
          "id": "meal-lunch",
          "where": {
            "mealCorridor": "lunch"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "in-lunch",
          "where": {
            "inLunchWindow": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "food-affinity-3day": [
    {
      "id": "affinity-signal",
      "description": "Food affinity in score breakdown OR strong allow",
      "rules": [
        {
          "id": "affinity-boost",
          "where": {
            "minScoreAffinity": 1
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "allow-strong",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 70,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "quiet-allow": [
    {
      "id": "quiet-or-deliver",
      "description": "Quiet plan, would deliver, OR allow score \u2265 70",
      "rules": [
        {
          "id": "quiet-plan",
          "where": {
            "gateDecision": "allow",
            "planStyle": "quiet",
            "minIntentScore": 70,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "would-deliver",
          "where": {
            "wouldDeliver": true,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "allow-band",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 70,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "bootstrap-day3": [
    {
      "id": "bootstrap-score-or-deliver",
      "description": "Row 17 boost OR allow/deliver \u2265 70 during lunch walk",
      "rules": [
        {
          "id": "bootstrap-boost",
          "where": {
            "inLunchWindow": true,
            "minBootstrapBoost": 0.5
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "allow-lunch",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 70,
            "inLunchWindow": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "would-deliver-lunch",
          "where": {
            "wouldDeliver": true,
            "inLunchWindow": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "bootstrap-handoff": [
    {
      "id": "disengaged-allow",
      "description": "Day 6+ disengaged allow at 60\u201369 OR verbose threshold 60",
      "rules": [
        {
          "id": "allow-60-band",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 60,
            "maxIntentScore": 69
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "threshold-60",
          "where": {
            "minAllowThreshold": 60,
            "maxAllowThreshold": 60
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "lunch-ignore-3day": [
    {
      "id": "moment-blocked",
      "description": "Moment learning blocks delivery despite allow",
      "rules": [
        {
          "id": "moment-suppressed",
          "where": {
            "deliveryBlockReason": "moment_suppressed"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "plan-none-after-allow",
          "where": {
            "gateDecision": "allow",
            "planStyle": "none",
            "wouldDeliver": false
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "parcel-run": [
    {
      "id": "parcel-allow",
      "description": "Allow \u2265 70 or would deliver on errand walk",
      "rules": [
        {
          "id": "allow-band",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 70,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "would-deliver",
          "where": {
            "wouldDeliver": true,
            "activity": [
              "walking",
              "stationary",
              "unknown"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "context-block-6h": [
    {
      "id": "second-ping-blocked",
      "description": "Same caf\u00e9 context blocks repeat ping",
      "rules": [
        {
          "id": "second-ping-denied",
          "where": {
            "deliveryBlockReason": [
              "second_ping_denied",
              "frequency_cap",
              "peak_band_hold"
            ]
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "quiet-instead-of-ping",
          "where": {
            "gateDecision": "allow",
            "planStyle": "quiet",
            "minIntentScore": 70
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "visit-wake": [
    {
      "id": "visit-or-learned",
      "description": "Visit wake OR learned place at eval",
      "rules": [
        {
          "id": "visit-wake",
          "where": {
            "wakeSource": "visit"
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "learned-place",
          "where": {
            "learnedPlaceKind": [
              "home",
              "work",
              "work"
            ],
            "minLearnedPlaceRetention": 1
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "commute-corridor": [
    {
      "id": "commute-or-station",
      "description": "On-route on-time OR station cluster",
      "rules": [
        {
          "id": "on-route",
          "where": {
            "onRouteOnTime": true
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "station-cluster",
          "where": {
            "nearStationCluster": true
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ],
  "disengaged-allow-60": [
    {
      "id": "disengaged-allow",
      "description": "Allow in 60\u201369 band OR verbose threshold 60",
      "rules": [
        {
          "id": "allow-60-band",
          "where": {
            "gateDecision": "allow",
            "minIntentScore": 60,
            "maxIntentScore": 69
          },
          "expect": {
            "minMatches": 1
          }
        },
        {
          "id": "threshold-60",
          "where": {
            "minAllowThreshold": 60,
            "maxAllowThreshold": 60
          },
          "expect": {
            "minMatches": 1
          }
        }
      ]
    }
  ]
};

  function num(entry, key) {
    const raw = entry[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  function boolVal(entry, key) {
    const raw = entry[key];
    return typeof raw === "boolean" ? raw : null;
  }

  function strVal(entry, key) {
    const raw = entry[key];
    return raw == null ? null : String(raw);
  }

  function asStringArray(value) {
    if (value == null) return null;
    return Array.isArray(value) ? value : [value];
  }

  function entryMatchesFilter(entry, filter) {
    if (!filter) return true;
    const gate = asStringArray(filter.gateDecision);
    if (gate && !gate.includes(strVal(entry, "gateDecision") ?? "")) return false;
    const wake = asStringArray(filter.wakeSource);
    if (wake && !wake.includes(strVal(entry, "wakeSource") ?? "")) return false;
    const place = asStringArray(filter.placeKind);
    if (place && !place.includes(strVal(entry, "placeKind") ?? "")) return false;
    const slot = asStringArray(filter.slotKind);
    if (slot && !slot.includes(strVal(entry, "slotKind") ?? "")) return false;
    const activity = asStringArray(filter.activity);
    if (activity && !activity.includes(strVal(entry, "activity") ?? "")) return false;
    const hs = asStringArray(filter.hardSuppressRule);
    if (hs && !hs.includes(strVal(entry, "hardSuppressRule") ?? "")) return false;
    const why = asStringArray(filter.suppressReason);
    if (why && !why.includes(strVal(entry, "suppressReason") ?? "")) return false;

    const offerCount = num(entry, "offerCount");
    if (filter.minOfferCount != null && (offerCount == null || offerCount < filter.minOfferCount)) return false;
    if (filter.maxOfferCount != null && (offerCount == null || offerCount > filter.maxOfferCount)) return false;
    const opp = num(entry, "opportunitySum");
    if (filter.minOpportunitySum != null && (opp == null || opp < filter.minOpportunitySum)) return false;
    if (filter.maxOpportunitySum != null && (opp == null || opp > filter.maxOpportunitySum)) return false;
    const score = num(entry, "intentScore");
    if (filter.minIntentScore != null && (score == null || score < filter.minIntentScore)) return false;
    if (filter.maxIntentScore != null && (score == null || score > filter.maxIntentScore)) return false;
    const strength = num(entry, "slotStrength");
    if (filter.minSlotStrength != null && (strength == null || strength < filter.minSlotStrength)) return false;
    if (filter.maxSlotStrength != null && (strength == null || strength > filter.maxSlotStrength)) return false;

    for (const key of [
      "memoryColdStart", "memoryNewArea", "anchorEnter", "anchorExit",
      "surfaced", "wouldDeliver", "realOuting", "inLunchWindow",
      "onRouteOnTime", "nearStationCluster", "carToWalk", "insideRingFromAnchor",
    ]) {
      if (key in filter && boolVal(entry, key) !== filter[key]) return false;
    }

    const wifiHint = asStringArray(filter.wifiHint);
    if (wifiHint && !wifiHint.includes(strVal(entry, "wifiHint") ?? "")) return false;
    const lunchWindow = asStringArray(filter.lunchWindow);
    if (lunchWindow && !lunchWindow.includes(strVal(entry, "lunchWindow") ?? "")) return false;
    const mealCorridor = asStringArray(filter.mealCorridor);
    if (mealCorridor && !mealCorridor.includes(strVal(entry, "mealCorridor") ?? "")) return false;
    return true;
  }

  function evaluateSingleRule(entries, rule) {
    const matches = entries.filter((e) => entryMatchesFilter(e, rule.where));
    const count = matches.length;
    const expect = rule.expect || {};
    const none = !!expect.none;
    const min = expect.minMatches ?? (none ? 0 : 1);
    const max = expect.maxMatches;
    let pass = false;
    let detail = "";
    if (none) {
      pass = count === 0;
      detail = pass ? "no matching entries (expected)" : `${count} forbidden match(es)`;
    } else {
      pass = count >= min && (max == null || count <= max);
      detail = `${count} match(es) (need ≥${min}${max != null ? `, ≤${max}` : ""})`;
    }
    return {
      id: rule.id,
      pass,
      detail: rule.description || detail,
      matchCount: count,
      layer: "engine",
    };
  }

  function evaluateEngineRules(entries, scenarioId, customRules, orGroups) {
    const rules = customRules && customRules.length
      ? customRules
      : WALK_FIELD_LOG_RULES[scenarioId] || [];
    const checks = rules.map((rule) => evaluateSingleRule(entries, rule));
    const groups = orGroups != null
      ? orGroups
      : WALK_ENGINE_PASS_IF_ANY[scenarioId] || [];
    for (const group of groups) {
      const subRules = group.rules || [];
      const subChecks = subRules.map((r) => evaluateSingleRule(entries, r));
      const ok = subChecks.some((c) => c.pass);
      const passedIds = subChecks.filter((c) => c.pass).map((c) => c.id);
      checks.push({
        id: group.id || "engine_or",
        pass: ok,
        detail: group.description || `one of ${subRules.map((r) => r.id).join(", ")} (${passedIds.join(", ") || "none"})`,
        matchCount: passedIds.length,
        layer: "engine_or",
      });
    }
    return checks;
  }

  function evaluateMemoryTraceRules(memoryTrace, rules) {
    const trace = memoryTrace || {};
    const strong = Number(trace.strong_slot_count || 0);
    const diary = Number(trace.diary_event_count || 0);
    return (rules || []).map((rule) => {
      let ok = true;
      const parts = [];
      if (rule.minStrongSlots != null) {
        ok = ok && strong >= rule.minStrongSlots;
        parts.push(`strong_slots=${strong} (need ≥${rule.minStrongSlots})`);
      }
      if (rule.minDiaryEvents != null) {
        ok = ok && diary >= rule.minDiaryEvents;
        parts.push(`diary=${diary} (need ≥${rule.minDiaryEvents})`);
      }
      return {
        id: rule.id || "memory_trace",
        pass: ok,
        detail: rule.description || parts.join("; "),
        layer: "memory_trace",
      };
    });
  }

  global.FieldLogEngine = {
    WALK_FIELD_LOG_RULES,
    WALK_ENGINE_PASS_IF_ANY,
    entryMatchesFilter,
    evaluateEngineRules,
    evaluateMemoryTraceRules,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);
