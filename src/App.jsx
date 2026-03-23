import { useState, useMemo, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer, CartesianGrid } from "recharts";

/* ──────────── CONSTANTS ──────────── */
const COLORS_AST = ["DEF","G","H","I","JK","L/M","CAPE"];
const CLARITIES = ["VVS","VS1","VS2","SI1","SI2"];
const COMMERCIAL_COLORS = ["I","JK","L/M","CAPE"]; // commercial color grades (3 Col = IJK + LM + CAPE)
const COMMERCIAL_CLARITIES = ["SI1","SI2"]; // commercial clarities
const isCommercial = (co, cl) => COMMERCIAL_COLORS.includes(co) || COMMERCIAL_CLARITIES.includes(cl);
const SHAPES = ["Round","Pear/Oval","Baguette","Marquise"];

const SIEVE_RANGES = [
  { id:"s1", sieve:"-0000/-00", mm:"0.80-1.00", cts:"0.002-0.004", min:0.002, max:0.004 },
  { id:"s2", sieve:"+00/-2", mm:"1.00-1.25", cts:"0.005-0.008", min:0.005, max:0.008 },
  { id:"s3", sieve:"+2/-6.5", mm:"1.25-1.80", cts:"0.009-0.021", min:0.009, max:0.021 },
  { id:"s4", sieve:"+6.5/-9", mm:"1.80-2.30", cts:"0.022-0.051", min:0.022, max:0.051 },
  { id:"s5", sieve:"+9/-11", mm:"2.30-2.70", cts:"0.052-0.077", min:0.052, max:0.077 },
  { id:"s6", sieve:"+11/-13", mm:"2.70-3.10", cts:"0.078-0.115", min:0.078, max:0.115 },
  { id:"s7", sieve:"+13/-15", mm:"3.10-3.50", cts:"0.116-0.158", min:0.116, max:0.158 },
  { id:"s8", sieve:"+15/-16", mm:"3.50-3.80", cts:"0.159-0.200", min:0.159, max:0.200 },
];

/* ── BROKER PRICE LISTS (PL-A = EF PL Base, PL-M = Market Avg+20%) ── */
/* Maps sieve range id → DEF/VVS base price $/ct */
const PLA_BASE = { s1:419.5, s2:419.5, s3:406.5, s4:387.0, s5:448.8, s6:478.0, s7:517.0, s8:543.0 };
const PLM_BASE = { s1:574.4, s2:566.9, s3:523.5, s4:499.6, s5:579.6, s6:656.1, s7:754.3, s8:824.7 };
/* Color group factors (from EF PL analysis): DEF=1.0, GHI=0.75, JK=0.4875 (0.75×0.65) */
const BRK_COLOR_F = { DEF:1.0, G:0.75, H:0.75, I:0.75, JK:0.4875, "L/M":0.4875, CAPE:0.4875 };
/* Clarity factors (from EF PL analysis): VVS=1.0, VS1=0.815, VS2=0.693, SI1=0.59, SI2=0.50 */
const BRK_CLARITY_F = { VVS:1.0, VS1:0.815, VS2:0.693, SI1:0.59, SI2:0.50 };

function mkPM_broker(shape, baseMap) {
  const pm = {};
  const shapeDisc = shape === "Round" ? 1.0 : shape === "Pear/Oval" ? 0.85 : shape === "Marquise" ? 0.80 : 0.70;
  for (const sr of SIEVE_RANGES) {
    pm[sr.id] = {};
    for (const co of COLORS_AST) {
      pm[sr.id][co] = {};
      for (const cl of CLARITIES) {
        const base = baseMap[sr.id] || 0;
        const cf = BRK_COLOR_F[co] || 0.4875;
        const clf = BRK_CLARITY_F[cl] || 0.50;
        pm[sr.id][co][cl] = Math.round(base * cf * clf * shapeDisc);
      }
    }
  }
  return pm;
}

const PM_PLA = { Round: mkPM_broker("Round", PLA_BASE), "Pear/Oval": mkPM_broker("Pear/Oval", PLA_BASE), Baguette: mkPM_broker("Baguette", PLA_BASE), Marquise: mkPM_broker("Marquise", PLA_BASE) };
const PM_PLM = { Round: mkPM_broker("Round", PLM_BASE), "Pear/Oval": mkPM_broker("Pear/Oval", PLM_BASE), Baguette: mkPM_broker("Baguette", PLM_BASE), Marquise: mkPM_broker("Marquise", PLM_BASE) };

/* ── PL-A (Amay's Price List V3 — actual granular prices, fancies +10%) ── */
const PLB_ROUND = {
  s1: {"DEF":{VVS:1348.6,VS1:1077.9,VS2:1077.9,SI1:927.9,SI2:729.0},"G":{VVS:1348.6,VS1:927.9,VS2:927.9,SI1:927.9,SI2:618.6},"H":{VVS:927.9,VS1:927.9,VS2:927.9,SI1:927.9,SI2:742.3},"I":{VVS:1073.5,VS1:894.6,VS2:751.5,SI1:662.0,SI2:501.0},"JK":{VVS:715.7,VS1:626.2,VS2:536.8,SI1:447.3,SI2:357.8},"L/M":{VVS:357.8,VS1:322.1,VS2:304.2,SI1:268.4,SI2:232.6},"CAPE":{VVS:268.4,VS1:250.5,VS2:232.6,SI1:214.7,SI2:196.8}},
  s2: {"DEF":{VVS:1034.1,VS1:847.3,VS2:847.3,SI1:764.1,SI2:600.4},"G":{VVS:1034.1,VS1:764.1,VS2:764.1,SI1:764.1,SI2:509.4},"H":{VVS:764.1,VS1:764.1,VS2:764.1,SI1:764.1,SI2:611.3},"I":{VVS:884.0,VS1:736.6,VS2:618.8,SI1:545.1,SI2:412.5},"JK":{VVS:589.3,VS1:515.6,VS2:442.0,SI1:368.3,SI2:294.6},"L/M":{VVS:294.6,VS1:265.2,VS2:250.4,SI1:221.0,SI2:191.5},"CAPE":{VVS:221.0,VS1:206.2,VS2:191.5,SI1:176.8,SI2:162.1}},
  s3: {"DEF":{VVS:842.4,VS1:708.2,VS2:708.2,SI1:593.9,SI2:466.6},"G":{VVS:842.4,VS1:593.9,VS2:593.9,SI1:593.9,SI2:395.9},"H":{VVS:593.9,VS1:593.9,VS2:593.9,SI1:593.9,SI2:475.1},"I":{VVS:688.3,VS1:573.6,VS2:481.8,SI1:424.5,SI2:321.2},"JK":{VVS:458.9,VS1:401.5,VS2:344.2,SI1:286.8,SI2:229.4},"L/M":{VVS:229.4,VS1:206.5,VS2:195.0,SI1:172.1,SI2:150.0},"CAPE":{VVS:172.1,VS1:160.6,VS2:150.0,SI1:150.0,SI2:150.0}},
  s4: {"DEF":{VVS:833.7,VS1:707.0,VS2:707.0,SI1:575.9,SI2:452.5},"G":{VVS:833.7,VS1:575.9,VS2:575.9,SI1:575.9,SI2:383.9},"H":{VVS:575.9,VS1:575.9,VS2:575.9,SI1:575.9,SI2:460.7},"I":{VVS:666.7,VS1:555.6,VS2:466.7,SI1:411.1,SI2:311.1},"JK":{VVS:444.4,VS1:388.9,VS2:333.3,SI1:277.8,SI2:222.2},"L/M":{VVS:222.2,VS1:200.0,VS2:188.9,SI1:166.7,SI2:150.0},"CAPE":{VVS:166.7,VS1:155.6,VS2:150.0,SI1:150.0,SI2:150.0}},
  s5: {"DEF":{VVS:829.4,VS1:729.8,VS2:729.8,SI1:590.4,SI2:463.9},"G":{VVS:829.4,VS1:590.4,VS2:590.4,SI1:590.4,SI2:393.6},"H":{VVS:590.4,VS1:590.4,VS2:590.4,SI1:590.4,SI2:472.3},"I":{VVS:682.4,VS1:568.6,VS2:477.7,SI1:420.8,SI2:318.4},"JK":{VVS:454.9,VS1:398.1,VS2:341.2,SI1:284.3,SI2:227.5},"L/M":{VVS:227.5,VS1:204.7,VS2:193.3,SI1:170.6,SI2:150.0},"CAPE":{VVS:170.6,VS1:159.2,VS2:150.0,SI1:150.0,SI2:150.0}},
  s6: {"DEF":{VVS:948.2,VS1:855.1,VS2:855.1,SI1:699.1,SI2:549.3},"G":{VVS:948.2,VS1:699.1,VS2:699.1,SI1:699.1,SI2:466.1},"H":{VVS:699.1,VS1:699.1,VS2:699.1,SI1:699.1,SI2:559.3},"I":{VVS:808.6,VS1:673.8,VS2:566.0,SI1:498.6,SI2:377.3},"JK":{VVS:539.1,VS1:471.7,VS2:404.3,SI1:336.9,SI2:269.5},"L/M":{VVS:269.5,VS1:242.6,VS2:229.1,SI1:202.2,SI2:175.2},"CAPE":{VVS:202.2,VS1:188.7,VS2:175.2,SI1:161.7,SI2:150.0}},
  s7: {"DEF":{VVS:1068.4,VS1:962.9,VS2:962.9,SI1:792.4,SI2:622.6},"G":{VVS:1068.4,VS1:792.4,VS2:792.4,SI1:792.4,SI2:528.3},"H":{VVS:792.4,VS1:792.4,VS2:792.4,SI1:792.4,SI2:633.9},"I":{VVS:917.5,VS1:764.6,VS2:642.2,SI1:565.8,SI2:428.2},"JK":{VVS:611.7,VS1:535.2,VS2:458.8,SI1:382.3,SI2:305.8},"L/M":{VVS:305.8,VS1:275.2,VS2:260.0,SI1:229.4,SI2:198.8},"CAPE":{VVS:229.4,VS1:214.1,VS2:198.8,SI1:183.5,SI2:168.2}},
  s8: {"DEF":{VVS:1200.0,VS1:1100.0,VS2:900.0,SI1:700.0,SI2:550.0},"G":{VVS:1000.0,VS1:800.0,VS2:700.0,SI1:600.0,SI2:400.0},"H":{VVS:800.0,VS1:700.0,VS2:600.0,SI1:500.0,SI2:400.0},"I":{VVS:600.0,VS1:500.0,VS2:420.0,SI1:370.0,SI2:280.0},"JK":{VVS:400.0,VS1:350.0,VS2:300.0,SI1:250.0,SI2:200.0},"L/M":{VVS:200.0,VS1:180.0,VS2:170.0,SI1:150.0,SI2:130.0},"CAPE":{VVS:150.0,VS1:140.0,VS2:130.0,SI1:120.0,SI2:110.0}},
};
function mkPLB_fancy(roundPM, mult) {
  const r = {};
  for (const sr of SIEVE_RANGES) { r[sr.id] = {}; for (const co of COLORS_AST) { r[sr.id][co] = {}; for (const cl of CLARITIES) { r[sr.id][co][cl] = Math.round((roundPM[sr.id]?.[co]?.[cl] || 0) * mult); } } }
  return r;
}
const PM_PLB = { Round: PLB_ROUND, "Pear/Oval": mkPLB_fancy(PLB_ROUND, 1.10), Baguette: mkPLB_fancy(PLB_ROUND, 1.10), Marquise: mkPLB_fancy(PLB_ROUND, 1.10) };

const EF_PL = [
  {cts:0.001,b1:5210,b2:4000,b3:3700,b4:2405},{cts:0.001,b1:5210,b2:4000,b3:3700,b4:2405},
  {cts:0.001,b1:2755,b2:2375,b3:2230,b4:1450},{cts:0.002,b1:2755,b2:2210,b3:2135,b4:1390},
  {cts:0.002,b1:1770,b2:1450,b3:1300,b4:845},{cts:0.002,b1:1765,b2:1425,b3:1300,b4:845},
  {cts:0.003,b1:1455,b2:1150,b3:1000,b4:650},{cts:0.003,b1:1450,b2:1150,b3:1000,b4:650},
  {cts:0.004,b1:1300,b2:1025,b3:875,b4:570},{cts:0.004,b1:1250,b2:1025,b3:875,b4:570},
  {cts:0.005,b1:1105,b2:900,b3:800,b4:520},{cts:0.005,b1:1095,b2:900,b3:800,b4:520},
  {cts:0.006,b1:1105,b2:880,b3:775,b4:505},{cts:0.007,b1:1035,b2:830,b3:775,b4:505},
  {cts:0.008,b1:895,b2:770,b3:700,b4:455},{cts:0.009,b1:850,b2:725,b3:700,b4:455},
  {cts:0.01,b1:850,b2:715,b3:600,b4:390},{cts:0.011,b1:850,b2:715,b3:600,b4:390},
  {cts:0.012,b1:900,b2:750,b3:620,b4:405},{cts:0.013,b1:900,b2:730,b3:620,b4:405},
  {cts:0.014,b1:900,b2:765,b3:590,b4:385},{cts:0.016,b1:900,b2:730,b3:590,b4:385},
  {cts:0.018,b1:800,b2:675,b3:575,b4:375},{cts:0.018,b1:800,b2:675,b3:575,b4:375},
  {cts:0.021,b1:800,b2:685,b3:575,b4:375},{cts:0.021,b1:800,b2:685,b3:575,b4:375},
  {cts:0.025,b1:800,b2:695,b3:575,b4:375},{cts:0.025,b1:800,b2:695,b3:575,b4:375},
  {cts:0.029,b1:840,b2:710,b3:580,b4:375},{cts:0.029,b1:840,b2:700,b3:575,b4:375},
  {cts:0.035,b1:840,b2:710,b3:580,b4:375},{cts:0.035,b1:840,b2:710,b3:575,b4:375},
  {cts:0.039,b1:840,b2:705,b3:575,b4:375},{cts:0.039,b1:840,b2:705,b3:575,b4:375},
  {cts:0.044,b1:840,b2:710,b3:575,b4:375},{cts:0.044,b1:840,b2:720,b3:575,b4:375},
  {cts:0.044,b1:820,b2:710,b3:580,b4:375},{cts:0.044,b1:820,b2:710,b3:575,b4:375},
  {cts:0.052,b1:850,b2:730,b3:585,b4:380},{cts:0.052,b1:850,b2:730,b3:575,b4:375},
  {cts:0.069,b1:850,b2:740,b3:600,b4:390},{cts:0.069,b1:820,b2:740,b3:600,b4:390},
  {cts:0.074,b1:815,b2:735,b3:600,b4:390},{cts:0.074,b1:815,b2:735,b3:600,b4:390},
  {cts:0.078,b1:870,b2:785,b3:640,b4:415},{cts:0.078,b1:870,b2:785,b3:640,b4:415},
  {cts:0.086,b1:925,b2:835,b3:700,b4:455},{cts:0.086,b1:925,b2:835,b3:700,b4:455},
  {cts:0.095,b1:955,b2:860,b3:705,b4:460},{cts:0.095,b1:955,b2:860,b3:700,b4:455},
  {cts:0.108,b1:1020,b2:920,b3:750,b4:490},{cts:0.108,b1:1020,b2:920,b3:730,b4:475},
  {cts:0.116,b1:1030,b2:930,b3:750,b4:490},{cts:0.116,b1:1030,b2:930,b3:750,b4:490},
  {cts:0.135,b1:1030,b2:930,b3:755,b4:490},{cts:0.135,b1:1030,b2:930,b3:750,b4:490},
  {cts:0.135,b1:1055,b2:950,b3:780,b4:505},{cts:0.135,b1:1055,b2:950,b3:775,b4:505},
  {cts:0.146,b1:1145,b2:1030,b3:875,b4:570},{cts:0.146,b1:1145,b2:1030,b3:875,b4:570},
  {cts:0.159,b1:1220,b2:1100,b3:930,b4:605},{cts:0.159,b1:1220,b2:1100,b3:930,b4:605},
  {cts:0.175,b1:1245,b2:1120,b3:950,b4:620},{cts:0.175,b1:1245,b2:1120,b3:950,b4:620},
  {cts:0.175,b1:1275,b2:1150,b3:980,b4:635},{cts:0.175,b1:1275,b2:1150,b3:980,b4:635},
];

/* ──────────── PARCEL DEFINITIONS ──────────── */
const PARCEL_DEFS = [
  {
    id: "79_sw", label: "+7+9+11 GEM SW", type: "SW",
    segs: ["-9+7","-11+9","+11"],
    parcel: { date:"2026-03-16", tender:"ODC", number:"91", name:"+11+9+7 White Gem Z", totalCts:367.89, pcs:1184, lastSold:206, bidPrice:"" },
    flu: [
      { none:{c:16.77,s:107}, fnt:{c:1.33,s:9}, ms:{c:1.93,s:13} },
      { none:{c:47.61,s:182}, fnt:{c:1.37,s:6}, ms:{c:4.02,s:15} },
      { none:{c:41.25,s:85}, fnt:{c:2.78,s:5}, ms:{c:1.65,s:3} },
    ],
    segInfo: [{label:"-9+7",sCts:20.06,sPcs:129},{label:"-11+9",sCts:52.99,sPcs:203},{label:"+11",sCts:45.77,sPcs:93}],
    odcPrf: [{c1:30,c2:61,c3:9},{c1:28,c2:61,c3:11},{c1:27,c2:61,c3:12}], // real ODC Lot 91
    pre: [
      {"DEF":{"VVS":{pcs:46,cts:7.07},"VS1":{pcs:15,cts:2.33},"VS2":{pcs:7,cts:1.08}},"G":{"VVS":{pcs:56,cts:8.8},"VS1":{pcs:10,cts:1.55},"VS2":{pcs:3,cts:0.51}},"H":{"VVS":{pcs:60,cts:9.55},"VS1":{pcs:8,cts:1.244},"VS2":{pcs:5,cts:0.78}},"I":{"VVS":{pcs:16,cts:2.32}},"JK":{"VVS":{pcs:59,cts:9.02}}},
      {"DEF":{"VVS":{pcs:87,cts:22.62},"VS1":{pcs:14,cts:3.65},"VS2":{pcs:4,cts:1.04}},"G":{"VVS":{pcs:93,cts:24.18},"VS1":{pcs:20,cts:5.22},"VS2":{pcs:5,cts:1.33}},"H":{"VVS":{pcs:105,cts:27.23},"VS1":{pcs:25,cts:6.53},"VS2":{pcs:7,cts:1.89}},"I":{"VVS":{pcs:44,cts:11.31},"VS1":{pcs:6,cts:1.57}},"JK":{"VVS":{pcs:85,cts:22.23},"VS1":{pcs:13,cts:3.39}}},
      {"DEF":{"VVS":{pcs:74,cts:35.8},"VS1":{pcs:18,cts:8.71}},"G":{"VVS":{pcs:81,cts:39.7},"VS2":{pcs:2,cts:0.84}},"H":{"VVS":{pcs:67,cts:33.13},"VS1":{pcs:3,cts:1.48},"VS2":{pcs:2,cts:0.97}},"I":{"VVS":{pcs:50,cts:24.62},"VS2":{pcs:1,cts:0.49}},"JK":{"VVS":{pcs:89,cts:43.74},"VS1":{pcs:2,cts:0.98},"VS2":{pcs:2,cts:0.84}}},
    ],
  },
  {
    id: "79_mb", label: "+7+9+11 GEM MB", type: "MB",
    segs: ["-9+7","-11+9","+11"],
    parcel: { date:"2026-03-16", tender:"ODC", number:"92", name:"+11+9+7 White Gem MB", totalCts:694.18, pcs:2480, lastSold:160, bidPrice:"" },
    flu: [
      { none:{c:26.5,s:165}, fnt:{c:6.22,s:40}, ms:{c:0,s:0} },
      { none:{c:56.47,s:225}, fnt:{c:5.43,s:21}, ms:{c:6.77,s:26} },
      { none:{c:64.67,s:131}, fnt:{c:9.68,s:20}, ms:{c:6.97,s:16} },
    ],
    segInfo: [{label:"-9+7",sCts:32.74,sPcs:205},{label:"-11+9",sCts:68.56,sPcs:272},{label:"+11",sCts:81.34,sPcs:167}],
    odcPrf: [{c1:47,c2:42,c3:11},{c1:43,c2:47,c3:10},{c1:37,c2:53,c3:10}], // real ODC Lot 92: -9+7/47-42-11, -11+9/43-47-10, +11/37-53-10
    pre_mb: [
      // -9+7: I separate, J→JK
      {"DEF":{"Round":{"VVS":{pcs:180,cts:28.864},"VS1":{pcs:40,cts:6.336}},"Pear/Oval":{"VVS":{pcs:32,cts:5.09},"VS1":{pcs:7,cts:1.12}}},"G":{"Round":{"VVS":{pcs:125,cts:19.86},"VS1":{pcs:22,cts:3.5}},"Pear/Oval":{"VVS":{pcs:13,cts:2.13},"VS1":{pcs:3,cts:0.47}}},"H":{"Round":{"VVS":{pcs:125,cts:19.92},"VS1":{pcs:22,cts:3.51}},"Pear/Oval":{"VVS":{pcs:29,cts:4.63},"VS1":{pcs:3,cts:0.51}}},"I":{"Round":{"VVS":{pcs:86,cts:13.66}},"Pear/Oval":{"VVS":{pcs:10,cts:1.52}}},"JK":{"Round":{"VVS":{pcs:85,cts:13.65}},"Pear/Oval":{"VVS":{pcs:9,cts:1.51}}}},
      // -11+9: J→JK
      {"DEF":{"Round":{"VVS":{pcs:231,cts:57.82},"VS1":{pcs:58,cts:14.46}},"Pear/Oval":{"VVS":{pcs:29,cts:7.23},"VS1":{pcs:3,cts:0.8}}},"G":{"Round":{"VVS":{pcs:219,cts:54.83},"VS1":{pcs:36,cts:8.93}},"Pear/Oval":{"VVS":{pcs:39,cts:9.68},"VS1":{pcs:6,cts:1.58}}},"H":{"Round":{"VVS":{pcs:165,cts:39.42},"VS1":{pcs:29,cts:6.96}},"Pear/Oval":{"VVS":{pcs:33,cts:10.44},"VS1":{pcs:4,cts:1.16}}},"I":{"Round":{"VVS":{pcs:127,cts:31.85}},"Pear/Oval":{"VVS":{pcs:17,cts:4.34}}},"JK":{"Round":{"VVS":{pcs:67,cts:16.77}},"Pear/Oval":{"VVS":{pcs:13,cts:3.2}}}},
      // +11: K→JK
      {"DEF":{"Round":{"VVS":{pcs:122,cts:59.12},"VS1":{pcs:30,cts:14.78}},"Pear/Oval":{"VVS":{pcs:13,cts:6.15},"VS1":{pcs:4,cts:2.05}}},"G":{"Round":{"VVS":{pcs:91,cts:44.12},"VS1":{pcs:16,cts:7.79}},"Pear/Oval":{"VVS":{pcs:10,cts:4.93},"VS1":{pcs:2,cts:0.87}}},"H":{"Round":{"VVS":{pcs:84,cts:40.8},"VS1":{pcs:15,cts:7.2}},"Pear/Oval":{"VVS":{pcs:14,cts:7.23},"VS1":{pcs:3,cts:1.28}}},"I":{"Round":{"VVS":{pcs:36,cts:17.7}},"Pear/Oval":{"VVS":{pcs:8,cts:3.9}}},"JK":{"Round":{"VVS":{pcs:120,cts:58.6},"VS1":{pcs:12,cts:5.8}},"Pear/Oval":{"VVS":{pcs:33,cts:16.1}}}},
    ],
  },
  {
    id: "53_sw", label: "+5+3 GEM SW", type: "SW",
    segs: ["-7+5","-5+3"],
    sampleExtrap: true, // combined sample → ratio → apply to each segment's full rough cts
    segRoughCts: [55.52, 3.88], // from ODC profile: -7+5=55.52, -5+3=3.88
    parcel: { date:"2026-03-16", tender:"ODC", number:"101", name:"+5+3 Gem SW", totalCts:59.41, pcs:0, lastSold:120, bidPrice:"" },
    flu: [
      { none:{c:15,s:135}, fnt:{c:0,s:0}, ms:{c:1.18,s:16} },
      { none:{c:15,s:135}, fnt:{c:0,s:0}, ms:{c:1.18,s:16} }, // same fluo for both segs (combined sample)
    ],
    segInfo: [{label:"-7+5",sCts:16.18,sPcs:151},{label:"-5+3",sCts:0,sPcs:0}],
    odcPrf: [{c1:47,c2:44,c3:9},{c1:47,c2:44,c3:9}], // real ODC: Lot 101 combined 47/44/9
    // Combined sample assortment (entered once, ratios applied to both segments)
    combinedSample: {"DEF":{"VVS":{pcs:90,cts:9.85}},"G":{"VVS":{pcs:55,cts:5.69}},"H":{"VVS":{pcs:6,cts:0.64}}},
    combinedSampleTotal: { cts: 16.18, pcs: 151 },
  },
  {
    id: "53_mb", label: "+5+3 GEM MB", type: "MB",
    segs: ["-7+5","-5+3"],
    sampleExtrap: true,
    segRoughCts: [191.13, 27.24], // from ODC profile: -7+5=191.13, -5+3=27.24
    parcel: { date:"2026-03-16", tender:"ODC", number:"102", name:"+5+3 Gem MB", totalCts:218.37, pcs:0, lastSold:102, bidPrice:"" },
    flu: [
      { none:{c:43.12,s:468}, fnt:{c:0,s:0}, ms:{c:8.38,s:82} },
      { none:{c:43.12,s:468}, fnt:{c:0,s:0}, ms:{c:8.38,s:82} }, // same fluo for both segs
    ],
    segInfo: [{label:"-7+5",sCts:51.49,sPcs:550},{label:"-5+3",sCts:0,sPcs:0}],
    odcPrf: [{c1:48,c2:43,c3:9},{c1:48,c2:43,c3:9}], // real ODC: Lot 102 combined 48/43/9
    combinedSample_mb: {"DEF":{"Round":{"VVS":{pcs:291,cts:27.13}}},"G":{"Round":{"VVS":{pcs:100,cts:8.96}}},"H":{"Round":{"VVS":{pcs:99,cts:8.96}}},"I":{"Round":{"VVS":{pcs:30,cts:2.72}}},"JK":{"Round":{"VVS":{pcs:30,cts:2.71}}}},
    combinedSampleTotal: { cts: 50.48, pcs: 550 },
  },
];

/* ──────────── HELPERS ──────────── */
function getBk(ci, cli) {
  // ci: 0=DEF, 1=G, 2=H, 3=I, 4=JK, 5=L/M, 6=CAPE
  // cli: 0=VVS, 1=VS1, 2=VS2, 3=SI1, 4=SI2
  if (cli >= 3) return ["b4"]; // SI1, SI2 always commercial
  if (ci >= 3) return ["b4"];  // I, JK, L/M, CAPE always commercial
  if (ci === 0) { if (cli === 0) return ["b1"]; if (cli <= 2) return ["b2"]; return ["b4"]; } // DEF
  if (ci === 1) { if (cli === 0) return ["b1","b3"]; return ["b3"]; } // G
  if (ci === 2) { if (cli <= 2) return ["b3"]; return ["b4"]; } // H (VVS,VS1,VS2 only non-commercial)
  return ["b4"];
}

function efPrice(sr, ci, cli) {
  const bk = getBk(ci, cli);
  const rows = EF_PL.filter(r => r.cts >= sr.min && r.cts <= sr.max);
  if (!rows.length) return 0;
  let t = 0;
  for (const r of rows) { let p = 0; for (const b of bk) p += r[b]; p /= bk.length; t += p; }
  return Math.round(t / rows.length);
}

function mkPM(shape) {
  const pm = {};
  for (const sr of SIEVE_RANGES) {
    pm[sr.id] = {};
    for (let ci = 0; ci < COLORS_AST.length; ci++) {
      pm[sr.id][COLORS_AST[ci]] = {};
      for (let cli = 0; cli < CLARITIES.length; cli++) {
        if (shape === "Round") { pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = efPrice(sr, ci, cli); }
        else if (shape === "Baguette") {
          if (sr.max <= 0.004 && ci <= 1 && cli === 0) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 2000;
          else if (sr.min >= 0.005 && sr.max <= 0.044 && ci <= 1 && cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 1450;
          else if (sr.min >= 0.005 && sr.max <= 0.044 && ci <= 2 && cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 950;
          else pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = Math.round(efPrice(sr, ci, cli) * 0.7);
        } else {
          if (cli <= 1) pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 1250;
          else pm[sr.id][COLORS_AST[ci]][CLARITIES[cli]] = 850;
        }
      }
    }
  }
  return pm;
}

function findSv(avg) {
  if (!avg || avg <= 0) return null;
  for (const sr of SIEVE_RANGES) if (avg >= sr.min && avg <= sr.max) return sr;
  if (avg < SIEVE_RANGES[0].min) return SIEVE_RANGES[0];
  return SIEVE_RANGES[SIEVE_RANGES.length - 1];
}

function buildA(type, segs, pre, pre_mb, def) {
  // For sample extrapolation parcels (+5+3): compute ratios from combined sample, apply to each segment's rough cts
  if (def?.sampleExtrap) {
    const sample = type === "MB" ? def.combinedSample_mb : def.combinedSample;
    const sTotal = def.combinedSampleTotal;
    if (!sample || !sTotal || !sTotal.cts) return segs.map(() => ({}));

    return segs.map((_, si) => {
      const segCts = def.segRoughCts?.[si] || 0;
      const ctsRatio = sTotal.cts > 0 ? segCts / sTotal.cts : 0;
      const s = {};
      COLORS_AST.forEach(c => {
        s[c] = {};
        if (type === "MB") {
          SHAPES.forEach(sh => {
            s[c][sh] = {};
            CLARITIES.forEach(cl => {
              const p = sample?.[c]?.[sh]?.[cl];
              if (p && (p.pcs || p.cts)) {
                s[c][sh][cl] = {
                  pcs: p.pcs ? Math.round(parseFloat(p.pcs) * ctsRatio) : "",
                  cts: p.cts ? Math.round(parseFloat(p.cts) * ctsRatio * 100) / 100 : ""
                };
              } else {
                s[c][sh][cl] = { pcs: "", cts: "" };
              }
            });
          });
        } else {
          CLARITIES.forEach(cl => {
            const p = sample?.[c]?.[cl];
            if (p && (p.pcs || p.cts)) {
              s[c][cl] = {
                pcs: p.pcs ? Math.round(parseFloat(p.pcs) * ctsRatio) : "",
                cts: p.cts ? Math.round(parseFloat(p.cts) * ctsRatio * 100) / 100 : ""
              };
            } else {
              s[c][cl] = { pcs: "", cts: "" };
            }
          });
        }
      });
      return s;
    });
  }

  // Normal path for +7+9+11 parcels (direct entry per segment)
  return segs.map((_, si) => {
    const s = {};
    COLORS_AST.forEach(c => {
      s[c] = {};
      if (type === "MB") {
        SHAPES.forEach(sh => {
          s[c][sh] = {};
          CLARITIES.forEach(cl => {
            const p = pre_mb?.[si]?.[c]?.[sh]?.[cl];
            s[c][sh][cl] = { pcs: p?.pcs ?? "", cts: p?.cts ?? "" };
          });
        });
      } else {
        CLARITIES.forEach(cl => {
          const p = pre?.[si]?.[c]?.[cl];
          s[c][cl] = { pcs: p?.pcs ?? "", cts: p?.cts ?? "" };
        });
      }
    });
    return s;
  });
}

const f = (v, d = 2) => (v != null && !isNaN(v)) ? Number(v).toFixed(d) : "";
const fd = (v) => (v != null && !isNaN(v) && v !== 0) ? "$" + Number(v).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "";

/* ── CTS to MM lookup (from Amay's EFI Round Prices mapping) ── */
const CTS_TO_MM = [
  [0.001,0.57],[0.002,0.72],[0.003,0.85],[0.004,0.95],[0.005,1.05],[0.006,1.12],[0.007,1.17],[0.008,1.22],
  [0.009,1.27],[0.010,1.32],[0.011,1.37],[0.012,1.42],[0.013,1.47],[0.014,1.52],[0.016,1.57],[0.018,1.65],
  [0.021,1.75],[0.025,1.85],[0.029,1.95],[0.035,2.05],[0.039,2.15],[0.044,2.30],[0.052,2.45],[0.069,2.55],
  [0.074,2.65],[0.078,2.75],[0.086,2.85],[0.095,2.95],[0.108,3.05],[0.116,3.15],[0.135,3.35],[0.146,3.45],
  [0.159,3.55],[0.175,3.65],[0.200,3.75]
];
function ctsToMM(cts) {
  if (cts <= 0) return 0;
  if (cts <= CTS_TO_MM[0][0]) return CTS_TO_MM[0][1];
  if (cts >= CTS_TO_MM[CTS_TO_MM.length-1][0]) return CTS_TO_MM[CTS_TO_MM.length-1][1];
  for (let i = 0; i < CTS_TO_MM.length - 1; i++) {
    const [c0, m0] = CTS_TO_MM[i], [c1, m1] = CTS_TO_MM[i+1];
    if (cts >= c0 && cts <= c1) return m0 + (cts - c0) / (c1 - c0) * (m1 - m0);
  }
  return 0;
}
const isHot = (avgSize, co, cl) => {
  if (!avgSize || avgSize <= 0) return false;
  if (co && cl && isCommercial(co, cl)) return false;
  const mm = ctsToMM(avgSize);
  if (mm >= 1.40 && mm <= 1.49) return true;    // Band 1: 1.40-1.49mm
  if (mm >= 2.00 && mm <= 2.09) return true;    // Band 2: 2.00-2.09mm
  if (mm >= 2.70 && mm <= 2.89) return true;    // Band 3a: 2.70-2.89mm
  if (mm >= 3.30 && mm <= 3.685) return true;   // Band 3b: 3.30-3.69mm
  return false;
};

/* ──────────── CHART COLORS ──────────── */
const CK = { hot:"#16a34a", cold:"#dc2626", def:"#2563eb", g:"#0891b2", h:"#7c3aed", ij:"#c026d3", k:"#ea580c", lm:"#64748b", cape:"#92400e" };
const PIE_COL = ["#2563eb","#0891b2","#7c3aed","#06b6d4","#ea580c","#64748b","#92400e"];

/* ──────────── NUMERIC INPUT ──────────── */
function NI({ value, onChange, style: st, className }) {
  return <input type="text" value={value ?? ""}
    onChange={e => { const v = e.target.value; if (v === "" || v === "." || /^-?\d*\.?\d*$/.test(v)) onChange(v === "" ? "" : v); }}
    onBlur={e => { const v = parseFloat(e.target.value); onChange(isNaN(v) ? "" : v); }}
    className={className || "ni"}
    style={st} />;
}

/* ──────────── STYLES (dark/light theme) ──────────── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
* { box-sizing: border-box; margin: 0; padding: 0; }

[data-theme="light"] {
  --bg: #f0f2f5; --bg2: #e8eaef; --card: #ffffff; --card2: #f8f9fc;
  --border: #dde1e8; --border2: #c8cdd6;
  --text: #1a1d23; --text2: #4b5060; --text3: #8690a2;
  --blue: #2563eb; --blue-bg: #eff4ff; --green: #16a34a; --green-bg: #ecfdf5;
  --red: #dc2626; --red-bg: #fef2f2; --amber: #d97706; --amber-bg: #fffbeb;
  --purple: #7c3aed; --purple-bg: #f5f3ff;
  --yellow-input: #fffde7; --yellow-border: #e5d85c;
  --hdr-bg: linear-gradient(135deg, #1e3a5f, #162a45); --hdr-text: #fff; --hdr-sub: rgba(255,255,255,.55);
  --shadow: 0 1px 4px rgba(0,0,0,.06);
}
[data-theme="dark"] {
  --bg: #0f1117; --bg2: #1a1d27; --card: #1e2130; --card2: #252839;
  --border: #2d3148; --border2: #3d4260;
  --text: #e2e5ea; --text2: #a0a8b8; --text3: #6b7385;
  --blue: #60a5fa; --blue-bg: rgba(96,165,250,.12); --green: #4ade80; --green-bg: rgba(74,222,128,.1);
  --red: #f87171; --red-bg: rgba(248,113,113,.1); --amber: #fbbf24; --amber-bg: rgba(251,191,36,.1);
  --purple: #a78bfa; --purple-bg: rgba(167,139,250,.1);
  --yellow-input: #2a2815; --yellow-border: #5c5320;
  --hdr-bg: linear-gradient(135deg, #111827, #0f172a); --hdr-text: #f1f5f9; --hdr-sub: rgba(255,255,255,.4);
  --shadow: 0 1px 4px rgba(0,0,0,.3);
}
body { font-family: 'DM Sans', -apple-system, sans-serif; background: var(--bg); color: var(--text); font-size: 13px; transition: background .3s, color .3s; }

.ni { background: var(--card); border: 1px solid var(--border); border-radius: 5px; padding: 5px 8px; color: var(--text); font-family: 'DM Mono', monospace; font-size: 12px; width: 72px; text-align: right; outline: none; transition: all .15s; }
.ni:focus { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue-bg); }
.ni-edit { background: var(--yellow-input) !important; border-color: var(--yellow-border) !important; }
.ni-edit:focus { border-color: var(--amber) !important; box-shadow: 0 0 0 2px var(--amber-bg) !important; }

.hdr { background: var(--hdr-bg); padding: 0 24px; display: flex; align-items: center; gap: 12px; height: 52px; position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 12px rgba(0,0,0,.2); }
.logo { font-size: 14px; font-weight: 700; color: var(--hdr-text); letter-spacing: 1px; display:flex; align-items:center; gap:8px; cursor:pointer; }
.logo svg { width: 20px; height: 20px; stroke: #60a5fa; }

.badge { display: inline-flex; align-items: center; padding: 3px 12px; border-radius: 20px; font-size: 10px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
.badge-blue { background: rgba(96,165,250,.15); color: #93c5fd; }
.badge-green { background: rgba(74,222,128,.15); color: #86efac; }
.badge-amber { background: rgba(251,191,36,.15); color: #fbbf24; }
.badge-red { background: rgba(248,113,113,.15); color: #fca5a5; }

.parcel-tabs { display: flex; gap: 0; background: var(--card); border-bottom: 2px solid var(--border); padding: 0 24px; overflow-x: auto; }
.parcel-tab { padding: 12px 20px; cursor: pointer; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text3); border-bottom: 3px solid transparent; background: none; border-top: none; border-left: none; border-right: none; font-family: inherit; white-space: nowrap; transition: all .15s; }
.parcel-tab:hover { color: var(--text2); background: var(--bg2); }
.parcel-tab.active { color: var(--blue); border-bottom-color: var(--blue); background: var(--blue-bg); }

.tabs { display: flex; gap: 0; background: var(--card); border-bottom: 1px solid var(--border); padding: 0 24px; overflow-x: auto; }
.tab-btn { padding: 10px 18px; cursor: pointer; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: var(--text3); border: none; border-bottom: 2px solid transparent; background: none; font-family: inherit; white-space: nowrap; transition: all .15s; }
.tab-btn:hover { color: var(--text2); }
.tab-btn.active { color: var(--blue); border-bottom-color: var(--blue); }

.body { padding: 18px 24px; max-width: 1560px; margin: 0 auto; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; margin-bottom: 16px; overflow: hidden; box-shadow: var(--shadow); }
.card-hdr { padding: 10px 16px; background: var(--card2); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.card-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--text2); }
.card-body { padding: 14px 16px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.field { display: flex; flex-direction: column; gap: 3px; }
.lbl { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: var(--text3); }
.inp { background: var(--card); border: 1px solid var(--border); border-radius: 5px; padding: 6px 10px; color: var(--text); font-size: 12px; font-family: inherit; outline: none; transition: all .15s; }
.inp:focus { border-color: var(--blue); box-shadow: 0 0 0 2px var(--blue-bg); }

table { width: 100%; border-collapse: collapse; font-size: 12px; }
th { padding: 6px 8px; background: var(--card2); border-bottom: 1px solid var(--border); text-align: center; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text3); white-space: nowrap; }
td { padding: 4px 6px; border-bottom: 1px solid var(--border); text-align: right; color: var(--text); }
td.left { text-align: left; font-weight: 600; color: var(--blue); white-space: nowrap; }
td.left2 { text-align: left; color: var(--text3); font-size: 11px; }

.seg-btn { padding: 8px 20px; cursor: pointer; font-size: 12px; font-weight: 700; color: var(--text3); background: var(--card); border: 1.5px solid var(--border); border-radius: 6px; font-family: inherit; transition: all .15s; letter-spacing: 0.5px; }
.seg-btn:hover { border-color: var(--blue); color: var(--text2); }
.seg-btn.active { color: #fff; background: var(--blue); border-color: var(--blue); box-shadow: 0 2px 6px rgba(37,99,235,.25); }

.metric { background: var(--card2); padding: 12px 18px; border-radius: 8px; min-width: 110px; text-align: center; border: 1px solid var(--border); }
.metric-val { font-size: 16px; font-weight: 700; color: var(--blue); font-family: 'DM Mono', monospace; }
.metric-label { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
.metric-green .metric-val { color: var(--green); } .metric-green { border-left: 3px solid var(--green); }
.metric-red .metric-val { color: var(--red); } .metric-red { border-left: 3px solid var(--red); }
.metric-amber .metric-val { color: var(--amber); } .metric-amber { border-left: 3px solid var(--amber); }
.overflow-x { overflow-x: auto; }
.green { color: var(--green); } .red { color: var(--red); } .amber { color: var(--amber); }
.blue { color: var(--blue); } .purple { color: var(--purple); }
.bold { font-weight: 700; }
.chart-wrap { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 14px; }
.chart-box { flex: 1; min-width: 320px; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; box-shadow: var(--shadow); }
.chart-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--text2); margin-bottom: 10px; }
.var-green { color: var(--green); font-weight: 700; } .var-amber { color: var(--amber); font-weight: 700; } .var-red { color: var(--red); font-weight: 700; }

.master-btn { padding: 6px 16px; cursor: pointer; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border: none; border-radius: 6px; font-family: inherit; transition: all .2s; white-space: nowrap; }
.master-btn.inactive { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; box-shadow: 0 2px 8px rgba(217,119,6,.3); }
.master-btn.inactive:hover { box-shadow: 0 4px 12px rgba(217,119,6,.45); transform: translateY(-1px); }
.master-btn.active { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; box-shadow: 0 2px 8px rgba(217,119,6,.4); }
.hdr-divider { width: 1px; height: 24px; background: rgba(255,255,255,.15); margin: 0 4px; }

.theme-btn { background: none; border: 1px solid rgba(255,255,255,.2); border-radius: 6px; padding: 4px 10px; cursor: pointer; color: var(--hdr-text); font-size: 14px; transition: all .15s; }
.theme-btn:hover { background: rgba(255,255,255,.1); }

.home-hero { min-height: calc(100vh - 52px); background: linear-gradient(135deg, #0f172a, #1e293b); padding: 40px; }
.home-card { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 20px; cursor: pointer; transition: all .2s; }
.home-card:hover { background: rgba(255,255,255,.08); border-color: rgba(96,165,250,.3); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }

.breadcrumb { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--hdr-sub); }
.breadcrumb a, .breadcrumb span.link { color: rgba(255,255,255,.7); cursor: pointer; text-decoration: none; }
.breadcrumb a:hover, .breadcrumb span.link:hover { color: #fff; text-decoration: underline; }
.breadcrumb .sep { color: rgba(255,255,255,.3); }
`;

/* ──────────── MAIN APP ──────────── */
const TABS = ["Parcel Input","Assortment","Polish Calc","Price Masters","Summary","Demand Forecast","Quick View"];
const MASTER_TAB = 99;
const BID_COMPARE_TAB = 98;

export default function App() {
  /* ── NAVIGATION ── */
  const [page, setPage] = useState("home"); // "home" | "tender" | "parcel"
  const [theme, setTheme] = useState(() => localStorage.getItem("ef_theme") || "dark");
  const toggleTheme = () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); localStorage.setItem("ef_theme", t); };
  const CX = theme === "dark" ? "#94a3b8" : "#4b5060"; // chart x-axis tick
  const CY = theme === "dark" ? "#64748b" : "#8690a2"; // chart y-axis tick  
  const CG = theme === "dark" ? "#2d3148" : "#e2e5ea"; // chart grid line
  const CL = theme === "dark" ? "#94a3b8" : "#8690a2"; // chart label

  const [activePcl, setActivePcl] = useState(0);
  const [tab, setTab] = useState(0);

  // Per-parcel state
  const [parcels, setParcels] = useState(() => PARCEL_DEFS.map(d => ({
    ...d.parcel, type: d.type, segs: d.segInfo
  })));
  const [cfgs, setCfgs] = useState(() => PARCEL_DEFS.map(d => ({
    yld: d.type === "SW"
      ? { Round: 0.40, "Pear/Oval": 0.45, Baguette: 0.45, Marquise: 0.45 }
      : { Round: 0.38, "Pear/Oval": 0.41, Baguette: 0.41, Marquise: 0.41 },
    mult: [[1,1,1],[1,1,1],[1,1,1],[1,1,1]],
    fd: { med:25, stg:25 }, efDisc: 0
  })));
  const [flus, setFlus] = useState(() => PARCEL_DEFS.map(d => d.flu));
  const [asts, setAsts] = useState(() => PARCEL_DEFS.map(d => buildA(d.type, d.segs, d.pre, d.pre_mb, d)));
  const [odcPrfs, setOdcPrfs] = useState(() => PARCEL_DEFS.map(d => d.odcPrf));
  const [pm] = useState(() => ({ Round: mkPM("Round"), "Pear/Oval": mkPM("Pear/Oval"), Baguette: mkPM("Baguette"), Marquise: mkPM("Marquise") }));
  const [pmOverrides, setPmOverrides] = useState({});
  const [pricingMode, setPricingMode] = useState("PL_A"); // "PL_A" (Amay V3) | "PL_M" (Market)

  // Master Summary — bid calculator state
  const [globalLabour, setGlobalLabour] = useState(30); // default $/ct labour
  const [globalProfit, setGlobalProfit] = useState(10); // default profit %
  const [perParcelBid, setPerParcelBid] = useState(() => PARCEL_DEFS.map(() => ({ labour: "", profit: "", useGlobal: true })));

  const [sg, setSg] = useState(0);
  const [ps, setPs] = useState("Round");
  const [pv, setPv] = useState("s1");

  const def = PARCEL_DEFS[activePcl];
  const parcel = parcels[activePcl];
  const cfg = cfgs[activePcl];
  const flu = flus[activePcl];
  const ast = asts[activePcl];
  const odcPrf = odcPrfs[activePcl];
  const SEGS = def.segs;

  const activePM = pricingMode === "PL_M" ? PM_PLM : PM_PLB;
  const getPM = useCallback((sh, sv, co, cl) => {
    const k = `${activePcl}:${sh}:${sv}:${co}:${cl}`;
    if (pmOverrides[k] !== undefined) return pmOverrides[k];
    const src = pricingMode === "PL_M" ? PM_PLM : PM_PLB;
    return src[sh]?.[sv]?.[co]?.[cl] || 0;
  }, [pmOverrides, activePcl, pricingMode]);

  const uPM = (sh, sv, co, cl, v) => {
    const k = `${activePcl}:${sh}:${sv}:${co}:${cl}`;
    setPmOverrides(p => ({ ...p, [k]: v === "" ? 0 : parseFloat(v) || 0 }));
  };

  // Update helpers
  const setParcel = fn => setParcels(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setCfg = fn => setCfgs(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setFlu = fn => setFlus(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setAst = fn => setAsts(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });
  const setOdcPrf = fn => setOdcPrfs(p => { const n = [...p]; n[activePcl] = typeof fn === "function" ? fn(n[activePcl]) : fn; return n; });

  const uA = (si, co, sh, cl, fk, v) => {
    setAst(p => { const n = JSON.parse(JSON.stringify(p)); if (def.type === "MB") n[si][co][sh][cl][fk] = v; else n[si][co][cl][fk] = v; return n; });
  };

  /* ──────── POLISH CALCULATION ──────── */
  const pol = useMemo(() => {
    const res = [];
    for (let si = 0; si < SEGS.length; si++) {
      const sr = []; const sg2 = ast[si]; const fl = flu[si];
      if (!fl) { res.push([]); continue; }
      const tf = (parseFloat(fl.none?.c) || 0) + (parseFloat(fl.fnt?.c) || 0) + (parseFloat(fl.ms?.c) || 0);
      const np = tf > 0 ? (parseFloat(fl.none?.c) || 0) / tf : 1;
      const fp = tf > 0 ? (parseFloat(fl.fnt?.c) || 0) / tf : 0;
      const mp = tf > 0 ? (parseFloat(fl.ms?.c) || 0) / tf : 0;
      const shps = def.type === "MB" ? SHAPES : ["Round"];
      for (const co of COLORS_AST) {
        for (const sh of shps) {
          for (const cl of CLARITIES) {
            let rP, rC;
            if (def.type === "MB") { rP = Math.round(parseFloat(sg2[co]?.[sh]?.[cl]?.pcs) || 0); rC = parseFloat(sg2[co]?.[sh]?.[cl]?.cts) || 0; }
            else { rP = Math.round(parseFloat(sg2[co]?.[cl]?.pcs) || 0); rC = parseFloat(sg2[co]?.[cl]?.cts) || 0; }
            if (rP === 0 && rC === 0) continue;
            const sI = SHAPES.indexOf(sh); const yi = cfg.yld[sh] || 0.43;
            const mu = cfg.mult[sI >= 0 ? sI : 0][si] || 1.05;
            const pC = rC * yi; const pP = Math.round(rP * mu);
            const av = pP > 0 ? pC / pP : 0;
            const sv = findSv(av);
            let rt = sv ? getPM(sh, sv.id, co, cl) : 0;
            if (av >= 0.052 && cfg.efDisc > 0) rt = Math.round(rt * (1 - cfg.efDisc / 100));
            const md = cfg.fd.med / 100; const sd = cfg.fd.stg / 100;
            const ef = rt * ((np + fp) + mp * (1 - (md + sd) / 2));
            const ppc = pP > 0 ? (pC * ef) / pP : 0;
            sr.push({ seg: SEGS[si], si, co, sh, cl, rP, rC, pC, pP, av, sieve: sv?.sieve || "N/A", mm: sv?.mm || "", rt, ef: Math.round(ef), tot: Math.round(pC * ef), ppc: Math.round(ppc * 100) / 100 });
          }
        }
      }
      res.push(sr);
    }
    return res;
  }, [ast, cfg, flu, def, SEGS, getPM]);

  const all = pol.flat();
  const gr = {
    rC: all.reduce((s, r) => s + r.rC, 0), rP: all.reduce((s, r) => s + r.rP, 0),
    pC: all.reduce((s, r) => s + r.pC, 0), pP: all.reduce((s, r) => s + r.pP, 0),
    tot: all.reduce((s, r) => s + r.tot, 0)
  };

  // Compute polish for ALL parcels (for Master Summary tab)
  const allParcelPolish = useMemo(() => {
    return PARCEL_DEFS.map((pDef, pi) => {
      const pAst = asts[pi]; const pCfg = cfgs[pi]; const pFlu = flus[pi];
      const pSegs = pDef.segs;
      const rows = [];
      for (let si = 0; si < pSegs.length; si++) {
        const sg2 = pAst[si]; const fl = pFlu[si];
        if (!fl || !sg2) continue;
        const tf = (parseFloat(fl.none?.c)||0) + (parseFloat(fl.fnt?.c)||0) + (parseFloat(fl.ms?.c)||0);
        const np = tf > 0 ? (parseFloat(fl.none?.c)||0)/tf : 1;
        const fp = tf > 0 ? (parseFloat(fl.fnt?.c)||0)/tf : 0;
        const mp = tf > 0 ? (parseFloat(fl.ms?.c)||0)/tf : 0;
        const shps = pDef.type === "MB" ? SHAPES : ["Round"];
        for (const co of COLORS_AST) {
          for (const sh of shps) {
            for (const cl of CLARITIES) {
              let rP, rC;
              if (pDef.type === "MB") { rP = Math.round(parseFloat(sg2[co]?.[sh]?.[cl]?.pcs)||0); rC = parseFloat(sg2[co]?.[sh]?.[cl]?.cts)||0; }
              else { rP = Math.round(parseFloat(sg2[co]?.[cl]?.pcs)||0); rC = parseFloat(sg2[co]?.[cl]?.cts)||0; }
              if (rP === 0 && rC === 0) continue;
              const sI = SHAPES.indexOf(sh); const yi = pCfg.yld[sh] || 0.43;
              const mu = pCfg.mult[sI >= 0 ? sI : 0][si] || 1.05;
              const pC = rC * yi; const pP = Math.round(rP * mu);
              const av = pP > 0 ? pC / pP : 0;
              const sv = findSv(av);
              const pmKey = `${pi}:${sh}:${sv?.id}:${co}:${cl}`;
              const activeSrc = pricingMode === "PL_M" ? PM_PLM : PM_PLB;
              let rt = sv ? (pmOverrides[pmKey] !== undefined ? pmOverrides[pmKey] : (activeSrc[sh]?.[sv.id]?.[co]?.[cl] || 0)) : 0;
              if (av >= 0.052 && pCfg.efDisc > 0) rt = Math.round(rt * (1 - pCfg.efDisc / 100));
              const md = pCfg.fd.med / 100; const sd = pCfg.fd.stg / 100;
              const ef = rt * ((np + fp) + mp * (1 - (md + sd) / 2));
              // Also compute PL-A (Amay V3) and PL-M (Market) values for comparison
              const rtA_raw = sv ? (PM_PLB[sh]?.[sv.id]?.[co]?.[cl] || 0) : 0;
              const rtM_raw = sv ? (PM_PLM[sh]?.[sv.id]?.[co]?.[cl] || 0) : 0;
              let rtAd = rtA_raw, rtMd = rtM_raw;
              const efA = rtAd * ((np + fp) + mp * (1 - (md + sd) / 2));
              const efM = rtMd * ((np + fp) + mp * (1 - (md + sd) / 2));
              rows.push({ co, cl, sh, rP, rC, pC, pP, av, tot: Math.round(pC * ef), totA: Math.round(pC * efA), totM: Math.round(pC * efM) });
            }
          }
        }
      }
      const rC = rows.reduce((s,r)=>s+r.rC,0), rP = rows.reduce((s,r)=>s+r.rP,0);
      const pC = rows.reduce((s,r)=>s+r.pC,0), pP = rows.reduce((s,r)=>s+r.pP,0);
      const tot = rows.reduce((s,r)=>s+r.tot,0);
      const totA = rows.reduce((s,r)=>s+r.totA,0);
      const totM = rows.reduce((s,r)=>s+r.totM,0);
      const hotCts = rows.filter(r => isHot(r.av, r.co, r.cl)).reduce((s,r)=>s+r.pC,0);
      const hotPct = pC > 0 ? hotCts / pC * 100 : 0;
      return { rC, rP, pC, pP, tot, totA, totM, hotPct, rows };
    });
  }, [asts, cfgs, flus, pmOverrides, pricingMode]);

  const sum = useMemo(() => {
    const g = {};
    for (const r of all) {
      if (!g[r.sh]) g[r.sh] = {};
      if (!g[r.sh][r.co]) g[r.sh][r.co] = {};
      const k = r.mm || "N/A";
      if (!g[r.sh][r.co][k]) g[r.sh][r.co][k] = { pP: 0, pC: 0, tot: 0 };
      const m = g[r.sh][r.co][k]; m.pP += r.pP; m.pC += r.pC; m.tot += r.tot;
    }
    return g;
  }, [all]);

  /* ──────── HOT SIZES ──────── */
  const hotData = useMemo(() => {
    let hotCts = 0, hotPcs = 0, hotTot = 0, coldCts = 0, coldPcs = 0, coldTot = 0;
    for (const r of all) {
      if (isHot(r.av, r.co, r.cl)) { hotCts += r.pC; hotPcs += r.pP; hotTot += r.tot; }
      else { coldCts += r.pC; coldPcs += r.pP; coldTot += r.tot; }
    }
    const totalPc = hotCts + coldCts;
    const hotPct = totalPc > 0 ? hotCts / totalPc * 100 : 0;
    const nc = r => !isCommercial(r.co, r.cl); // non-commercial filter
    const bands = [
      { label: "Band 1", range: "0.012-0.013ct", mm: "1.40-1.49mm", rows: all.filter(r => nc(r) && r.av >= 0.012 && r.av <= 0.013) },
      { label: "Band 2", range: "0.033-0.037ct", mm: "2.00-2.09mm", rows: all.filter(r => nc(r) && r.av >= 0.033 && r.av <= 0.037) },
      { label: "Band 3a (s6)", range: "0.078-0.115ct", mm: "2.70-3.10mm", rows: all.filter(r => nc(r) && r.av >= 0.078 && r.av <= 0.115) },
      { label: "Band 3b (s7)", range: "0.116-0.158ct", mm: "3.10-3.50mm", rows: all.filter(r => nc(r) && r.av >= 0.116 && r.av <= 0.158) },
      { label: "Band 3c (s8)", range: "0.159-0.200ct", mm: "3.50-3.80mm", rows: all.filter(r => nc(r) && r.av >= 0.159 && r.av <= 0.200) },
    ];
    return { hotCts, hotPcs, hotTot, coldCts, coldPcs, coldTot, totalPc, hotPct, bands };
  }, [all]);

  /* ──────── COLOR PROFILE (ODC) ──────── */
  const segProfiles = useMemo(() => {
    return SEGS.map((_, si) => {
      const sg2 = ast[si]; let c1 = 0, c2 = 0, c3 = 0, tot = 0;
      COLORS_AST.forEach(co => {
        const shapes = def.type === "MB" ? SHAPES : [null];
        shapes.forEach(sh => {
          CLARITIES.forEach(cl => {
            const cell = def.type === "MB" ? sg2[co]?.[sh]?.[cl] : sg2[co]?.[cl];
            const cts = parseFloat(cell?.cts) || 0;
            if (co === "DEF") c1 += cts; else if (["G","H"].includes(co)) c2 += cts; else c3 += cts; // 1Col=DEF, 2Col=GH, 3Col=IJK+LM+CAPE
            tot += cts;
          });
        });
      });
      return { c1, c2, c3, tot };
    });
  }, [ast, def, SEGS]);

  /* ──────── CHARTS DATA ──────── */
  const colorValueData = useMemo(() => {
    const d = {};
    for (const r of all) { d[r.co] = (d[r.co] || 0) + r.tot; }
    return COLORS_AST.filter(c => d[c]).map((c, i) => ({ name: c, value: Math.round(d[c] || 0), fill: PIE_COL[i % PIE_COL.length] }));
  }, [all]);

  const segBarData = useMemo(() => {
    return SEGS.map((seg, si) => {
      const sr = pol[si] || [];
      return { name: seg, rough: sr.reduce((s, r) => s + r.rC, 0), polish: sr.reduce((s, r) => s + r.pC, 0), value: sr.reduce((s, r) => s + r.tot, 0) };
    });
  }, [pol, SEGS]);

  /* ──────── HOMEPAGE ──────── */
  if (page === "home") {
    const gTotA = allParcelPolish.reduce((s,p)=>s+p.totA,0);
    const gTotM = allParcelPolish.reduce((s,p)=>s+p.totM,0);
    const gRc = allParcelPolish.reduce((s,p)=>s+p.rC,0);
    const gPc = allParcelPolish.reduce((s,p)=>s+p.pC,0);
    const mktPrem = gTotA > 0 ? ((gTotM/gTotA - 1)*100).toFixed(1) : "0";
    return (
      <div data-theme={theme} style={{ minHeight: "100vh" }}>
        <style>{css}</style>
        <div className="hdr">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="8.5" x2="22" y2="8.5" /></svg>
            EF Diamond Purchase System
          </div>
          <span style={{marginLeft:"auto",fontSize:11,color:"var(--hdr-sub)"}}>Rough Diamond Tender Management</span>
          <button className="theme-btn" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
        </div>

        <div style={{background:"var(--bg)",minHeight:"calc(100vh - 52px)",padding:"28px 32px"}}>
          <div style={{maxWidth:1400,margin:"0 auto"}}>
            <div style={{marginBottom:24}}>
              <h1 style={{fontSize:24,fontWeight:700,color:"var(--text)",marginBottom:4}}>Tenders</h1>
              <p style={{fontSize:13,color:"var(--text3)"}}>Select a tender to view parcels and bid analysis</p>
            </div>

            {/* Tender card */}
            <div className="card" style={{cursor:"pointer",marginBottom:24}} onClick={() => setPage("tender")}>
              <div className="card-hdr" style={{padding:"12px 20px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>ODC — March 2026</span>
                  <span className="badge badge-blue">ACTIVE</span>
                </div>
                <span style={{fontSize:11,color:"var(--text3)"}}>Spot Auction · 4 Parcels · Viewing: 16 Mar 2026</span>
              </div>
              <div className="card-body" style={{padding:0}}>
                {/* KPI row */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",borderBottom:"1px solid var(--border)"}}>
                  {[
                    ["Total Rough", f(gRc,1)+" cts", "var(--text)"],
                    ["Est. Polish", f(gPc,1)+" cts", "var(--text)"],
                    ["PL-A Value", "$"+gTotA.toLocaleString(), "var(--blue)"],
                    ["PL-M Value", "$"+gTotM.toLocaleString(), "var(--green)"],
                    ["Market Premium", "+"+mktPrem+"%", "var(--amber)"],
                  ].map(([lbl,val,clr])=>(
                    <div key={lbl} style={{padding:"14px 20px",borderRight:"1px solid var(--border)"}}>
                      <div style={{fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"1px",color:"var(--text3)",marginBottom:4}}>{lbl}</div>
                      <div style={{fontSize:16,fontWeight:700,color:clr,fontFamily:"'DM Mono',monospace"}}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* Lot-wise PL-A vs PL-M comparison table */}
                <div className="overflow-x">
                  <table>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left",paddingLeft:20}}>Lot</th>
                        <th style={{textAlign:"left"}}>Parcel</th>
                        <th>Type</th>
                        <th>Rough CTS</th>
                        <th>Polish CTS</th>
                        <th>Yield %</th>
                        <th style={{background:"var(--blue-bg)",color:"var(--blue)"}}>PL-A Value</th>
                        <th style={{background:"var(--blue-bg)",color:"var(--blue)"}}>PL-A $/ct R</th>
                        <th style={{background:"var(--green-bg)",color:"var(--green)"}}>PL-M Value</th>
                        <th style={{background:"var(--green-bg)",color:"var(--green)"}}>PL-M $/ct R</th>
                        <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Diff $</th>
                        <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Diff %</th>
                        <th>Last Sold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PARCEL_DEFS.map((pDef, pi) => {
                        const p = allParcelPolish[pi]; const pcl = parcels[pi];
                        const yld = p.rC > 0 ? (p.pC/p.rC*100).toFixed(1) : "0";
                        const diff = p.totM - p.totA;
                        const diffPct = p.totA > 0 ? (diff/p.totA*100).toFixed(1) : "0";
                        return <tr key={pDef.id} style={{cursor:"pointer"}} onClick={() => { setActivePcl(pi); setTab(0); setPage("parcel"); }}>
                          <td style={{textAlign:"left",paddingLeft:20,fontWeight:700}}>#{pcl.number}</td>
                          <td style={{textAlign:"left",fontWeight:600,color:"var(--blue)"}}>{pDef.label}</td>
                          <td><span className={`badge ${pDef.type==="SW"?"badge-blue":"badge-amber"}`} style={{fontSize:9}}>{pDef.type==="SW"?"SW":"MB"}</span></td>
                          <td style={{fontFamily:"'DM Mono',monospace"}}>{f(p.rC,1)}</td>
                          <td style={{fontFamily:"'DM Mono',monospace"}}>{f(p.pC,1)}</td>
                          <td>{yld}%</td>
                          <td style={{background:"var(--blue-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--blue)"}}>${p.totA.toLocaleString()}</td>
                          <td style={{background:"var(--blue-bg)",fontFamily:"'DM Mono',monospace"}}>${p.rC>0?Math.round(p.totA/p.rC):0}</td>
                          <td style={{background:"var(--green-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--green)"}}>${p.totM.toLocaleString()}</td>
                          <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>${p.rC>0?Math.round(p.totM/p.rC):0}</td>
                          <td style={{background:"var(--amber-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace",color:diff>0?"var(--green)":"var(--red)"}}>{diff>0?"+":""}${Math.round(diff).toLocaleString()}</td>
                          <td style={{background:"var(--amber-bg)",fontWeight:600,color:diff>0?"var(--green)":"var(--red)"}}>{diff>0?"+":""}{diffPct}%</td>
                          <td style={{fontWeight:600}}>${pcl.lastSold}/ct</td>
                        </tr>;
                      })}
                      <tr style={{fontWeight:700,borderTop:"2px solid var(--border2)"}}>
                        <td colSpan={3} style={{textAlign:"left",paddingLeft:20}}>GRAND TOTAL</td>
                        <td style={{fontFamily:"'DM Mono',monospace"}}>{f(gRc,1)}</td>
                        <td style={{fontFamily:"'DM Mono',monospace"}}>{f(gPc,1)}</td>
                        <td>{gRc>0?(gPc/gRc*100).toFixed(1):0}%</td>
                        <td style={{background:"var(--blue-bg)",color:"var(--blue)",fontFamily:"'DM Mono',monospace"}}>${gTotA.toLocaleString()}</td>
                        <td style={{background:"var(--blue-bg)",fontFamily:"'DM Mono',monospace"}}>${gRc>0?Math.round(gTotA/gRc):0}</td>
                        <td style={{background:"var(--green-bg)",color:"var(--green)",fontFamily:"'DM Mono',monospace"}}>${gTotM.toLocaleString()}</td>
                        <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>${gRc>0?Math.round(gTotM/gRc):0}</td>
                        <td style={{background:"var(--amber-bg)",fontFamily:"'DM Mono',monospace",color:gTotM-gTotA>0?"var(--green)":"var(--red)"}}>{gTotM-gTotA>0?"+":""}${Math.round(gTotM-gTotA).toLocaleString()}</td>
                        <td style={{background:"var(--amber-bg)",color:gTotM-gTotA>0?"var(--green)":"var(--red)"}}>{gTotA>0?"+":""}{mktPrem}%</td>
                        <td>—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{padding:"10px 20px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
                  PL-A = EF Price List base rates · PL-M = Market (Avg broker price + 20% Surat premium) · Click any row to view parcel details
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────── TENDER VIEW (list of parcels) ──────── */
  if (page === "tender") {
    return (
      <div data-theme={theme} style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <style>{css}</style>
        <div className="hdr">
          <div className="logo" onClick={() => setPage("home")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="8.5" x2="22" y2="8.5" /></svg>
            EF Diamond
          </div>
          <div className="hdr-divider"></div>
          <div className="breadcrumb">
            <span className="link" onClick={() => setPage("home")}>Home</span>
            <span className="sep">›</span>
            <span style={{color:"var(--hdr-text)",fontWeight:600}}>ODC March 2026</span>
          </div>
          <span style={{marginLeft:"auto"}}></span>
          <button className="theme-btn" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
        </div>
        <div className="body" style={{paddingTop:24}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <h2 style={{fontSize:20,fontWeight:700,color:"var(--text)",marginBottom:4}}>ODC — March 2026 Spot Auction</h2>
              <p style={{fontSize:12,color:"var(--text3)"}}>4 Parcels · Viewing: 16 Mar 2026 · Click a parcel to view details</p>
            </div>
            <button className="master-btn inactive" onClick={() => { setPage("parcel"); setTab(MASTER_TAB); }}>
              ◇ Master Summary & Bid Comparison
            </button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))",gap:16}}>
            {PARCEL_DEFS.map((d, i) => {
              const p = allParcelPolish[i]; const pcl = parcels[i];
              const yld = p.rC > 0 ? (p.pC / p.rC * 100).toFixed(1) : "0";
              return <div key={d.id} className="card" style={{cursor:"pointer",marginBottom:0}} onClick={() => { setActivePcl(i); setTab(0); setPage("parcel"); }}>
                <div className="card-hdr">
                  <span className="card-title">Lot #{pcl.number} — {d.label}</span>
                  <span className="badge badge-blue">{d.type === "SW" ? "Sawable" : "Makeable"}</span>
                </div>
                <div className="card-body">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8,marginBottom:10}}>
                    <div><div className="lbl">Rough CTS</div><div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{f(p.rC,1)}</div></div>
                    <div><div className="lbl">Polish CTS</div><div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{f(p.pC,1)}</div></div>
                    <div><div className="lbl">Yield</div><div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{yld}%</div></div>
                  </div>
                  <div style={{display:"flex",gap:12,fontSize:11}}>
                    <span>PL-A: <strong style={{color:"var(--blue)"}}>${p.totA.toLocaleString()}</strong></span>
                    <span>PL-M: <strong style={{color:"var(--green)"}}>${p.totM.toLocaleString()}</strong></span>
                    <span>Last Sold: <strong style={{color:"var(--amber)"}}>${pcl.lastSold}/ct</strong></span>
                  </div>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
    );
  }

  /* ──────── PARCEL DETAIL VIEW ──────── */
  return (
    <div data-theme={theme} style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{css}</style>

      {/* HEADER */}
      <div className="hdr">
        <div className="logo" onClick={() => setPage("home")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" /><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="8.5" x2="22" y2="8.5" /></svg>
          EF Diamond
        </div>
        <div className="hdr-divider"></div>
        <div className="breadcrumb">
          <span className="link" onClick={() => setPage("home")}>Home</span><span className="sep">›</span>
          <span className="link" onClick={() => setPage("tender")}>ODC Mar 2026</span><span className="sep">›</span>
          <span style={{color:"var(--hdr-text)",fontWeight:600}}>{tab === MASTER_TAB ? "Master Summary" : tab === BID_COMPARE_TAB ? "PL Compare" : "Lot #"+parcel.number}</span>
        </div>
        <div className="hdr-divider"></div>
        <button className={`master-btn ${tab === MASTER_TAB ? "active" : "inactive"}`}
          onClick={() => setTab(tab === MASTER_TAB ? 0 : MASTER_TAB)}>
          {tab === MASTER_TAB ? "◆ Master Summary" : "◇ Master Summary"}
        </button>
        <button style={{padding:"6px 16px",cursor:"pointer",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",border:"none",borderRadius:6,fontFamily:"inherit",transition:"all .2s",whiteSpace:"nowrap",
          background:tab===BID_COMPARE_TAB?"linear-gradient(135deg,#7c3aed,#6d28d9)":"linear-gradient(135deg,#8b5cf6,#7c3aed)",color:"#fff",
          boxShadow:tab===BID_COMPARE_TAB?"0 2px 8px rgba(124,58,237,.4)":"0 2px 8px rgba(124,58,237,.3)"}}
          onClick={() => setTab(tab === BID_COMPARE_TAB ? 0 : BID_COMPARE_TAB)}>
          {tab === BID_COMPARE_TAB ? "◆ PL Compare" : "◇ PL Compare"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:0,marginLeft:12,background:"rgba(255,255,255,.1)",borderRadius:6,padding:2}}>
          {[["PL_A","PL-A","#a855f7"],["PL_M","PL-M","#16a34a"]].map(([k,lbl,clr])=>(
            <button key={k} onClick={()=>setPricingMode(k)} style={{
              padding:"5px 14px",fontSize:10,fontWeight:pricingMode===k?700:500,borderRadius:4,border:"none",cursor:"pointer",
              background:pricingMode===k?clr:"transparent",
              color:pricingMode===k?"#fff":"rgba(255,255,255,.6)",
              transition:"all .15s",letterSpacing:"0.5px",fontFamily:"inherit",
            }}>{lbl}</button>
          ))}
        </div>

        {tab !== MASTER_TAB && tab !== BID_COMPARE_TAB && <>
          <span className="badge badge-blue" style={{ marginLeft: "auto" }}>{def.type === "SW" ? "Sawable" : "Makeable"}</span>
          <span className="badge badge-green">{parcel.tender}</span>
          <span className="badge badge-amber">#{parcel.number} — {parcel.name}</span>
        </>}
        {tab === MASTER_TAB && <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,.5)"}}>All parcels · Bid calculator · Cross-parcel analysis</span>}
        {tab === BID_COMPARE_TAB && <span style={{marginLeft:"auto",fontSize:11,color:"rgba(255,255,255,.5)"}}>PL-A vs PL-M · Shape × Sieve × Color × Clarity · % difference</span>}
        <button className="theme-btn" onClick={toggleTheme}>{theme === "dark" ? "☀" : "☾"}</button>
      </div>

      {/* PARCEL SELECTOR — hidden in master/compare mode */}
      {tab !== MASTER_TAB && tab !== BID_COMPARE_TAB && <div className="parcel-tabs">
        {PARCEL_DEFS.map((d, i) => (
          <button key={d.id} className={`parcel-tab ${activePcl === i ? "active" : ""}`}
            onClick={() => { setActivePcl(i); setSg(0); }}>{d.label}</button>
        ))}
      </div>}

      {/* TAB BAR — hidden in master mode */}
      {tab !== MASTER_TAB && tab !== BID_COMPARE_TAB && <div className="tabs">
        {TABS.map((t, i) => <button key={t} className={`tab-btn ${tab === i ? "active" : ""}`} onClick={() => setTab(i)}>{t}</button>)}
      </div>}

      <div className="body">

        {/* ═══ TAB 0: PARCEL INPUT ═══ */}
        {tab === 0 && <>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Parcel Info</span></div>
            <div className="card-body">
              <div className="row">
                {[["Date","date",130,"date"],["Tender","tender",80],["#","number",50],["Name","name",200]].map(([l,k,w,t2]) =>
                  <div key={k} className="field"><span className="lbl">{l}</span>
                    <input type={t2||"text"} value={parcel[k]} onChange={e => setParcel(p => ({...p,[k]:e.target.value}))} className="inp" style={{width:w}} /></div>
                )}
                <div className="field"><span className="lbl">Type</span>
                  <span className="badge badge-blue" style={{padding:"6px 12px",fontSize:12}}>{def.type === "SW" ? "Sawable" : "Makeable"}</span>
                </div>
              </div>
              <div className="row">
                {[["Total Cts","totalCts"],["Pcs","pcs"],["Last Sold $/ct","lastSold"],["Bid $/ct","bidPrice"]].map(([l,k]) =>
                  <div key={k} className="field"><span className="lbl">{l}</span><NI value={parcel[k]} onChange={v => setParcel(p => ({...p,[k]:v}))} /></div>
                )}
                <div className="field"><span className="lbl">Avg Size</span><span style={{color:"var(--text3)",padding:"5px 0",fontSize:12,fontFamily:"var(--mono)"}}>{parcel.totalCts && parcel.pcs ? f(parcel.totalCts / parcel.pcs, 4) : "—"}</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr"><span className="card-title">Yield & Stone Multiplier</span><span style={{fontSize:10,color:"var(--text3)"}}>Multiplier per segment</span></div>
            <div className="card-body">
              <div className="overflow-x">
                <table><thead><tr><th style={{textAlign:"left"}}>Shape</th><th>Yield</th>
                  {SEGS.map(s => <th key={s}>Mult {s}</th>)}</tr></thead>
                  <tbody>{(def.type === "MB" ? SHAPES : ["Round"]).map((sh, si) => (
                    <tr key={sh}><td className="left">{sh}</td>
                      <td><NI value={cfg.yld[sh]} onChange={v => setCfg(c => ({...c, yld:{...c.yld, [sh]: v === "" ? "" : parseFloat(v) || 0}}))} /></td>
                      {SEGS.map((_, i) => <td key={i}><NI value={cfg.mult[si]?.[i]} onChange={v => setCfg(c => { const n = JSON.parse(JSON.stringify(c)); if (!n.mult[si]) n.mult[si] = [1,1,1]; n.mult[si][i] = v === "" ? "" : parseFloat(v) || 0; return n; })} /></td>)}
                    </tr>))}</tbody></table>
              </div>
              <div className="row" style={{marginTop:12}}>
                <div className="field"><span className="lbl">Med Fluo Disc %</span><span className="ni" style={{display:"inline-block",padding:"2px 6px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--text2)"}}>25%</span></div>
                <div className="field"><span className="lbl">Stg Fluo Disc %</span><span className="ni" style={{display:"inline-block",padding:"2px 6px",fontFamily:"'DM Mono',monospace",fontSize:12,color:"var(--text2)"}}>25%</span></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-hdr"><span className="card-title">Size Segments</span>
              {def.sampleExtrap && <span style={{fontSize:10,color:"var(--text3)"}}>ODC Profile rough cts → assortment ratios from combined sample</span>}
            </div>
            <div className="card-body">{parcel.segs.map((s,i) => (
              <div key={i} className="row" style={{padding:"6px 0",borderBottom: i < SEGS.length - 1 ? "1px solid var(--border)" : "none"}}>
                <div className="field" style={{minWidth:50}}><span className="lbl">Seg</span><span style={{color:"var(--blue)",fontWeight:700}}>{s.label}</span></div>
                {def.sampleExtrap && <div className="field"><span className="lbl" style={{color:"var(--green)"}}>Full Rough Cts</span><span style={{color:"var(--green)",fontWeight:700,padding:"5px 0",fontFamily:"var(--mono)",fontSize:12}}>{def.segRoughCts?.[i] || "—"}</span></div>}
                <div className="field"><span className="lbl">Sample Cts</span><NI value={s.sCts} onChange={v => setParcel(p => { const sg2=[...p.segs]; sg2[i]={...sg2[i],sCts:v}; return {...p,segs:sg2}; })} /></div>
                <div className="field"><span className="lbl">Sample Pcs</span><NI value={s.sPcs} onChange={v => setParcel(p => { const sg2=[...p.segs]; sg2[i]={...sg2[i],sPcs:v}; return {...p,segs:sg2}; })} /></div>
                <div className="field"><span className="lbl">Avg Size</span><span style={{color:"var(--text3)",padding:"5px 0",fontFamily:"var(--mono)",fontSize:12}}>{s.sCts && s.sPcs ? f(s.sCts/s.sPcs,4) : "—"}</span></div>
              </div>))}</div>
          </div>
        </>}

        {/* ═══ TAB 1: ASSORTMENT ═══ */}
        {tab === 1 && (() => {
          // Compute which colors have data in ANY segment
          const colorsWithData = COLORS_AST.filter(co => {
            for (let si2 = 0; si2 < SEGS.length; si2++) {
              const sg2 = ast[si2];
              const shps = def.type === "MB" ? SHAPES : [null];
              for (const sh of shps) {
                for (const cl of CLARITIES) {
                  const cell = def.type === "MB" ? sg2?.[co]?.[sh]?.[cl] : sg2?.[co]?.[cl];
                  if ((parseFloat(cell?.pcs) || 0) > 0 || (parseFloat(cell?.cts) || 0) > 0) return true;
                }
              }
            }
            return false;
          });

          // ODC comparison data for this segment
          const sp = segProfiles[sg];
          const o = odcPrf[sg];
          const a1 = sp?.tot > 0 ? sp.c1/sp.tot*100 : 0;
          const a2 = sp?.tot > 0 ? sp.c2/sp.tot*100 : 0;
          const a3 = sp?.tot > 0 ? sp.c3/sp.tot*100 : 0;
          const odcChartData = o ? [
            { name: "1 Col (DEF)", odc: o.c1, assort: Math.round(a1*10)/10 },
            { name: "2 Col (GH)", odc: o.c2, assort: Math.round(a2*10)/10 },
            { name: "3 Col (IJK+)", odc: o.c3, assort: Math.round(a3*10)/10 },
          ] : [];

          return <>
          <div style={{display:"flex",gap:4,marginBottom:12}}>{SEGS.map((s,i) => <button key={s} className={`seg-btn ${sg===i?"active":""}`} onClick={() => setSg(i)}>{s}</button>)}</div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Fluorescence — {SEGS[sg]}</span></div>
            <div className="card-body">
              <table><thead><tr><th style={{textAlign:"left"}}>Type</th><th>Cts</th><th>Stones</th><th>%</th></tr></thead>
                <tbody>{[["none","None"],["fnt","Faint"],["ms","Med/Stg"]].map(([k,l]) => {
                  const fl = flu[sg]; if (!fl) return null;
                  const t = (parseFloat(fl.none?.c)||0) + (parseFloat(fl.fnt?.c)||0) + (parseFloat(fl.ms?.c)||0);
                  return (<tr key={k}><td className="left">{l}</td>
                    <td><NI value={fl[k]?.c} className="ni ni-yellow" onChange={v => setFlu(x => { const n = JSON.parse(JSON.stringify(x)); if (!n[sg]) n[sg] = {none:{c:0,s:0},fnt:{c:0,s:0},ms:{c:0,s:0}}; n[sg][k].c = v; return n; })} /></td>
                    <td><NI value={fl[k]?.s} className="ni ni-yellow" onChange={v => setFlu(x => { const n = JSON.parse(JSON.stringify(x)); if (!n[sg]) n[sg] = {none:{c:0,s:0},fnt:{c:0,s:0},ms:{c:0,s:0}}; n[sg][k].s = v; return n; })} /></td>
                    <td style={{color:"var(--text3)"}}>{t > 0 ? f((parseFloat(fl[k]?.c)||0)/t*100,1) : "0.0"}%</td></tr>);
                })}</tbody></table>
            </div>
          </div>

          {/* ODC Profile vs Assortment — inline in Assortment tab */}
          {o && sp && sp.tot > 0 && <div className="card">
            <div className="card-hdr">
              <span className="card-title">ODC Profile vs Assortment — {SEGS[sg]}</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>1 Col = DEF · 2 Col = G+H · 3 Col = I+JK+LM+CAPE</span>
            </div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 300px",padding:"12px 14px"}}>
                <table><thead><tr>
                  <th style={{textAlign:"left"}}>Group</th><th>ODC %</th><th>Assortment %</th><th>Variance</th>
                </tr></thead><tbody>
                  {[["1 Col (DEF)", o.c1, a1],["2 Col (GH)", o.c2, a2],["3 Col (IJK+)", o.c3, a3]].map(([label, odcVal, astVal]) => {
                    const v = astVal - odcVal;
                    const vc = Math.abs(v) <= 3 ? "var-green" : Math.abs(v) <= 8 ? "var-amber" : "var-red";
                    return (<tr key={label}>
                      <td className="left">{label}</td>
                      <td>{f(odcVal,1)}%</td>
                      <td className="blue bold">{f(astVal,1)}%</td>
                      <td className={vc}>{(v >= 0 ? "+" : "") + f(v,1)}%</td>
                    </tr>);
                  })}
                </tbody></table>
                <div style={{marginTop:6,fontSize:9,color:"var(--text3)"}}>
                  <span className="var-green">green ≤3%</span> · <span className="var-amber">amber 3-8%</span> · <span className="var-red">red &gt;8%</span>
                </div>
              </div>
              <div style={{flex:"1 1 320px",padding:"12px 14px"}}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={odcChartData} barGap={8}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                    <XAxis dataKey="name" tick={{fontSize:10,fill:CX}} />
                    <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => v+"%"} />
                    <Tooltip formatter={v => v+"%"} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="odc" name="ODC Profile %" fill="#94a3b8" radius={[3,3,0,0]} />
                    <Bar dataKey="assort" name="My Assortment %" fill="#2563eb" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>}

          <div className="card">
            <div className="card-hdr"><span className="card-title">Assortment — {SEGS[sg]}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span className="badge badge-amber">Yellow = input</span>
                {def.sampleExtrap && <span className="badge badge-blue">Extrapolated from combined sample × {def.segRoughCts?.[sg] || 0} cts</span>}
                {colorsWithData.length < COLORS_AST.length && <span style={{fontSize:9,color:"var(--text3)"}}>Showing {colorsWithData.length} of {COLORS_AST.length} colors with data</span>}
              </div>
            </div>
            <div className="overflow-x">
              <table><thead>
                <tr><th style={{textAlign:"left"}}>Color</th>{def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                  {CLARITIES.map(c => <th key={c} colSpan={2}>{c}</th>)}<th colSpan={2}>Total</th></tr>
                <tr><th></th>{def.type === "MB" && <th></th>}
                  {CLARITIES.map(c => [<th key={c+"p"} style={{fontSize:8}}>PCS</th>,<th key={c+"c"} style={{fontSize:8}}>CTS</th>]).flat()}
                  <th style={{fontSize:8}}>PCS</th><th style={{fontSize:8}}>CTS</th></tr>
              </thead><tbody>
                {colorsWithData.map(co => {
                  const shps = def.type === "MB" ? SHAPES : [null];
                  const isComm = COMMERCIAL_COLORS.includes(co);
                  return shps.map((sh, si2) => {
                    let tP = 0, tC = 0;
                    CLARITIES.forEach(cl => { const c2 = def.type === "MB" ? ast[sg]?.[co]?.[sh]?.[cl] : ast[sg]?.[co]?.[cl]; tP += parseFloat(c2?.pcs)||0; tC += parseFloat(c2?.cts)||0; });
                    if (def.type === "MB" && tP === 0 && tC === 0) return null; // hide empty shape rows in MB
                    return (<tr key={co+(sh||"")} style={{borderTop: si2===0 ? "1px solid var(--border)" : "none", background: isComm ? "#fafafa" : "transparent"}}>
                      {si2 === 0 && <td className="left" rowSpan={def.type === "MB" ? shps.filter(s => { let tp2=0; CLARITIES.forEach(cl => { const c3 = ast[sg]?.[co]?.[s]?.[cl]; tp2 += parseFloat(c3?.pcs)||0; tp2 += parseFloat(c3?.cts)||0; }); return tp2 > 0; }).length || 1 : 1} style={isComm ? {color:"var(--text3)"} : {}}>{co}{isComm ? " ⚬" : ""}</td>}
                      {def.type === "MB" && <td className="left2">{sh}</td>}
                      {CLARITIES.map(cl => {
                        const c2 = def.type === "MB" ? ast[sg]?.[co]?.[sh]?.[cl] : ast[sg]?.[co]?.[cl];
                        return [
                          <td key={cl+"p"}><NI value={c2?.pcs ?? ""} className="ni ni-yellow" onChange={v => uA(sg,co,sh,cl,"pcs",v)} /></td>,
                          <td key={cl+"c"}><NI value={c2?.cts ?? ""} className="ni ni-yellow" onChange={v => uA(sg,co,sh,cl,"cts",v)} /></td>
                        ];
                      }).flat()}
                      <td className="blue bold">{tP ? Math.round(tP) : ""}</td><td className="blue bold">{tC ? f(tC) : ""}</td>
                    </tr>);
                  }).filter(Boolean);
                })}
              </tbody></table>
            </div>
            <div style={{padding:"6px 14px",fontSize:9,color:"var(--text3)"}}>
              ⚬ = Commercial grade (JK, L/M, CAPE, SI2) · Commercials excluded from Hot Band calculations
            </div>
          </div>
          </>;
        })()}

        {/* ═══ TAB 2: POLISH CALC ═══ */}
        {tab === 2 && <>
          <div style={{display:"flex",gap:4,marginBottom:12}}>{SEGS.map((s,i) => <button key={s} className={`seg-btn ${sg===i?"active":""}`} onClick={() => setSg(i)}>{s}</button>)}</div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">Polish Output — {SEGS[sg]}</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Color</th>
                {def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                <th style={{textAlign:"left"}}>Clarity</th>
                <th>R.Pcs</th><th>R.Cts</th><th>P.Pcs</th><th>P.Cts</th>
                <th>Avg Size</th><th>Sieve</th><th>MM</th>
                <th>Base $/ct</th><th>Eff $/ct</th><th>$/pc</th><th>Total $</th>
              </tr></thead><tbody>
                {(pol[sg]||[]).map((r,i) => (
                  <tr key={i} style={{background: i%2===0 ? "transparent" : "#f8f9fb"}}>
                    <td className="left">{r.co}</td>
                    {def.type === "MB" && <td className="left2">{r.sh}</td>}
                    <td className="left2">{r.cl}</td>
                    <td>{f(r.rP,0)}</td><td>{f(r.rC,2)}</td>
                    <td className="blue">{f(r.pP,0)}</td><td className="blue">{f(r.pC,3)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:11}}>{f(r.av,4)}</td>
                    <td style={{fontSize:10,color:"var(--text3)"}}>{r.sieve}</td>
                    <td style={{fontSize:10,color:"var(--text3)"}}>{r.mm}</td>
                    <td>{fd(r.rt)}</td>
                    <td className="green bold">{fd(r.ef)}</td>
                    <td className="purple">{r.ppc > 0 ? "$"+f(r.ppc,2) : ""}</td>
                    <td className="amber bold">{fd(r.tot)}</td>
                  </tr>))}
                {!(pol[sg]||[]).length && <tr><td colSpan={14} style={{textAlign:"center",color:"var(--text3)",padding:30}}>No data — fill assortment first</td></tr>}
              </tbody></table>
            </div>
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
            {[["Pol CTS",f((pol[sg]||[]).reduce((s2,r)=>s2+r.pC,0),2)],
              ["Pol PCS",f((pol[sg]||[]).reduce((s2,r)=>s2+r.pP,0),0)],
              ["Total $",fd((pol[sg]||[]).reduce((s2,r)=>s2+r.tot,0))],
              ["Avg $/ct",(()=>{ const t=(pol[sg]||[]).reduce((s2,r)=>s2+r.tot,0); const c=(pol[sg]||[]).reduce((s2,r)=>s2+r.pC,0); return c>0?fd(t/c):"—"; })()],
            ].map(([l,v]) => <div key={l} className="metric"><div className="metric-val">{v}</div><div className="metric-label">{l}</div></div>)}
          </div>

          {/* Debug: Avg Size per Cell with Hot Band highlighting */}
          <div className="card" style={{marginTop:14}}>
            <div className="card-hdr">
              <span className="card-title">Debug — Avg Polish Size per Cell (All Segments)</span>
              <div style={{display:"flex",gap:6,fontSize:10}}>
                <span style={{padding:"2px 8px",borderRadius:4,background:"var(--green-bg)",color:"var(--green)",fontWeight:600}}>Hot</span>
                <span style={{padding:"2px 8px",borderRadius:4,background:"var(--red-bg)",color:"var(--red)",fontWeight:600}}>No Demand</span>
              </div>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Seg</th>
                <th style={{textAlign:"left"}}>Color</th>
                {def.type === "MB" && <th style={{textAlign:"left"}}>Shape</th>}
                <th style={{textAlign:"left"}}>Clarity</th>
                <th>R.Pcs</th><th>R.Cts</th>
                <th>Yield</th><th>Mult</th>
                <th>P.Pcs</th><th>P.Cts</th>
                <th style={{fontWeight:800}}>Avg Size</th>
                <th>Sieve</th>
                <th>Hot?</th>
                <th>Band</th>
              </tr></thead><tbody>
                {pol.flat().map((r, i) => {
                  const hot = isHot(r.av, r.co, r.cl);
                  let band = "—";
                  if (r.av >= 0.012 && r.av <= 0.013) band = "B1";
                  else if (r.av >= 0.033 && r.av <= 0.037) band = "B2";
                  else if (r.av >= 0.078 && r.av <= 0.115) band = "B3a";
                  else if (r.av >= 0.116 && r.av <= 0.158) band = "B3b";
                  else if (r.av >= 0.159 && r.av <= 0.200) band = "B3c";
                  const sI = SHAPES.indexOf(r.sh);
                  return (
                    <tr key={i} style={{background: hot ? "#f0fdf4" : i % 2 === 0 ? "transparent" : "#f8f9fb"}}>
                      <td className="left" style={{fontSize:10}}>{r.seg}</td>
                      <td className="left">{r.co}</td>
                      {def.type === "MB" && <td className="left2">{r.sh}</td>}
                      <td className="left2">{r.cl}</td>
                      <td>{f(r.rP,0)}</td>
                      <td>{f(r.rC,2)}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{cfg.yld[r.sh] || "—"}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{cfg.mult[sI >= 0 ? sI : 0]?.[r.si] || "—"}</td>
                      <td className="blue">{f(r.pP,0)}</td>
                      <td className="blue">{f(r.pC,3)}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:700,color: hot ? "var(--green)" : "var(--text)"}}>{f(r.av,5)}</td>
                      <td style={{fontSize:10,color:"var(--text3)"}}>{r.sieve}</td>
                      <td style={{fontWeight:700,color: hot ? "var(--green)" : "var(--red)"}}>{hot ? "✓ HOT" : "✗"}</td>
                      <td style={{fontWeight:600,color: hot ? "var(--green)" : "var(--text3)"}}>{band}</td>
                    </tr>);
                })}
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)"}}>
              Hot bands: B1=0.012-0.013ct · B2=0.033-0.037ct · B3a=0.078-0.115ct (s6) · B3b=0.116-0.158ct (s7) · B3c=0.159-0.200ct (s8).
              Avg Size = Polish CTS / Polish PCS. Polish CTS = Rough CTS × Yield. Polish PCS = Round(Rough PCS × Stone Multiplier).
            </div>
          </div>
        </>}

        {/* ═══ TAB 3: PRICE MASTERS ═══ */}
        {tab === 3 && <>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
            <span style={{fontSize:11,color:"var(--text3)"}}>Active:</span>
            <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:4,
              background:pricingMode==="PL_M"?"var(--green-bg)":"var(--blue-bg)",
              color:pricingMode==="PL_M"?"var(--green)":"var(--blue)"}}>
              {pricingMode==="PL_M"?"PL-M (Market)":"PL-A (Amay V3)"}
            </span>
            <span style={{fontSize:10,color:"var(--text3)"}}>Switch in header bar →</span>
          </div>
          <div style={{display:"flex",gap:4,marginBottom:10}}>{SHAPES.map(s2 => <button key={s2} className={`seg-btn ${ps===s2?"active":""}`} onClick={() => setPs(s2)}>{s2}</button>)}</div>
          <div style={{display:"flex",gap:4,marginBottom:10,flexWrap:"wrap"}}>
            {SIEVE_RANGES.map(s2 => <button key={s2.id} className={`seg-btn ${pv===s2.id?"active":""}`} style={{fontSize:10}} onClick={() => setPv(s2.id)}>
              {s2.sieve} <span style={{color:"var(--text3)",fontSize:9}}>({s2.cts})</span></button>)}
          </div>
          <div className="card">
            <div className="card-hdr"><span className="card-title">{ps} — {SIEVE_RANGES.find(s2=>s2.id===pv)?.sieve} ({SIEVE_RANGES.find(s2=>s2.id===pv)?.mm}mm)</span></div>
            <div className="overflow-x">
              <table><thead><tr><th style={{textAlign:"left"}}>Color</th>
                {CLARITIES.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{COLORS_AST.map(c => (
                  <tr key={c}><td className="left">{c}</td>
                    {CLARITIES.map(cl => <td key={cl}><NI value={getPM(ps,pv,c,cl)} onChange={v => uPM(ps,pv,c,cl,v)} /></td>)}</tr>
                ))}</tbody></table>
            </div>
          </div>
        </>}

        {/* ═══ TAB 4: SUMMARY ═══ */}
        {tab === 4 && <>
          {/* Grand Totals */}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:18}}>
            {[["Total Rough CTS",f(gr.rC,2)],["Total Rough PCS",f(gr.rP,0)],
              ["Rough Avg Size",gr.rP>0?f(gr.rC/gr.rP,4):"—"],
              ["Exp Polish CTS",f(gr.pC,2)],["Exp Polish PCS",f(gr.pP,0)],
              ["Polish Avg Size",gr.pP>0?f(gr.pC/gr.pP,4):"—"],
              ["Yield %",gr.rC>0?f(gr.pC/gr.rC*100,1)+"%":"—"],
              ["Total Value",fd(gr.tot)],
              ["Rough $/ct",gr.rC>0?fd(gr.tot/gr.rC):"—"],
            ].map(([l,v]) => <div key={l} className="metric"><div className="metric-val" style={{fontSize:14}}>{v}</div><div className="metric-label">{l}</div></div>)}
          </div>

          {/* CHARTS */}
          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Segment</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={segBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="value" name="Value $" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Rough vs Polish CTS by Segment</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={segBarData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} />
                  <Tooltip />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="rough" name="Rough CTS" fill="#94a3b8" radius={[4,4,0,0]} />
                  <Bar dataKey="polish" name="Polish CTS" fill="#2563eb" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Color</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={colorValueData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    {colorValueData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand Split</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[{name:"Hot Sizes",value:Math.round(hotData.hotTot)},{name:"No Demand",value:Math.round(hotData.coldTot)}]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    <Cell fill="#16a34a" /><Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shape-wise charts */}
          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Shape ($)</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(() => {
                  const d = {};
                  for (const r of all) { if (!d[r.sh]) d[r.sh] = {name:r.sh, value:0, cts:0, pcs:0}; d[r.sh].value += r.tot; d[r.sh].cts += r.pC; d[r.sh].pcs += r.pP; }
                  return Object.values(d).filter(x => x.value > 0);
                })()} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Bar dataKey="value" name="Value $" fill="#7c3aed" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Polish CTS by Shape</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={(() => {
                  const d = {};
                  for (const r of all) { if (!d[r.sh]) d[r.sh] = {name:r.sh, cts:0, pcs:0}; d[r.sh].cts += r.pC; d[r.sh].pcs += r.pP; }
                  return Object.values(d).filter(x => x.cts > 0);
                })()} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} />
                  <Tooltip formatter={(v,n) => n === "cts" ? Number(v).toFixed(2)+" cts" : Number(v).toLocaleString()+" pcs"} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="cts" name="Polish CTS" fill="#0891b2" radius={[4,4,0,0]} />
                  <Bar dataKey="pcs" name="Polish PCS" fill="#94a3b8" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shape detail table */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-hdr"><span className="card-title">Shape Breakdown</span></div>
            <div className="card-body overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Shape</th><th>Polish CTS</th><th>Polish PCS</th><th>Avg Size</th><th>Total $</th><th>Avg $/ct</th><th>% of Value</th>
              </tr></thead><tbody>
                {(() => {
                  const d = {};
                  for (const r of all) { if (!d[r.sh]) d[r.sh] = {cts:0,pcs:0,tot:0}; d[r.sh].cts += r.pC; d[r.sh].pcs += r.pP; d[r.sh].tot += r.tot; }
                  const totalVal = Object.values(d).reduce((s,x) => s+x.tot, 0);
                  return Object.entries(d).filter(([,v]) => v.cts > 0).map(([sh, v]) =>
                    <tr key={sh}>
                      <td style={{textAlign:"left",fontWeight:700,color:"var(--blue)"}}>{sh}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{f(v.cts,2)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{Math.round(v.pcs)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{v.pcs > 0 ? f(v.cts/v.pcs,4) : "—"}</td>
                      <td style={{fontFamily:"'DM Mono',monospace",fontWeight:700}}>{fd(v.tot)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{v.cts > 0 ? fd(v.tot/v.cts) : "—"}</td>
                      <td style={{fontWeight:600,color:"var(--amber)"}}>{totalVal > 0 ? (v.tot/totalVal*100).toFixed(1)+"%" : "—"}</td>
                    </tr>
                  );
                })()}
              </tbody></table>
            </div>
          </div>

          {/* Per Segment Table */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">Per Segment</span></div>
            <div className="card-body overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Seg</th><th>R.CTS</th><th>R.PCS</th><th>R.Avg Size</th><th>P.CTS</th><th>P.PCS</th><th>P.Avg Size</th><th>Yield %</th><th>Total $</th><th>$/ct pol</th>
              </tr></thead><tbody>
                {SEGS.map((_, si) => {
                  const sr = pol[si]||[];
                  const rc = sr.reduce((s2,r)=>s2+r.rC,0), rp = sr.reduce((s2,r)=>s2+r.rP,0);
                  const pc = sr.reduce((s2,r)=>s2+r.pC,0), pp = sr.reduce((s2,r)=>s2+r.pP,0);
                  const t = sr.reduce((s2,r)=>s2+r.tot,0);
                  return (<tr key={si}><td className="left">{SEGS[si]}</td>
                    <td>{f(rc,2)}</td><td>{f(rp,0)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:11}}>{rp>0?f(rc/rp,4):"—"}</td>
                    <td className="blue">{f(pc,2)}</td><td className="blue">{f(pp,0)}</td>
                    <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--blue)"}}>{pp>0?f(pc/pp,4):"—"}</td>
                    <td>{rc>0?f(pc/rc*100,1)+"%":"—"}</td>
                    <td className="amber bold">{fd(t)}</td>
                    <td className="green bold">{pc>0?fd(t/pc):"—"}</td></tr>);
                })}
              </tbody></table>
            </div>
          </div>

          {/* Hot Size Summary — brief */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Demand Overview</span>
              <button className="seg-btn active" style={{fontSize:10,padding:"3px 10px"}} onClick={() => setTab(5)}>Open Full Analysis →</button>
            </div>
            <div className="card-body">
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPct,1)}%</div><div className="metric-label">Hot size %</div></div>
                <div className="metric metric-green"><div className="metric-val">{fd(hotData.hotTot)}</div><div className="metric-label">Hot value</div></div>
                <div className="metric metric-red"><div className="metric-val">{fd(hotData.coldTot)}</div><div className="metric-label">No demand value</div></div>
                <div className="metric metric-amber"><div className="metric-val">{gr.tot > 0 ? f(hotData.hotTot / gr.tot * 100, 1) + "%" : "—"}</div><div className="metric-label">Hot % of total $</div></div>
              </div>
            </div>
          </div>

          {/* MM Range & Avg Size Distribution Charts */}
          {(() => {
            // Group polish output by MM range
            const mmData = {};
            for (const r of all) {
              const k = r.mm || "N/A";
              if (!mmData[k]) mmData[k] = { mm: k, sieve: r.sieve, polCts: 0, polPcs: 0, value: 0 };
              mmData[k].polCts += r.pC; mmData[k].polPcs += r.pP; mmData[k].value += r.tot;
            }
            const mmChartData = Object.values(mmData).sort((a,b) => {
              const aMin = parseFloat(a.mm.split("-")[0]) || 0;
              const bMin = parseFloat(b.mm.split("-")[0]) || 0;
              return aMin - bMin;
            });

            // Group by avg size buckets (0.01ct increments)
            const sizeBuckets = {};
            for (const r of all) {
              if (!r.av || r.av <= 0) continue;
              const bucket = Math.floor(r.av * 100) / 100; // round down to 0.01
              const label = f(bucket,3) + "-" + f(bucket + 0.009,3);
              if (!sizeBuckets[label]) sizeBuckets[label] = { size: label, sortKey: bucket, polCts: 0, polPcs: 0, value: 0, hot: false };
              sizeBuckets[label].polCts += r.pC; sizeBuckets[label].polPcs += r.pP; sizeBuckets[label].value += r.tot;
              if (isHot(r.av, r.co, r.cl)) sizeBuckets[label].hot = true;
            }
            const sizeChartData = Object.values(sizeBuckets).sort((a,b) => a.sortKey - b.sortKey);

            return <>
            <div className="chart-wrap">
              <div className="chart-box">
                <div className="chart-title">Polish CTS by MM Range</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mmChartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                    <XAxis dataKey="mm" tick={{fontSize:9,fill:CX}} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{fontSize:10,fill:CY}} label={{value:"Polish CTS",angle:-90,position:"insideLeft",style:{fontSize:10,fill:CY}}} />
                    <Tooltip formatter={(v,name) => name === "value" ? "$"+Number(v).toLocaleString() : f(v,2)} />
                    <Legend wrapperStyle={{fontSize:10}} />
                    <Bar dataKey="polCts" name="Polish CTS" fill="#2563eb" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-box">
                <div className="chart-title">Value ($) by MM Range</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={mmChartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                    <XAxis dataKey="mm" tick={{fontSize:9,fill:CX}} angle={-30} textAnchor="end" height={55} />
                    <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                    <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                    <Bar dataKey="value" name="Value $" fill="#d97706" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-wrap">
              <div className="chart-box" style={{flex:"1 1 100%"}}>
                <div className="chart-title">Polish CTS by Avg Size Bucket (0.01ct increments) — Green = Hot Band</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sizeChartData} barGap={1}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                    <XAxis dataKey="size" tick={{fontSize:8,fill:CX}} angle={-45} textAnchor="end" height={65} interval={0} />
                    <YAxis tick={{fontSize:10,fill:CY}} label={{value:"Polish CTS",angle:-90,position:"insideLeft",style:{fontSize:10,fill:CY}}} />
                    <Tooltip formatter={(v,name) => f(v,3) + " ct"} labelFormatter={l => "Avg Size: " + l + " ct"} />
                    {sizeChartData.map((entry, i) => null)}
                    <Bar dataKey="polCts" name="Polish CTS" radius={[3,3,0,0]}>
                      {sizeChartData.map((entry, i) => <Cell key={i} fill={entry.hot ? "#16a34a" : "#94a3b8"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* MM Range Detail Table */}
            <div className="card">
              <div className="card-hdr"><span className="card-title">Polish Distribution by Sieve / MM Range</span></div>
              <div className="overflow-x">
                <table><thead><tr>
                  <th style={{textAlign:"left"}}>Sieve</th><th style={{textAlign:"left"}}>MM Range</th>
                  <th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Value</th><th>% of CTS</th><th>% of Value</th>
                </tr></thead><tbody>
                  {mmChartData.map((d,i) => {
                    const totCts = mmChartData.reduce((s,r) => s + r.polCts, 0);
                    const totVal = mmChartData.reduce((s,r) => s + r.value, 0);
                    return (<tr key={i}>
                      <td className="left">{d.sieve}</td>
                      <td className="left2">{d.mm}</td>
                      <td className="blue">{f(d.polCts,2)}</td>
                      <td>{f(d.polPcs,0)}</td>
                      <td className="green">{d.polCts > 0 ? fd(d.value/d.polCts) : "—"}</td>
                      <td className="amber bold">{fd(d.value)}</td>
                      <td>{totCts > 0 ? f(d.polCts/totCts*100,1)+"%" : "—"}</td>
                      <td>{totVal > 0 ? f(d.value/totVal*100,1)+"%" : "—"}</td>
                    </tr>);
                  })}
                </tbody></table>
              </div>
            </div>
            </>;
          })()}

          {/* Shape Detail Tables */}
          {Object.entries(sum).map(([sh, cols]) => {
            const sC = Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pC,0),0);
            const sT = Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.tot,0),0);
            return (
              <div key={sh} className="card">
                <div className="card-hdr"><span className="card-title">{sh}</span>
                  <div style={{display:"flex",gap:8}}><span className="badge badge-blue">{f(sC,2)} cts</span><span className="badge badge-amber">{fd(sT)}</span></div></div>
                <div className="overflow-x">
                  <table><thead><tr>
                    <th style={{textAlign:"left"}}>Color</th><th style={{textAlign:"left"}}>MM Range</th>
                    <th>Pol PCS</th><th>Pol CTS</th><th>Avg $/ct</th><th>Avg $/pc</th><th>Total $</th>
                  </tr></thead><tbody>
                    {Object.entries(cols).map(([co,ms]) => {
                      const me = Object.entries(ms);
                      return me.map(([mm,d],mi) => (
                        <tr key={co+mm}>
                          {mi===0 && <td className="left" rowSpan={me.length}>{co}</td>}
                          <td className="left2">{mm}</td>
                          <td>{f(d.pP,0)}</td><td>{f(d.pC,3)}</td>
                          <td className="green">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                          <td className="purple">{d.pP>0?"$"+f(d.tot/d.pP,2):"—"}</td>
                          <td className="amber bold">{fd(d.tot)}</td>
                        </tr>));
                    })}
                    <tr style={{borderTop:"2px solid var(--border)"}}>
                      <td className="left" colSpan={2} style={{color:"var(--blue)"}}>Subtotal</td>
                      <td className="blue bold">{f(Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pP,0),0),0)}</td>
                      <td className="blue bold">{f(sC,2)}</td>
                      <td className="green bold">{sC>0?fd(sT/sC):"—"}</td>
                      <td className="purple bold">{(()=>{const tp=Object.values(cols).reduce((s2,ms)=>s2+Object.values(ms).reduce((s3,m)=>s3+m.pP,0),0);return tp>0?"$"+f(sT/tp,2):"—";})()}</td>
                      <td className="amber bold">{fd(sT)}</td>
                    </tr>
                  </tbody></table>
                </div>
              </div>);
          })}
        </>}

        {/* ═══ TAB 5: DEMAND FORECAST ═══ */}
        {tab === 5 && (() => {
          // Per-band color breakdown
          const bandColorBreak = (bandRows) => {
            const g = {};
            for (const r of bandRows) {
              if (!g[r.co]) g[r.co] = { pC: 0, pP: 0, tot: 0 };
              g[r.co].pC += r.pC; g[r.co].pP += r.pP; g[r.co].tot += r.tot;
            }
            return g;
          };

          // Per-segment hot/cold
          const segDemand = SEGS.map((_, si) => {
            const sr = pol[si] || [];
            let hC = 0, hP = 0, hT = 0, cC = 0, cP = 0, cT = 0;
            for (const r of sr) {
              if (isHot(r.av, r.co, r.cl)) { hC += r.pC; hP += r.pP; hT += r.tot; }
              else { cC += r.pC; cP += r.pP; cT += r.tot; }
            }
            const tot = hC + cC;
            return { hC, hP, hT, cC, cP, cT, tot, hotPct: tot > 0 ? hC / tot * 100 : 0 };
          });

          // No-demand detail by color
          const coldRows = all.filter(r => !isHot(r.av, r.co, r.cl));
          const coldByColor = {};
          for (const r of coldRows) {
            if (!coldByColor[r.co]) coldByColor[r.co] = { pC: 0, pP: 0, tot: 0 };
            coldByColor[r.co].pC += r.pC; coldByColor[r.co].pP += r.pP; coldByColor[r.co].tot += r.tot;
          }

          // Chart data: band values
          const bandChartData = hotData.bands.map(b => ({
            name: b.label,
            value: Math.round(b.rows.reduce((s, r) => s + r.tot, 0)),
            cts: Math.round(b.rows.reduce((s, r) => s + r.pC, 0) * 100) / 100,
          }));

          // Chart data: per-segment hot vs cold
          const segHotColdData = SEGS.map((seg, si) => ({
            name: seg,
            Hot: Math.round(segDemand[si].hT),
            "No Demand": Math.round(segDemand[si].cT),
          }));

          return <>
          {/* KPI Metrics */}
          <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:18}}>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPct,1)}%</div><div className="metric-label">Hot size % (cts)</div></div>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotCts,2)} ct</div><div className="metric-label">Hot pol cts</div></div>
            <div className="metric metric-green"><div className="metric-val">{f(hotData.hotPcs,0)}</div><div className="metric-label">Hot pol pcs</div></div>
            <div className="metric metric-green"><div className="metric-val">{fd(hotData.hotTot)}</div><div className="metric-label">Hot value</div></div>
            <div className="metric metric-red"><div className="metric-val">{f(hotData.coldCts,2)} ct</div><div className="metric-label">No demand cts</div></div>
            <div className="metric metric-red"><div className="metric-val">{f(hotData.coldPcs,0)}</div><div className="metric-label">No demand pcs</div></div>
            <div className="metric metric-red"><div className="metric-val">{fd(hotData.coldTot)}</div><div className="metric-label">No demand value</div></div>
            <div className="metric metric-amber"><div className="metric-val">{gr.tot > 0 ? f(hotData.hotTot / gr.tot * 100, 1) + "%" : "—"}</div><div className="metric-label">Hot % of total $</div></div>
          </div>

          {/* Charts */}
          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Value by Hot Band</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={bandChartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:10,fill:CX}} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v,name) => name === "cts" ? v + " ct" : "$"+Number(v).toLocaleString()} />
                  <Bar dataKey="value" name="Value $" fill="#16a34a" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand by Segment</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={segHotColdData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:11,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+Math.round(v/1000)+"k"} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="Hot" fill="#16a34a" radius={[4,4,0,0]} stackId="a" />
                  <Bar dataKey="No Demand" fill="#dc2626" radius={[4,4,0,0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-wrap">
            <div className="chart-box">
              <div className="chart-title">Hot vs No-Demand Value Split</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={[{name:"Hot Sizes",value:Math.round(hotData.hotTot)},{name:"No Demand",value:Math.round(hotData.coldTot)}]}
                    dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:10}}>
                    <Cell fill="#16a34a" /><Cell fill="#dc2626" />
                  </Pie>
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-box">
              <div className="chart-title">Hot Band CTS Distribution</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={bandChartData.filter(b => b.cts > 0)} dataKey="cts" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({name,percent}) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} style={{fontSize:9}}>
                    {bandChartData.map((_, i) => <Cell key={i} fill={["#2563eb","#7c3aed","#0891b2","#c026d3","#ea580c"][i % 5]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => v + " ct"} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Band-wise Detail Table */}
          <div className="card" style={{borderColor:"#bbf7d0"}}>
            <div className="card-hdr"><span className="card-title">Hot Bands — Detail</span><span style={{fontSize:10,color:"var(--text3)"}}>EF PL highlighted sizes with active orders / demand forecast</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Band</th><th style={{textAlign:"left"}}>Size Range</th><th style={{textAlign:"left"}}>MM Range</th>
                <th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Avg $/pc</th><th>Value</th><th>% of Pol CTS</th>
              </tr></thead><tbody>
                {hotData.bands.map((b,i) => {
                  const c = b.rows.reduce((s,r)=>s+r.pC,0), p = b.rows.reduce((s,r)=>s+r.pP,0), t = b.rows.reduce((s,r)=>s+r.tot,0);
                  return (<tr key={i} style={{background:"var(--green-bg)"}}>
                    <td className="left" style={{color:"var(--green)"}}>Hot — {b.label}</td>
                    <td className="left2">{b.range}</td><td className="left2">{b.mm}</td>
                    <td>{f(c,2)}</td><td>{f(p,0)}</td>
                    <td className="green">{c>0?fd(t/c):"—"}</td>
                    <td className="purple">{p>0?"$"+f(t/p,2):"—"}</td>
                    <td className="green bold">{fd(t)}</td>
                    <td>{hotData.totalPc>0?f(c/hotData.totalPc*100,1)+"%":"—"}</td>
                  </tr>);
                })}
                <tr style={{borderTop:"2px solid var(--border)",background:"var(--green-bg)"}}>
                  <td className="left" style={{color:"var(--green)"}} colSpan={3}>Total Hot</td>
                  <td className="green bold">{f(hotData.hotCts,2)}</td><td className="green bold">{f(hotData.hotPcs,0)}</td>
                  <td className="green bold">{hotData.hotCts>0?fd(hotData.hotTot/hotData.hotCts):"—"}</td>
                  <td className="purple bold">{hotData.hotPcs>0?"$"+f(hotData.hotTot/hotData.hotPcs,2):"—"}</td>
                  <td className="green bold">{fd(hotData.hotTot)}</td>
                  <td className="green bold">{f(hotData.hotPct,1)}%</td>
                </tr>
                <tr style={{background:"var(--red-bg)"}}>
                  <td className="left" style={{color:"var(--red)"}} colSpan={3}>No Demand / Inventory Risk</td>
                  <td className="red bold">{f(hotData.coldCts,2)}</td><td className="red bold">{f(hotData.coldPcs,0)}</td>
                  <td className="red">{hotData.coldCts>0?fd(hotData.coldTot/hotData.coldCts):"—"}</td>
                  <td className="red">{hotData.coldPcs>0?"$"+f(hotData.coldTot/hotData.coldPcs,2):"—"}</td>
                  <td className="red bold">{fd(hotData.coldTot)}</td>
                  <td className="red bold">{hotData.totalPc>0?f(100-hotData.hotPct,1)+"%":"—"}</td>
                </tr>
              </tbody></table>
            </div>
          </div>

          {/* Per-Band Color Breakdown */}
          {hotData.bands.map((b, bi) => {
            const bc = bandColorBreak(b.rows);
            const entries = Object.entries(bc).filter(([,d]) => d.tot > 0).sort((a,b) => b[1].tot - a[1].tot);
            const bandTotC = entries.reduce((s,[,d]) => s + d.pC, 0);
            const bandTotT = entries.reduce((s,[,d]) => s + d.tot, 0);
            if (!entries.length) return null;
            return (
              <div key={bi} className="card">
                <div className="card-hdr">
                  <span className="card-title">Hot — {b.label} — Color Breakdown</span>
                  <div style={{display:"flex",gap:6}}><span className="badge badge-green">{b.range}</span><span className="badge badge-green">{b.mm}</span></div>
                </div>
                <div className="overflow-x">
                  <table><thead><tr>
                    <th style={{textAlign:"left"}}>Color</th><th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Value</th><th>% of Band</th>
                  </tr></thead><tbody>
                    {entries.map(([co, d]) => (
                      <tr key={co}>
                        <td className="left">{co}</td>
                        <td>{f(d.pC,3)}</td><td>{f(d.pP,0)}</td>
                        <td className="green">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                        <td className="amber bold">{fd(d.tot)}</td>
                        <td>{bandTotT>0?f(d.tot/bandTotT*100,1)+"%":"—"}</td>
                      </tr>))}
                    <tr style={{borderTop:"2px solid var(--border)"}}>
                      <td className="left" style={{color:"var(--blue)"}}>Band Total</td>
                      <td className="blue bold">{f(bandTotC,2)}</td>
                      <td className="blue bold">{f(entries.reduce((s,[,d]) => s+d.pP,0),0)}</td>
                      <td className="green bold">{bandTotC>0?fd(bandTotT/bandTotC):"—"}</td>
                      <td className="amber bold">{fd(bandTotT)}</td>
                      <td>100%</td>
                    </tr>
                  </tbody></table>
                </div>
              </div>);
          })}

          {/* Per-Segment Hot/Cold Split */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">Hot vs No-Demand — Per Segment</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Segment</th>
                <th colSpan={3} style={{background:"var(--green-bg)",color:"var(--green)"}}>Hot Sizes</th>
                <th colSpan={3} style={{background:"var(--red-bg)",color:"var(--red)"}}>No Demand</th>
                <th>Hot %</th>
              </tr><tr>
                <th></th>
                <th style={{background:"var(--green-bg)"}}>Pol CTS</th><th style={{background:"var(--green-bg)"}}>Pol PCS</th><th style={{background:"var(--green-bg)"}}>Value</th>
                <th style={{background:"var(--red-bg)"}}>Pol CTS</th><th style={{background:"var(--red-bg)"}}>Pol PCS</th><th style={{background:"var(--red-bg)"}}>Value</th>
                <th></th>
              </tr></thead><tbody>
                {SEGS.map((seg, si) => {
                  const d = segDemand[si];
                  return (<tr key={si}>
                    <td className="left">{seg}</td>
                    <td className="green">{f(d.hC,2)}</td><td className="green">{f(d.hP,0)}</td><td className="green bold">{fd(d.hT)}</td>
                    <td className="red">{f(d.cC,2)}</td><td className="red">{f(d.cP,0)}</td><td className="red bold">{fd(d.cT)}</td>
                    <td className="bold" style={{color: d.hotPct > 60 ? "var(--green)" : d.hotPct > 30 ? "var(--amber)" : "var(--red)"}}>{f(d.hotPct,1)}%</td>
                  </tr>);
                })}
                <tr style={{borderTop:"2px solid var(--border)"}}>
                  <td className="left" style={{color:"var(--blue)"}}>Total</td>
                  <td className="green bold">{f(hotData.hotCts,2)}</td><td className="green bold">{f(hotData.hotPcs,0)}</td><td className="green bold">{fd(hotData.hotTot)}</td>
                  <td className="red bold">{f(hotData.coldCts,2)}</td><td className="red bold">{f(hotData.coldPcs,0)}</td><td className="red bold">{fd(hotData.coldTot)}</td>
                  <td className="bold" style={{color: hotData.hotPct > 60 ? "var(--green)" : hotData.hotPct > 30 ? "var(--amber)" : "var(--red)"}}>{f(hotData.hotPct,1)}%</td>
                </tr>
              </tbody></table>
            </div>
          </div>

          {/* No-Demand Color Detail */}
          <div className="card" style={{borderColor:"#fecaca"}}>
            <div className="card-hdr"><span className="card-title">No Demand — Color Breakdown (Inventory Risk)</span></div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Color</th><th>Pol CTS</th><th>Pol PCS</th><th>Avg $/ct</th><th>Value</th><th>% of No-Demand $</th>
              </tr></thead><tbody>
                {Object.entries(coldByColor).filter(([,d]) => d.tot > 0).sort((a,b) => b[1].tot - a[1].tot).map(([co, d]) => (
                  <tr key={co}>
                    <td className="left">{co}</td>
                    <td>{f(d.pC,3)}</td><td>{f(d.pP,0)}</td>
                    <td className="red">{d.pC>0?fd(d.tot/d.pC):"—"}</td>
                    <td className="red bold">{fd(d.tot)}</td>
                    <td>{hotData.coldTot>0?f(d.tot/hotData.coldTot*100,1)+"%":"—"}</td>
                  </tr>))}
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)"}}>
              No-demand sizes may sell at lower commercial prices or build inventory. Consider adjusting bid price to account for inventory holding risk.
            </div>
          </div>

          <div style={{padding:"10px 0",fontSize:10,color:"var(--text3)"}}>
            Hot sizes per Amay demand forecast: Band 1 (0.012-0.013ct / 1.40-1.49mm) · Band 2 (0.035ct / 2.00-2.09mm) · Band 3a (0.078-0.089ct / 2.70-2.89mm) · Band 3b (0.135-0.175ct / 3.30-3.69mm) · Only DEF/G/H × VVS/VS1/VS2 × Rounds.
          </div>
          </>;
        })()}

        {/* ═══ TAB 6: QUICK VIEW — Combined polish output with editable prices & margin calc ═══ */}
        {tab === 6 && (() => {
          // Group all polish rows by sieve → color → clarity
          const grouped = {};
          for (const r of all) {
            if (r.pC <= 0 || !r.av || r.av <= 0) continue;
            const svObj = findSv(r.av);
            if (!svObj) continue;
            const key = `${svObj.id}|${r.co}|${r.cl}`;
            if (!grouped[key]) grouped[key] = { sv: svObj, co: r.co, cl: r.cl, sh: r.sh, rC: 0, pC: 0, pP: 0, tot: 0, rP: 0 };
            grouped[key].rC += r.rC; grouped[key].pC += r.pC; grouped[key].pP += r.pP; grouped[key].tot += r.tot; grouped[key].rP += r.rP;
          }
          const rows = Object.values(grouped).sort((a,b) => {
            const si = SIEVE_RANGES.findIndex(s=>s.id===a.sv.id) - SIEVE_RANGES.findIndex(s=>s.id===b.sv.id);
            if (si !== 0) return si;
            const ci = COLORS_AST.indexOf(a.co) - COLORS_AST.indexOf(b.co);
            if (ci !== 0) return ci;
            return CLARITIES.indexOf(a.cl) - CLARITIES.indexOf(b.cl);
          });

          // Editable price overrides for this tab (stored in qvPrices state)
          const getQvPrice = (svId, co, cl) => {
            const k = `qv:${svId}:${co}:${cl}`;
            if (pmOverrides[k] !== undefined) return pmOverrides[k];
            const src = pricingMode === "PL_M" ? PM_PLM : PM_PLB;
            return src["Round"]?.[svId]?.[co]?.[cl] || 0;
          };
          const setQvPrice = (svId, co, cl, v) => {
            const k = `qv:${svId}:${co}:${cl}`;
            setPmOverrides(p => ({...p, [k]: v === "" ? undefined : parseFloat(v) || 0}));
          };

          // Totals
          const totRc = rows.reduce((s,r)=>s+r.rC,0);
          const totPc = rows.reduce((s,r)=>s+r.pC,0);
          const totPp = rows.reduce((s,r)=>s+r.pP,0);

          return <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>Quick View — Combined Polish Output & Pricing</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>All sizes, colors, clarities · Editable $/ct · Active PL: {pricingMode==="PL_M"?"PL-M":"PL-A"}</div>
              </div>
            </div>

            {/* Margin & Labour controls */}
            <div className="card" style={{marginBottom:12}}>
              <div className="card-body" style={{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap",padding:"10px 16px"}}>
                <div className="field"><span className="lbl">Labour $/ct rough</span>
                  <NI value={globalLabour} onChange={v => setGlobalLabour(v === "" ? 0 : parseFloat(v) || 0)} /></div>
                <div className="field"><span className="lbl">Profit %</span>
                  <NI value={globalProfit} onChange={v => setGlobalProfit(v === "" ? 0 : parseFloat(v) || 0)} /></div>
                <div style={{borderLeft:"2px solid var(--border)",paddingLeft:16}}>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Total Rough</div>
                  <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{f(totRc,1)} cts</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Total Polish</div>
                  <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{f(totPc,1)} cts</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Yield</div>
                  <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace"}}>{totRc>0?(totPc/totRc*100).toFixed(1):0}%</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Total Value</div>
                  <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--blue)"}}>${rows.reduce((s,r)=>{
                    const p = getQvPrice(r.sv.id, r.co, r.cl);
                    return s + r.pC * p;
                  },0).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Bid $/ct (@ {globalProfit}%)</div>
                  {(() => {
                    const totVal = rows.reduce((s,r)=>s + r.pC * getQvPrice(r.sv.id, r.co, r.cl), 0);
                    const bid = totRc > 0 ? ((totVal - globalLabour * totRc) / totRc) * (1 - globalProfit/100) : 0;
                    return <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--green)",fontSize:16}}>${Math.round(bid)}/ct</div>;
                  })()}
                </div>
                <div>
                  <div style={{fontSize:10,color:"var(--text3)"}}>Last Sold</div>
                  <div style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--amber)"}}>${parcel.lastSold}/ct</div>
                </div>
              </div>
            </div>

            {/* Main data table with editable prices */}
            <div className="card">
              <div className="overflow-x">
                <table>
                  <thead><tr>
                    <th style={{textAlign:"left"}}>Sieve</th>
                    <th style={{textAlign:"left"}}>MM</th>
                    <th style={{textAlign:"left"}}>Color</th>
                    <th>Clarity</th>
                    <th>Rough CTS</th>
                    <th>Pol CTS</th>
                    <th>Pol PCS</th>
                    <th>Avg Rough</th>
                    <th>Avg Polish</th>
                    <th style={{background:"var(--yellow-input)",minWidth:70}}>$/ct Pol</th>
                    <th>Value $</th>
                    <th>$/ct Rough</th>
                    <th>Hot?</th>
                  </tr></thead>
                  <tbody>
                    {rows.map((r, ri) => {
                      const price = getQvPrice(r.sv.id, r.co, r.cl);
                      const val = Math.round(r.pC * price);
                      const avgR = r.rP > 0 ? r.rC / r.rP : 0;
                      const avgP = r.pP > 0 ? r.pC / r.pP : 0;
                      const perRough = r.rC > 0 ? val / r.rC : 0;
                      const hot = isHot(avgP, r.co, r.cl);
                      const comm = isCommercial(r.co, r.cl);
                      return <tr key={ri} style={comm ? {opacity:0.6} : hot ? {background:"var(--green-bg)"} : {}}>
                        <td style={{textAlign:"left",fontWeight:600,fontSize:11}}>{r.sv.sieve}</td>
                        <td style={{textAlign:"left",fontSize:10,color:"var(--text3)"}}>{r.sv.mm}</td>
                        <td style={{textAlign:"left",fontWeight:700,color:comm?"var(--text3)":"var(--blue)"}}>{r.co}</td>
                        <td>{r.cl}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{f(r.rC,2)}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{f(r.pC,2)}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{Math.round(r.pP)}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{avgR > 0 ? f(avgR,4) : "—"}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{avgP > 0 ? f(avgP,4) : "—"}</td>
                        <td style={{background:"var(--yellow-input)",border:"1px solid var(--yellow-border)"}}>
                          <NI value={price} onChange={v => setQvPrice(r.sv.id, r.co, r.cl, v)} />
                        </td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,fontWeight:600}}>${val.toLocaleString()}</td>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>${Math.round(perRough)}</td>
                        <td>{hot ? <span style={{color:"var(--green)",fontWeight:700}}>✓</span> : comm ? <span style={{color:"var(--text3)"}}>comm</span> : "—"}</td>
                      </tr>;
                    })}
                    <tr style={{fontWeight:700,borderTop:"2px solid var(--border2)"}}>
                      <td colSpan={4} style={{textAlign:"left"}}>TOTAL</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{f(totRc,1)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{f(totPc,1)}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>{Math.round(totPp)}</td>
                      <td colSpan={2}></td>
                      <td></td>
                      <td style={{fontFamily:"'DM Mono',monospace",color:"var(--blue)"}}>${rows.reduce((s,r)=>s+Math.round(r.pC*getQvPrice(r.sv.id,r.co,r.cl)),0).toLocaleString()}</td>
                      <td style={{fontFamily:"'DM Mono',monospace"}}>${totRc>0?Math.round(rows.reduce((s,r)=>s+Math.round(r.pC*getQvPrice(r.sv.id,r.co,r.cl)),0)/totRc):0}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
                Yellow cells are editable — override any $/ct to see instant impact on total value and bid. Bid = ((Total Value − Labour × Rough CTS) / Rough CTS) × (1 − Profit%)
              </div>
            </div>
          </>;
        })()}

        {/* ═══ PL COMPARE (separate mode — PL-A vs PL-M by Shape × Sieve × Color × Clarity) ═══ */}
        {tab === BID_COMPARE_TAB && (() => {
          const shapes = SHAPES;
          return <>
            <div style={{marginBottom:16}}>
              <h2 style={{fontSize:18,fontWeight:700,color:"var(--text)",marginBottom:4}}>Price List Comparison — PL-A vs PL-M</h2>
              <div style={{fontSize:12,color:"var(--text3)"}}>PL-A (EF Price List) = base · PL-M (Market) premium shown as % difference · All prices $/ct polished</div>
              <div style={{fontSize:11,color:"var(--amber)",marginTop:4}}>⚠ PL-M base prices sourced from round polished broker lists. Fancy shape PL-M (Pear, Baguette, Marquise) are estimated using shape discount factors — actual fancy market data required for accuracy.</div>
            </div>
            {shapes.map(shape => {
              const plaShape = PM_PLB[shape] || {};
              const plmShape = PM_PLM[shape] || {};
              return <div key={shape} className="card" style={{marginBottom:20}}>
                <div className="card-hdr" style={{padding:"12px 16px"}}>
                  <span style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{shape}</span>
                  <span style={{fontSize:10,color:"var(--text3)"}}>{shape === "Round" ? "Sawable + Makeable" : "Makeable only"}</span>
                </div>
                <div className="card-body" style={{padding:0}}>
                  {SIEVE_RANGES.map(sr => {
                    const plaS = plaShape[sr.id] || {};
                    const plmS = plmShape[sr.id] || {};
                    return <div key={sr.id} style={{borderBottom:"1px solid var(--border)"}}>
                      <div style={{padding:"8px 16px",background:"var(--card2)",fontSize:11,fontWeight:700,color:"var(--text2)",display:"flex",justifyContent:"space-between"}}>
                        <span>{sr.sieve} · {sr.mm}mm · {sr.cts}ct</span>
                      </div>
                      <div className="overflow-x">
                        <table style={{marginBottom:0}}>
                          <thead>
                            <tr>
                              <th style={{textAlign:"left",width:60}}>Color</th>
                              {CLARITIES.map(cl => <th key={cl} colSpan={3} style={{borderLeft:"2px solid var(--border2)"}}>{cl}</th>)}
                            </tr>
                            <tr>
                              <th></th>
                              {CLARITIES.map(cl => [
                                <th key={cl+"a"} style={{borderLeft:"2px solid var(--border2)",fontSize:8,color:"var(--blue)",padding:"2px 4px"}}>PL-A</th>,
                                <th key={cl+"m"} style={{fontSize:8,color:"var(--green)",padding:"2px 4px"}}>PL-M</th>,
                                <th key={cl+"d"} style={{fontSize:8,padding:"2px 4px"}}>Δ%</th>
                              ])}
                            </tr>
                          </thead>
                          <tbody>
                            {COLORS_AST.map(co => {
                              const isComm = COMMERCIAL_COLORS.includes(co);
                              return <tr key={co} style={isComm ? {background:"var(--card2)",opacity:0.65} : {}}>
                                <td style={{textAlign:"left",fontWeight:700,fontSize:11,color:isComm?"var(--text3)":"var(--blue)"}}>{co}</td>
                                {CLARITIES.map(cl => {
                                  const a = plaS[co]?.[cl] || 0;
                                  const m = plmS[co]?.[cl] || 0;
                                  const d = a > 0 ? Math.round((m - a) / a * 1000) / 10 : 0;
                                  return [
                                    <td key={cl+"a"} style={{borderLeft:"2px solid var(--border2)",fontFamily:"'DM Mono',monospace",fontSize:10}}>{a || "—"}</td>,
                                    <td key={cl+"m"} style={{fontFamily:"'DM Mono',monospace",fontSize:10}}>{m || "—"}</td>,
                                    <td key={cl+"d"} style={{fontWeight:700,fontSize:10,fontFamily:"'DM Mono',monospace",
                                      color: d > 0 ? "var(--green)" : d < 0 ? "var(--red)" : "var(--text3)",
                                      background: Math.abs(d) > 10 ? (d > 0 ? "var(--green-bg)" : "var(--red-bg)") : "transparent"
                                    }}>{a > 0 ? (d > 0 ? "+" : "") + d.toFixed(1) + "%" : "—"}</td>
                                  ];
                                })}
                              </tr>;
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>;
                  })}
                </div>
              </div>;
            })}

            {/* Summary: avg premium by shape */}
            <div className="card" style={{borderLeft:"3px solid var(--purple)"}}>
              <div className="card-hdr"><span className="card-title">Average PL-M Premium over PL-A by Shape (non-commercial only)</span></div>
              <div className="overflow-x">
                <table>
                  <thead><tr><th style={{textAlign:"left"}}>Shape</th>
                    {SIEVE_RANGES.map(sr => <th key={sr.id}>{sr.sieve}</th>)}
                    <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Overall</th>
                  </tr></thead>
                  <tbody>
                    {shapes.map(shape => {
                      const plaShape = PM_PLB[shape] || {};
                      const plmShape = PM_PLM[shape] || {};
                      let totalA = 0, totalM = 0;
                      const perSieve = SIEVE_RANGES.map(sr => {
                        let sA = 0, sM = 0, cnt = 0;
                        COLORS_AST.slice(0, 3).forEach(co => { // DEF, G, H only (non-commercial)
                          CLARITIES.slice(0, 3).forEach(cl => { // VVS, VS1, VS2 only
                            const a = plaShape[sr.id]?.[co]?.[cl] || 0;
                            const m = plmShape[sr.id]?.[co]?.[cl] || 0;
                            if (a > 0) { sA += a; sM += m; cnt++; }
                          });
                        });
                        totalA += sA; totalM += sM;
                        const pct = sA > 0 ? ((sM - sA) / sA * 100) : 0;
                        return Math.round(pct * 10) / 10;
                      });
                      const overall = totalA > 0 ? Math.round((totalM - totalA) / totalA * 1000) / 10 : 0;
                      return <tr key={shape}>
                        <td style={{textAlign:"left",fontWeight:700,color:"var(--blue)"}}>{shape}</td>
                        {perSieve.map((p, i) => <td key={i} style={{fontFamily:"'DM Mono',monospace",fontWeight:600,
                          color: p > 0 ? "var(--green)" : p < 0 ? "var(--red)" : "var(--text3)"
                        }}>{p > 0 ? "+" : ""}{p.toFixed(1)}%</td>)}
                        <td style={{fontFamily:"'DM Mono',monospace",fontWeight:700,background:"var(--amber-bg)",
                          color: overall > 0 ? "var(--green)" : "var(--red)"
                        }}>{overall > 0 ? "+" : ""}{overall.toFixed(1)}%</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
                Based on DEF/G/H colors × VVS/VS1/VS2 clarities (non-commercial cells only) · PL-A = EF Price List · PL-M = Market avg + 20% Surat premium · ⚠ Note: PL-M base prices are from round polished broker lists. Fancy shape PL-M prices (Pear ×0.85, Baguette ×0.70, Marquise ×0.80) are estimated from the round base — actual fancy market data not yet available.
              </div>
            </div>
          </>;
        })()}

        {/* ═══ MASTER SUMMARY (separate mode) ═══ */}
        {tab === MASTER_TAB && (() => {
          const getLabour = (pi) => {
            const pp = perParcelBid[pi];
            return pp && !pp.useGlobal && pp.labour !== "" ? parseFloat(pp.labour) || 0 : globalLabour;
          };
          const getProfit = (pi) => {
            const pp = perParcelBid[pi];
            return pp && !pp.useGlobal && pp.profit !== "" ? parseFloat(pp.profit) || 0 : globalProfit;
          };
          // Correct formula: Bid = ((Pol Value - Labour×Rough CTS) / Rough CTS) × (1 - Profit%)
          // = (Pol$/ct_rough - Labour$/ct) × (1 - Profit%)  [same algebra, but labour is per rough ct]
          const calcBid = (polValue, roughCts, labourPerCt, profitPct) => {
            if (roughCts <= 0) return 0;
            const totalLabour = labourPerCt * roughCts;
            const netValue = polValue - totalLabour;
            const netPerCt = netValue / roughCts;
            return netPerCt * (1 - profitPct / 100);
          };

          // Grand totals
          const gRc = allParcelPolish.reduce((s,p)=>s+p.rC,0);
          const gPc = allParcelPolish.reduce((s,p)=>s+p.pC,0);
          const gTot = allParcelPolish.reduce((s,p)=>s+p.tot,0);

          return <>
          {/* Global Defaults */}
          <div className="card">
            <div className="card-hdr">
              <span className="card-title">Bid Calculator — Global Defaults</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>Override per parcel below if needed</span>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="field">
                  <span className="lbl">Labour Cost $/ct (Rough)</span>
                  <NI value={globalLabour} onChange={v => setGlobalLabour(v === "" ? 0 : parseFloat(v) || 0)} style={{width:90,fontSize:14,fontWeight:700,padding:"6px 10px"}} />
                </div>
                <div className="field">
                  <span className="lbl">Profit Margin %</span>
                  <NI value={globalProfit} onChange={v => setGlobalProfit(v === "" ? 0 : parseFloat(v) || 0)} style={{width:90,fontSize:14,fontWeight:700,padding:"6px 10px"}} />
                </div>
                <div style={{alignSelf:"flex-end",paddingBottom:4,fontSize:11,color:"var(--text3)"}}>
                  Formula: <strong style={{color:"var(--text)"}}>Bid = ((Pol Value − Labour$/ct × Rough CTS) / Rough CTS) × (1 − Profit%)</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Master Table */}
          <div className="card">
            <div className="card-hdr"><span className="card-title">All Parcels — Overview & Bid Price</span></div>
            <div className="overflow-x">
              <table><thead>
                <tr>
                  <th style={{textAlign:"left"}} rowSpan={2}>Lot</th>
                  <th style={{textAlign:"left"}} rowSpan={2}>Parcel</th>
                  <th rowSpan={2}>Type</th>
                  <th colSpan={3}>Rough</th>
                  <th colSpan={3}>Polish</th>
                  <th rowSpan={2}>Yield %</th>
                  <th rowSpan={2}>Pol Value</th>
                  <th rowSpan={2}>Pol $/ct</th>
                  <th style={{borderLeft:"2px solid var(--border2)"}} rowSpan={2}>Rough $/ct<br/><span style={{fontSize:8,fontWeight:400,color:"var(--text3)"}}>Pol Val / R.Cts</span></th>
                  <th rowSpan={2}>Last Sold</th>
                  <th style={{borderLeft:"2px solid var(--border2)",background:"var(--blue-bg)",color:"var(--blue)"}} colSpan={4}>Bid Calculator</th>
                </tr>
                <tr>
                  <th>CTS</th><th>PCS</th><th>Avg Size</th><th>CTS</th><th>PCS</th><th>Avg Size</th>
                  <th style={{background:"var(--blue-bg)",borderLeft:"2px solid var(--border2)"}}>Labour</th>
                  <th style={{background:"var(--blue-bg)"}}>Profit %</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>Bid $/ct</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>vs Last</th>
                </tr>
              </thead><tbody>
                {PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi];
                  const pcl = parcels[pi];
                  const roughPerCt = p.rC > 0 ? p.tot / p.rC : 0;
                  const polPerCt = p.pC > 0 ? p.tot / p.pC : 0;
                  const yld = p.rC > 0 ? p.pC / p.rC * 100 : 0;
                  const roughAvg = p.rP > 0 ? p.rC / p.rP : 0;
                  const polAvg = p.pP > 0 ? p.pC / p.pP : 0;
                  const labour = getLabour(pi);
                  const profit = getProfit(pi);
                  const bid = calcBid(p.tot, p.rC, labour, profit);
                  const totalLabour = labour * p.rC;
                  const lastSold = parseFloat(pcl.lastSold) || 0;
                  const vsPrev = lastSold > 0 ? ((bid - lastSold) / lastSold * 100) : 0;
                  const pp = perParcelBid[pi];
                  const isOverride = pp && !pp.useGlobal;

                  return (
                    <tr key={pi} style={{borderTop:"1px solid var(--border)"}}>
                      <td className="left">#{pcl.number}</td>
                      <td className="left" style={{maxWidth:160}}>{pDef.label}</td>
                      <td><span className={`badge ${pDef.type === "SW" ? "badge-blue" : "badge-amber"}`} style={{fontSize:9}}>{pDef.type}</span></td>
                      <td>{f(p.rC,1)}</td>
                      <td>{f(p.rP,0)}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11}}>{roughAvg > 0 ? f(roughAvg,4) : "—"}</td>
                      <td className="blue">{f(p.pC,1)}</td>
                      <td className="blue">{f(p.pP,0)}</td>
                      <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--blue)"}}>{polAvg > 0 ? f(polAvg,4) : "—"}</td>
                      <td>{f(yld,1)}%</td>
                      <td className="amber bold">{fd(p.tot)}</td>
                      <td>{polPerCt > 0 ? fd(polPerCt) : "—"}</td>
                      <td style={{borderLeft:"2px solid var(--border2)",fontWeight:700,color:"var(--blue)"}}>{roughPerCt > 0 ? fd(roughPerCt) : "—"}</td>
                      <td>{lastSold > 0 ? "$"+lastSold : "—"}</td>
                      <td style={{borderLeft:"2px solid var(--border2)"}}>
                        <NI value={isOverride ? pp.labour : globalLabour}
                          className={`ni ${isOverride ? "ni-yellow" : ""}`}
                          style={{width:55}}
                          onChange={v => setPerParcelBid(prev => { const n=[...prev]; n[pi]={...n[pi], labour: v, useGlobal: false}; return n; })}
                        />
                      </td>
                      <td>
                        <NI value={isOverride ? pp.profit : globalProfit}
                          className={`ni ${isOverride ? "ni-yellow" : ""}`}
                          style={{width:50}}
                          onChange={v => setPerParcelBid(prev => { const n=[...prev]; n[pi]={...n[pi], profit: v, useGlobal: false}; return n; })}
                        />
                      </td>
                      <td style={{fontWeight:800,fontSize:14,color: bid > 0 ? "var(--green)" : "var(--text3)"}}>{bid > 0 ? "$"+f(bid,0) : "—"}</td>
                      <td style={{fontWeight:600,fontSize:11,color: vsPrev > 0 ? "var(--red)" : vsPrev < 0 ? "var(--green)" : "var(--text3)"}}>
                        {lastSold > 0 && bid > 0 ? (vsPrev >= 0 ? "+" : "") + f(vsPrev,1) + "%" : "—"}
                      </td>
                    </tr>);
                })}
                {/* Grand Totals */}
                <tr style={{borderTop:"3px solid var(--border)",background:"#f1f3f7"}}>
                  <td className="left" colSpan={3} style={{color:"var(--blue)",fontSize:12}}>GRAND TOTAL</td>
                  <td className="bold">{f(gRc,1)}</td>
                  <td className="bold">{f(allParcelPolish.reduce((s,p)=>s+p.rP,0),0)}</td>
                  <td style={{fontFamily:"var(--mono)",fontSize:11}}>{(()=>{const rp=allParcelPolish.reduce((s,p)=>s+p.rP,0); return rp>0?f(gRc/rp,4):"—";})()}</td>
                  <td className="blue bold">{f(gPc,1)}</td>
                  <td className="blue bold">{f(allParcelPolish.reduce((s,p)=>s+p.pP,0),0)}</td>
                  <td style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--blue)"}}>{(()=>{const pp=allParcelPolish.reduce((s,p)=>s+p.pP,0); return pp>0?f(gPc/pp,4):"—";})()}</td>
                  <td className="bold">{gRc > 0 ? f(gPc/gRc*100,1)+"%" : "—"}</td>
                  <td className="amber bold">{fd(gTot)}</td>
                  <td className="bold">{gPc > 0 ? fd(gTot/gPc) : "—"}</td>
                  <td style={{borderLeft:"2px solid var(--border2)",fontWeight:800,color:"var(--blue)"}}>{gRc > 0 ? fd(gTot/gRc) : "—"}</td>
                  <td></td>
                  <td style={{borderLeft:"2px solid var(--border2)"}} colSpan={4}></td>
                </tr>
              </tbody></table>
            </div>
            <div style={{padding:"8px 14px",fontSize:10,color:"var(--text3)",display:"flex",gap:16}}>
              <span>Yellow inputs = per-parcel override</span>
              <span>vs Last = % difference between bid and last auction price</span>
              <span style={{color:"var(--green)"}}>Green = below last sold</span>
              <span style={{color:"var(--red)"}}>Red = above last sold</span>
            </div>
          </div>

          {/* Per-Parcel Bid Detail Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(340px, 1fr))",gap:14}}>
            {PARCEL_DEFS.map((pDef, pi) => {
              const p = allParcelPolish[pi];
              const pcl = parcels[pi];
              const roughPerCt = p.rC > 0 ? p.tot / p.rC : 0;
              const labour = getLabour(pi);
              const profit = getProfit(pi);
              const bid = calcBid(p.tot, p.rC, labour, profit);
              const lastSold = parseFloat(pcl.lastSold) || 0;
              const totalLabour = labour * p.rC;
              const netValue = p.tot - totalLabour;
              const netPerCt = p.rC > 0 ? netValue / p.rC : 0;
              const yld = p.rC > 0 ? p.pC / p.rC * 100 : 0;

              return (
                <div key={pi} className="card">
                  <div className="card-hdr">
                    <span className="card-title" style={{fontSize:10}}>#{pcl.number} {pDef.label}</span>
                    <span className={`badge ${pDef.type === "SW" ? "badge-blue" : "badge-amber"}`}>{pDef.type}</span>
                  </div>
                  <div className="card-body">
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      <div><span className="lbl">Rough CTS</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{f(p.rC,2)}</div></div>
                      <div><span className="lbl">Polish CTS</span><div style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--blue)"}}>{f(p.pC,2)}</div></div>
                      <div><span className="lbl">Yield</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{f(yld,1)}%</div></div>
                      <div><span className="lbl">Polish Value</span><div style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--amber)"}}>{fd(p.tot)}</div></div>
                      <div><span className="lbl">Last Sold $/ct</span><div style={{fontFamily:"var(--mono)",fontWeight:600}}>{lastSold > 0 ? "$"+lastSold : "—"}</div></div>
                      <div><span className="lbl">Hot Size %</span><div style={{fontFamily:"var(--mono)",fontWeight:600,color: p.hotPct > 50 ? "var(--green)" : "var(--red)"}}>{f(p.hotPct,1)}%</div></div>
                    </div>

                    {/* Waterfall */}
                    <div style={{background:"#f8f9fb",borderRadius:6,padding:10,border:"1px solid var(--border)"}}>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Total Polish Value</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--amber)"}}>{fd(p.tot)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--red)"}}>− Labour (${f(labour,0)}/ct × {f(p.rC,1)} cts)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--red)"}}>−{fd(totalLabour)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Net Value</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600}}>{netValue > 0 ? fd(netValue) : "—"}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--text2)"}}>Net $/ct Rough (÷ {f(p.rC,1)} cts)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:700,color:"var(--blue)"}}>{netPerCt > 0 ? "$"+f(netPerCt,2) : "—"}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid var(--border)"}}>
                        <span style={{fontSize:11,color:"var(--red)"}}>× (1 − {f(profit,1)}% profit)</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:600,color:"var(--red)"}}>×{f(1 - profit/100,3)}</span>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",padding:"6px 0",marginTop:4,borderTop:"2px solid var(--border)"}}>
                        <span style={{fontSize:13,fontWeight:700,color:"var(--green)"}}>BID PRICE $/ct</span>
                        <span style={{fontFamily:"var(--mono)",fontWeight:800,fontSize:18,color:"var(--green)"}}>{bid > 0 ? "$"+f(bid,0) : "—"}</span>
                      </div>
                      {lastSold > 0 && bid > 0 && <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}>
                        <span style={{fontSize:10,color:"var(--text3)"}}>vs Last Sold (${lastSold})</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:700,color: bid > lastSold ? "var(--red)" : "var(--green)"}}>
                          {bid > lastSold ? "↑" : "↓"} ${f(Math.abs(bid - lastSold),0)} ({(bid > lastSold ? "+" : "") + f((bid - lastSold)/lastSold*100,1)}%)
                        </span>
                      </div>}
                    </div>
                  </div>
                </div>);
            })}
          </div>

          {/* Bid Comparison Chart */}
          {/* ═══ PL-A vs PL-M COMPARISON ═══ */}
          <div className="card" style={{borderLeft:"3px solid var(--blue)"}}>
            <div className="card-hdr">
              <span className="card-title">Price List Comparison — PL-A vs PL-M (Surat Market)</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>PL-M = Avg(PL-X,PL-Y) + 20% premium · Realistic EF PL-based color/clarity discounts</span>
            </div>
            <div className="overflow-x">
              <table><thead>
                <tr>
                  <th style={{textAlign:"left"}}>Lot</th>
                  <th style={{textAlign:"left"}}>Parcel</th>
                  <th>Rough CTS</th>
                  <th style={{background:"var(--blue-bg)",color:"var(--blue)"}}>PL-A Value</th>
                  <th style={{background:"var(--blue-bg)",color:"var(--blue)"}}>PL-A $/ct R</th>
                  <th style={{background:"var(--blue-bg)",color:"var(--blue)"}}>PL-A Bid</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>PL-M Value</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>PL-M $/ct R</th>
                  <th style={{background:"var(--green-bg)",color:"var(--green)"}}>PL-M Bid</th>
                  <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Savings $</th>
                  <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Savings %</th>
                  <th>Last Sold</th>
                </tr>
              </thead><tbody>
                {PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi]; const pcl = parcels[pi];
                  const bidA = calcBid(p.totA, p.rC, getLabour(pi), getProfit(pi));
                  const bidM = calcBid(p.totM, p.rC, getLabour(pi), getProfit(pi));
                  const savings = p.totM - p.totA;
                  const savPct = p.totA > 0 ? savings / p.totA * 100 : 0;
                  return <tr key={pDef.id}>
                    <td style={{textAlign:"left",fontWeight:600}}>#{pcl.number}</td>
                    <td style={{textAlign:"left",fontSize:11}}>{pDef.label}</td>
                    <td>{p.rC.toFixed(1)}</td>
                    <td style={{background:"var(--blue-bg)",fontWeight:600}}>${p.totA.toLocaleString()}</td>
                    <td style={{background:"var(--blue-bg)"}}>${p.rC > 0 ? Math.round(p.totA/p.rC) : 0}</td>
                    <td style={{background:"var(--blue-bg)",fontWeight:600}}>${Math.round(bidA)}</td>
                    <td style={{background:"var(--green-bg)",fontWeight:600}}>${p.totM.toLocaleString()}</td>
                    <td style={{background:"var(--green-bg)"}}>${p.rC > 0 ? Math.round(p.totM/p.rC) : 0}</td>
                    <td style={{background:"var(--green-bg)",fontWeight:600}}>${Math.round(bidM)}</td>
                    <td style={{background:"var(--amber-bg)",fontWeight:700,color:savings>0?"var(--green)":"var(--red)"}}>{savings>0?"+":""}${Math.round(savings).toLocaleString()}</td>
                    <td style={{background:"var(--amber-bg)",fontWeight:600,color:savings>0?"var(--green)":"var(--red)"}}>{savings>0?"+":""}{savPct.toFixed(1)}%</td>
                    <td style={{fontWeight:600}}>${pcl.lastSold}</td>
                  </tr>;
                })}
                {(() => {
                  const tA = allParcelPolish.reduce((s,p)=>s+p.totA,0);
                  const tM = allParcelPolish.reduce((s,p)=>s+p.totM,0);
                  const tRc = allParcelPolish.reduce((s,p)=>s+p.rC,0);
                  const sav = tM - tA; const sp = tA > 0 ? sav/tA*100 : 0;
                  return <tr style={{fontWeight:700,borderTop:"2px solid var(--border2)"}}>
                    <td colSpan={2} style={{textAlign:"left"}}>GRAND TOTAL</td>
                    <td>{tRc.toFixed(1)}</td>
                    <td style={{background:"var(--blue-bg)"}}>${tA.toLocaleString()}</td>
                    <td style={{background:"var(--blue-bg)"}}>${tRc>0?Math.round(tA/tRc):0}</td>
                    <td style={{background:"var(--blue-bg)"}}>—</td>
                    <td style={{background:"var(--green-bg)"}}>${tM.toLocaleString()}</td>
                    <td style={{background:"var(--green-bg)"}}>${tRc>0?Math.round(tM/tRc):0}</td>
                    <td style={{background:"var(--green-bg)"}}>—</td>
                    <td style={{background:"var(--amber-bg)",color:sav>0?"var(--green)":"var(--red)"}}>{sav>0?"+":""}${Math.round(sav).toLocaleString()}</td>
                    <td style={{background:"var(--amber-bg)",color:sav>0?"var(--green)":"var(--red)"}}>{sav>0?"+":""}{sp.toFixed(1)}%</td>
                    <td>—</td>
                  </tr>;
                })()}
              </tbody></table>
            </div>
            <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
              PL-A = EF Price List rates (direct) · PL-M = Market average + 20% Surat premium · Color: DEF=100%, GHI=75%, JK=48.75% · Clarity: VVS=100%, VS1=81.5%, VS2=69.3%, SI1=59%, SI2=50%
            </div>
          </div>

          {/* Comparison bar chart */}
          <div className="chart-wrap">
            <div className="chart-box" style={{flex:"1 1 100%"}}>
              <div className="chart-title">PL-A vs PL-M — Polish Value & Bid Price Comparison</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi]; const pcl = parcels[pi];
                  return {
                    name: "#"+pcl.number+" "+pDef.type,
                    "PL-A Value": p.totA, "PL-M Value": p.totM,
                    "PL-A Bid": Math.round(calcBid(p.totA, p.rC, getLabour(pi), getProfit(pi))),
                    "PL-M Bid": Math.round(calcBid(p.totM, p.rC, getLabour(pi), getProfit(pi))),
                    "Last Sold": parseFloat(pcl.lastSold) || 0,
                  };
                })} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                  <XAxis dataKey="name" tick={{fontSize:10,fill:CX}} />
                  <YAxis tick={{fontSize:10,fill:CY}} tickFormatter={v => "$"+v} />
                  <Tooltip formatter={(v) => "$"+Number(v).toLocaleString()} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="PL-A Bid" fill="#3b82f6" radius={[4,4,0,0]} />
                  <Bar dataKey="PL-M Bid" fill="#16a34a" radius={[4,4,0,0]} />
                  <Bar dataKey="Last Sold" fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ═══ AMAY Q1: PARCEL PRIORITY (Hot Band weighted) ═══ */}
          <div className="card" style={{borderLeft:"3px solid var(--amber)"}}>
            <div className="card-hdr">
              <span className="card-title">Q1: Parcel Priority — Hot Band Weighted Ranking</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>Highest weight = hot band concentration × non-commercial value</span>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th>Rank</th><th style={{textAlign:"left"}}>Parcel</th><th>Type</th><th>Rough CTS</th>
                <th style={{background:"var(--green-bg)",color:"var(--green)"}}>Hot Band %</th>
                <th style={{background:"var(--green-bg)",color:"var(--green)"}}>Hot Value $</th>
                <th>Non-Comm %</th><th>DEF %</th><th>+11 Seg %</th>
                <th style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Priority Score</th>
                <th>Recommendation</th>
              </tr></thead><tbody>
                {(() => {
                  const scored = PARCEL_DEFS.map((pDef, pi) => {
                    const p = allParcelPolish[pi]; const pcl = parcels[pi];
                    const hotRows = p.rows.filter(r => isHot(r.av, r.co, r.cl));
                    const hotCts = hotRows.reduce((s,r) => s+r.pC, 0);
                    const hotVal = hotRows.reduce((s,r) => s+r.tot, 0);
                    const hotPct = p.pC > 0 ? hotCts / p.pC * 100 : 0;
                    const ncRows = p.rows.filter(r => !isCommercial(r.co, r.cl));
                    const ncPct = p.pC > 0 ? ncRows.reduce((s,r)=>s+r.pC,0) / p.pC * 100 : 0;
                    const defRows = p.rows.filter(r => r.co === "DEF");
                    const defPct = p.pC > 0 ? defRows.reduce((s,r)=>s+r.pC,0) / p.pC * 100 : 0;
                    // +11 segment weight (bigger sizes = higher value)
                    const seg11 = pDef.segs.includes("+11") ? (pDef.id.includes("79") ? (pDef.type==="SW"?52:43) : 0) : 0;
                    // Priority score: hot% × 3 + nonComm% × 1 + DEF% × 1 + seg11% × 0.5
                    const score = hotPct * 3 + ncPct * 1 + defPct * 1 + seg11 * 0.5;
                    return { pi, pDef, pcl, p, hotPct, hotVal, ncPct, defPct, seg11, score };
                  }).sort((a, b) => b.score - a.score);
                  const recs = ["Chase first — highest hot band + SW premium", "Strong volume play — largest parcel", "Small but all rounds — fill specific orders", "Last priority — falling melee market"];
                  return scored.map((s, rank) => <tr key={s.pDef.id} style={rank===0?{background:"var(--green-bg)"}:{}}>
                    <td style={{fontWeight:700,fontSize:16,color:rank===0?"var(--green)":"var(--text)"}}>{rank+1}</td>
                    <td style={{textAlign:"left",fontWeight:700,color:"var(--blue)"}}>#{s.pcl.number} {s.pDef.label}</td>
                    <td><span className={`badge ${s.pDef.type==="SW"?"badge-blue":"badge-amber"}`} style={{fontSize:9}}>{s.pDef.type}</span></td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{f(s.p.rC,1)}</td>
                    <td style={{background:"var(--green-bg)",fontWeight:700,color:"var(--green)",fontFamily:"'DM Mono',monospace"}}>{s.hotPct.toFixed(1)}%</td>
                    <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>${s.hotVal.toLocaleString()}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{s.ncPct.toFixed(1)}%</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{s.defPct.toFixed(1)}%</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{s.seg11}%</td>
                    <td style={{background:"var(--amber-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace",color:"var(--amber)"}}>{s.score.toFixed(0)}</td>
                    <td style={{fontSize:10,textAlign:"left",color:"var(--text2)"}}>{recs[rank] || ""}</td>
                  </tr>);
                })()}
              </tbody></table>
            </div>
            <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
              Score = Hot Band % × 3 + Non-Commercial % × 1 + DEF % × 1 + Big Segment (+11) % × 0.5 · Hot bands: 0.012-0.013ct, 0.033-0.037ct, 0.078-0.200ct · Non-commercial = DEF/G/H × VVS/VS1/VS2 only
            </div>
          </div>

          {/* ═══ AMAY Q2: BID PRICES AT BREAKEVEN, 10%, 15%, 20% ═══ */}
          <div className="card" style={{borderLeft:"3px solid var(--blue)"}}>
            <div className="card-hdr">
              <span className="card-title">Q2: Bid Prices — Breakeven, 10%, 15%, 20% Profitability</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>Labour: ${globalLabour}/ct · Active PL: {pricingMode==="PL_M"?"PL-M":"PL-A"}</span>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Parcel</th><th>Rough CTS</th><th>Polish Value</th><th>Pol $/ct R</th>
                <th style={{background:"var(--red-bg)"}}>Breakeven</th>
                <th style={{background:"var(--amber-bg)"}}>10% Profit</th>
                <th style={{background:"var(--blue-bg)"}}>15% Profit</th>
                <th style={{background:"var(--green-bg)"}}>20% Profit</th>
                <th>Last Sold</th>
                <th>vs Last @10%</th><th>vs Last @15%</th><th>vs Last @20%</th>
              </tr></thead><tbody>
                {PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi]; const pcl = parcels[pi];
                  const bBE = calcBid(p.tot, p.rC, globalLabour, 0);
                  const b10 = calcBid(p.tot, p.rC, globalLabour, 10);
                  const b15 = calcBid(p.tot, p.rC, globalLabour, 15);
                  const b20 = calcBid(p.tot, p.rC, globalLabour, 20);
                  const ls = parseFloat(pcl.lastSold) || 0;
                  const vs = (b, l) => l > 0 ? ((b/l-1)*100).toFixed(0) : "—";
                  return <tr key={pDef.id}>
                    <td style={{textAlign:"left",fontWeight:700,color:"var(--blue)"}}>#{pcl.number} {pDef.label}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{f(p.rC,1)}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>${p.tot.toLocaleString()}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>${p.rC>0?Math.round(p.tot/p.rC):0}</td>
                    <td style={{background:"var(--red-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${Math.round(bBE)}</td>
                    <td style={{background:"var(--amber-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${Math.round(b10)}</td>
                    <td style={{background:"var(--blue-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${Math.round(b15)}</td>
                    <td style={{background:"var(--green-bg)",fontWeight:700,fontFamily:"'DM Mono',monospace"}}>${Math.round(b20)}</td>
                    <td style={{fontWeight:600}}>${ls}</td>
                    <td style={{color:b10>ls?"var(--green)":"var(--red)",fontWeight:600}}>{vs(b10,ls)}%</td>
                    <td style={{color:b15>ls?"var(--green)":"var(--red)",fontWeight:600}}>{vs(b15,ls)}%</td>
                    <td style={{color:b20>ls?"var(--green)":"var(--red)",fontWeight:600}}>{vs(b20,ls)}%</td>
                  </tr>;
                })}
                {(() => {
                  const tRc = allParcelPolish.reduce((s,p)=>s+p.rC,0);
                  const tTot = allParcelPolish.reduce((s,p)=>s+p.tot,0);
                  const bBE = calcBid(tTot, tRc, globalLabour, 0);
                  const b10 = calcBid(tTot, tRc, globalLabour, 10);
                  const b15 = calcBid(tTot, tRc, globalLabour, 15);
                  const b20 = calcBid(tTot, tRc, globalLabour, 20);
                  return <tr style={{fontWeight:700,borderTop:"2px solid var(--border2)"}}>
                    <td style={{textAlign:"left"}}>BLENDED</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>{f(tRc,1)}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>${tTot.toLocaleString()}</td>
                    <td style={{fontFamily:"'DM Mono',monospace"}}>${tRc>0?Math.round(tTot/tRc):0}</td>
                    <td style={{background:"var(--red-bg)",fontFamily:"'DM Mono',monospace"}}>${Math.round(bBE)}</td>
                    <td style={{background:"var(--amber-bg)",fontFamily:"'DM Mono',monospace"}}>${Math.round(b10)}</td>
                    <td style={{background:"var(--blue-bg)",fontFamily:"'DM Mono',monospace"}}>${Math.round(b15)}</td>
                    <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>${Math.round(b20)}</td>
                    <td colSpan={4}>—</td>
                  </tr>;
                })()}
              </tbody></table>
            </div>
            <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
              Bid = ((Polish Value − Labour × Rough CTS) / Rough CTS) × (1 − Profit%) · If bid {">"} last sold = green (room to bid higher), red = need to lower expectations or check assumptions
            </div>
          </div>

          {/* ═══ AMAY Q4: MANUFACTURE vs SELL AS ROUGH ═══ */}
          <div className="card" style={{borderLeft:"3px solid var(--purple)"}}>
            <div className="card-hdr">
              <span className="card-title">Q4: Manufacture vs Sell as Rough — Per Parcel Split</span>
            </div>
            <div className="overflow-x">
              <table><thead><tr>
                <th style={{textAlign:"left"}}>Parcel</th>
                <th colSpan={3} style={{background:"var(--green-bg)",color:"var(--green)"}}>Manufacture (Cut & Polish)</th>
                <th colSpan={3} style={{background:"var(--amber-bg)",color:"var(--amber)"}}>Sell as Rough</th>
                <th>Mfg %</th>
              </tr><tr>
                <th></th>
                <th style={{background:"var(--green-bg)",fontSize:9}}>Rough CTS</th>
                <th style={{background:"var(--green-bg)",fontSize:9}}>Polish Value</th>
                <th style={{background:"var(--green-bg)",fontSize:9}}>$/ct Rough</th>
                <th style={{background:"var(--amber-bg)",fontSize:9}}>Rough CTS</th>
                <th style={{background:"var(--amber-bg)",fontSize:9}}>Est. Value</th>
                <th style={{background:"var(--amber-bg)",fontSize:9}}>$/ct Rough</th>
                <th></th>
              </tr></thead><tbody>
                {PARCEL_DEFS.map((pDef, pi) => {
                  const p = allParcelPolish[pi]; const pcl = parcels[pi];
                  // Manufacture: DEF/G/H × VVS/VS1/VS2 × None/Faint fluo
                  const mfgRows = p.rows.filter(r => !isCommercial(r.co, r.cl));
                  const sellRows = p.rows.filter(r => isCommercial(r.co, r.cl));
                  const mfgRc = mfgRows.reduce((s,r)=>s+r.rC,0);
                  const mfgVal = mfgRows.reduce((s,r)=>s+r.tot,0);
                  const sellRc = sellRows.reduce((s,r)=>s+r.rC,0);
                  // Rough sell-off estimate: 70% of polish value (30% discount from polished rates)
                  const sellPolVal = sellRows.reduce((s,r)=>s+r.tot,0);
                  const sellVal = Math.round(sellPolVal * 0.70);
                  const mfgPct = p.rC > 0 ? (mfgRc / p.rC * 100).toFixed(0) : 0;
                  return <tr key={pDef.id}>
                    <td style={{textAlign:"left",fontWeight:700,color:"var(--blue)"}}>#{pcl.number} {pDef.label}</td>
                    <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>{f(mfgRc,1)}</td>
                    <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace",fontWeight:700}}>${mfgVal.toLocaleString()}</td>
                    <td style={{background:"var(--green-bg)",fontFamily:"'DM Mono',monospace"}}>${mfgRc>0?Math.round(mfgVal/mfgRc):0}</td>
                    <td style={{background:"var(--amber-bg)",fontFamily:"'DM Mono',monospace"}}>{f(sellRc,1)}</td>
                    <td style={{background:"var(--amber-bg)",fontFamily:"'DM Mono',monospace"}}>${sellVal.toLocaleString()}</td>
                    <td style={{background:"var(--amber-bg)",fontFamily:"'DM Mono',monospace"}}>${sellRc>0?Math.round(sellVal/sellRc):0}</td>
                    <td style={{fontWeight:700,color:"var(--green)"}}>{mfgPct}%</td>
                  </tr>;
                })}
              </tbody></table>
            </div>
            <div className="card-body" style={{borderTop:"1px solid var(--border)"}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text)",marginBottom:8}}>Decision Matrix:</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{background:"var(--green-bg)",borderRadius:8,padding:12,border:"1px solid var(--border)"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--green)",marginBottom:6}}>✓ MANUFACTURE</div>
                  <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.6}}>
                    DEF, G, H colors<br/>
                    VVS, VS1, VS2 clarities<br/>
                    None / Faint fluorescence<br/>
                    Round shape priority, then Pear/Oval<br/>
                    All hot band sizes (0.078-0.200ct priority)
                  </div>
                </div>
                <div style={{background:"var(--amber-bg)",borderRadius:8,padding:12,border:"1px solid var(--border)"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"var(--amber)",marginBottom:6}}>✗ SELL AS ROUGH</div>
                  <div style={{fontSize:11,color:"var(--text2)",lineHeight:1.6}}>
                    I, JK, L/M, CAPE colors — low polish prices<br/>
                    SI1, SI2 clarities — margins too thin<br/>
                    Medium/Strong fluorescence — discount exceeds cutting gain<br/>
                    Baguette/Marquise in lower colors — no demand<br/>
                    Est. rough sell-off: 70% of polish value (30% below polished rates)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ═══ PL-A vs PL-M PRICE COMPARISON — MAJORITY SIZES ═══ */}
          <div className="card" style={{borderLeft:"3px solid var(--blue)"}}>
            <div className="card-hdr">
              <span className="card-title">PL-A vs PL-M — Price Comparison by Majority Polish Sizes</span>
              <span style={{fontSize:10,color:"var(--text3)"}}>Shows why polish valuations differ between price lists</span>
            </div>
            <div className="card-body" style={{padding:0}}>
              {PARCEL_DEFS.map((pDef, pi) => {
                const p = allParcelPolish[pi]; const pcl = parcels[pi];
                // Group polish rows by sieve to find majority sizes
                const sieveGroups = {};
                for (const r of p.rows) {
                  if (r.pC <= 0 || !r.av || r.av <= 0) continue;
                  const svObj = findSv(r.av);
                  if (!svObj) continue;
                  const svId = svObj.id;
                  if (!sieveGroups[svId]) sieveGroups[svId] = { cts: 0, pcs: 0, totB: 0, totM: 0, rows: [] };
                  sieveGroups[svId].cts += r.pC;
                  sieveGroups[svId].pcs += r.pP;
                  sieveGroups[svId].rows.push(r);
                  // Get PL-A and PL-M prices for this cell
                  const plaPrice = PM_PLB[r.sh]?.[svId]?.[r.co]?.[r.cl] || 0;
                  const plmPrice = PM_PLM[r.sh]?.[svId]?.[r.co]?.[r.cl] || 0;
                  sieveGroups[svId].totB += r.pC * plaPrice;
                  sieveGroups[svId].totM += r.pC * plmPrice;
                }
                // Sort by weight descending, take top sieves
                const sorted = Object.entries(sieveGroups).sort((a,b) => b[1].cts - a[1].cts);
                const topSieves = sorted.slice(0, 4);
                const sr = (id) => SIEVE_RANGES.find(s => s.id === id);
                // Chart data for this parcel
                const chartData = topSieves.map(([sv, d]) => {
                  const s = sr(sv);
                  const avgB = d.cts > 0 ? Math.round(d.totB / d.cts) : 0;
                  const avgM = d.cts > 0 ? Math.round(d.totM / d.cts) : 0;
                  const diff = avgB > 0 ? Math.round((avgM - avgB) / avgB * 100) : 0;
                  return { name: s ? s.sieve+" ("+s.mm+")" : sv, "PL-A $/ct": avgB, "PL-M $/ct": avgM, cts: d.cts.toFixed(1), diff: diff+"%" };
                });

                return <div key={pDef.id} style={{borderBottom:"1px solid var(--border)",padding:"16px 20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div>
                      <span style={{fontWeight:700,color:"var(--blue)"}}>#{pcl.number} {pDef.label}</span>
                      <span style={{fontSize:11,color:"var(--text3)",marginLeft:8}}>{pDef.type} · {f(p.rC,1)} cts rough</span>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
                    <div style={{flex:"1 1 50%"}}>
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={chartData} barGap={4}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CG} />
                          <XAxis dataKey="name" tick={{fontSize:9,fill:CX}} />
                          <YAxis tick={{fontSize:9,fill:CY}} tickFormatter={v => "$"+v} />
                          <Tooltip formatter={(v) => "$"+v+"/ct"} />
                          <Legend wrapperStyle={{fontSize:10}} />
                          <Bar dataKey="PL-A $/ct" fill="#3b82f6" radius={[3,3,0,0]} />
                          <Bar dataKey="PL-M $/ct" fill="#16a34a" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{flex:"1 1 50%"}}>
                      <table style={{marginBottom:0}}>
                        <thead><tr>
                          <th style={{textAlign:"left",fontSize:10}}>Sieve</th>
                          <th style={{fontSize:10}}>Pol CTS</th>
                          <th style={{fontSize:10,color:"var(--blue)"}}>PL-A Avg</th>
                          <th style={{fontSize:10,color:"var(--green)"}}>PL-M Avg</th>
                          <th style={{fontSize:10}}>Diff</th>
                        </tr></thead>
                        <tbody>
                          {chartData.map(d => <tr key={d.name}>
                            <td style={{textAlign:"left",fontWeight:600,fontSize:11}}>{d.name}</td>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:11}}>{d.cts}</td>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--blue)"}}>${d["PL-A $/ct"]}</td>
                            <td style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:"var(--green)"}}>${d["PL-M $/ct"]}</td>
                            <td style={{fontWeight:700,fontSize:11,fontFamily:"'DM Mono',monospace",
                              color: parseInt(d.diff) > 0 ? "var(--green)" : "var(--red)"
                            }}>{d.diff}</td>
                          </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>;
              })}
            </div>
            <div style={{padding:"10px 16px",fontSize:11,color:"var(--text3)",borderTop:"1px solid var(--border)"}}>
              PL-A = Amay V3 prices (actual granular rates) · PL-M = Market (broker avg + 20% + 15% flat) · Avg $/ct weighted by polish CTS in each sieve · Top 4 sieves by weight shown per parcel
            </div>
          </div>

          </>;
        })()}

      </div>
    </div>
  );
}
