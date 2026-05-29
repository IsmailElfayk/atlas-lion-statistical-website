// Atlas Lions Analytics — Mock Data (mirrors design/data.js)
// Used as fallback and for frontend-only operations

export const CLUBS = {
  alhilal:    { id:'alhilal',    name:'Al-Hilal',         shortName:'HIL', league:'spl',     leagueName:'Saudi Pro League',     country:'SAU', color:'#0050B5', logo:'HIL' },
  alduhail:   { id:'alduhail',   name:'Al-Duhail',        shortName:'DUH', league:'qsl',     leagueName:'Qatar Stars League',   country:'QAT', color:'#7B0828', logo:'DUH' },
  alshabab:   { id:'alshabab',   name:'Al-Shabab',        shortName:'SHB', league:'spl',     leagueName:'Saudi Pro League',     country:'SAU', color:'#3A3A3A', logo:'SHB' },
  alain:      { id:'alain',      name:'Al-Ain',           shortName:'AIN', league:'uaepl',   leagueName:'UAE Pro League',       country:'ARE', color:'#7B1538', logo:'AIN' },
  psg:        { id:'psg',        name:'Paris Saint-Germain', shortName:'PSG', league:'l1',   leagueName:'Ligue 1',              country:'FRA', color:'#004170', logo:'PSG' },
  manutd:     { id:'manutd',     name:'Manchester United',shortName:'MUN', league:'pl',      leagueName:'Premier League',       country:'ENG', color:'#DA020E', logo:'MUN' },
  fener:      { id:'fener',      name:'Fenerbahçe',       shortName:'FEN', league:'sl',      leagueName:'Süper Lig',            country:'TUR', color:'#FFED00', logo:'FEN' },
  realsoc:    { id:'realsoc',    name:'Real Sociedad',    shortName:'RSO', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#003D7C', logo:'RSO' },
  marseille:  { id:'marseille',  name:'Marseille',        shortName:'OM',  league:'l1',      leagueName:'Ligue 1',              country:'FRA', color:'#009DDC', logo:'OM' },
  girona:     { id:'girona',     name:'Girona',           shortName:'GIR', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#CE1126', logo:'GIR' },
  leicester:  { id:'leicester',  name:'Leicester City',   shortName:'LEI', league:'pl',      leagueName:'Premier League',       country:'ENG', color:'#003090', logo:'LEI' },
  realmadrid: { id:'realmadrid', name:'Real Madrid',      shortName:'RMA', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#FEBE10', logo:'RMA' },
  monaco:     { id:'monaco',     name:'AS Monaco',        shortName:'ASM', league:'l1',      leagueName:'Ligue 1',              country:'FRA', color:'#CD1119', logo:'ASM' },
  betis:      { id:'betis',      name:'Real Betis',       shortName:'BET', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#0BB363', logo:'BET' },
  villarreal: { id:'villarreal', name:'Villarreal',       shortName:'VIL', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#FFE667', logo:'VIL' },
  lazio:      { id:'lazio',      name:'Lazio',            shortName:'LAZ', league:'seriea',  leagueName:'Serie A',              country:'ITA', color:'#87CEEB', logo:'LAZ' },
  frankfurt:  { id:'frankfurt',  name:'Eintracht Frankfurt',shortName:'SGE',league:'bl',     leagueName:'Bundesliga',           country:'GER', color:'#E1000F', logo:'SGE' },
  bayern:     { id:'bayern',     name:'Bayern München',   shortName:'BAY', league:'bl',      leagueName:'Bundesliga',           country:'GER', color:'#DC052D', logo:'BAY' },
  psv:        { id:'psv',        name:'PSV Eindhoven',    shortName:'PSV', league:'ed',      leagueName:'Eredivisie',           country:'NED', color:'#ED1C24', logo:'PSV' },
  roma:       { id:'roma',       name:'AS Roma',          shortName:'ROM', league:'seriea',  leagueName:'Serie A',              country:'ITA', color:'#8E1F2F', logo:'ROM' },
  olympiacos: { id:'olympiacos', name:'Olympiacos',       shortName:'OLY', league:'gsl',     leagueName:'Super League Greece',  country:'GRE', color:'#E60026', logo:'OLY' },
  espanyol:   { id:'espanyol',   name:'Espanyol',         shortName:'ESP', league:'laliga',  leagueName:'LaLiga',               country:'ESP', color:'#005EB8', logo:'ESP' },
  toulouse:   { id:'toulouse',   name:'Toulouse',         shortName:'TFC', league:'l1',      leagueName:'Ligue 1',              country:'FRA', color:'#581F87', logo:'TFC' },
  lens:       { id:'lens',       name:'RC Lens',          shortName:'RCL', league:'l1',      leagueName:'Ligue 1',              country:'FRA', color:'#FFE800', logo:'RCL' },
  gent:       { id:'gent',       name:'KAA Gent',         shortName:'GNT', league:'jpl',     leagueName:'Pro League',           country:'BEL', color:'#005EB8', logo:'GNT' },
  wydad:      { id:'wydad',      name:'Wydad AC',         shortName:'WAC', league:'botola',  leagueName:'Botola Pro',           country:'MAR', color:'#C1121F', logo:'WAC' },
  raja:       { id:'raja',       name:'Raja CA',          shortName:'RCA', league:'botola',  leagueName:'Botola Pro',           country:'MAR', color:'#007A3D', logo:'RCA' },
  far:        { id:'far',        name:'AS FAR',           shortName:'FAR', league:'botola',  leagueName:'Botola Pro',           country:'MAR', color:'#A52A2A', logo:'FAR' },
  rs_berkane: { id:'rs_berkane', name:'RS Berkane',       shortName:'RSB', league:'botola',  leagueName:'Botola Pro',           country:'MAR', color:'#FF6600', logo:'RSB' },
};

export const BUCKETS = {
  pl:'big5', laliga:'big5', seriea:'big5', bl:'big5', l1:'big5',
  ed:'other_europe', sl:'other_europe', jpl:'other_europe', gsl:'other_europe',
  spl:'mena', qsl:'mena', uaepl:'mena',
  botola:'botola',
};

export const FORMATIONS = {
  '4-3-3': [
    { slot:'GK', x:340, y:430 },
    { slot:'LB', x:120, y:340 }, { slot:'CB', x:260, y:355 }, { slot:'CB', x:420, y:355 }, { slot:'RB', x:560, y:340 },
    { slot:'CM', x:200, y:240 }, { slot:'CM', x:340, y:255 }, { slot:'CM', x:480, y:240 },
    { slot:'LW', x:140, y:120 }, { slot:'ST', x:340, y:90 },  { slot:'RW', x:540, y:120 },
  ],
  '4-2-3-1': [
    { slot:'GK', x:340, y:430 },
    { slot:'LB', x:120, y:340 }, { slot:'CB', x:260, y:355 }, { slot:'CB', x:420, y:355 }, { slot:'RB', x:560, y:340 },
    { slot:'DM', x:260, y:260 }, { slot:'DM', x:420, y:260 },
    { slot:'LW', x:140, y:160 }, { slot:'AM', x:340, y:180 }, { slot:'RW', x:540, y:160 },
    { slot:'ST', x:340, y:80 },
  ],
  '3-4-3': [
    { slot:'GK', x:340, y:430 },
    { slot:'CB', x:180, y:355 }, { slot:'CB', x:340, y:360 }, { slot:'CB', x:500, y:355 },
    { slot:'WB', x:90, y:255 },  { slot:'CM', x:260, y:260 }, { slot:'CM', x:420, y:260 }, { slot:'WB', x:590, y:255 },
    { slot:'LW', x:160, y:120 }, { slot:'ST', x:340, y:90 },  { slot:'RW', x:520, y:120 },
  ],
  '3-5-2': [
    { slot:'GK', x:340, y:430 },
    { slot:'CB', x:180, y:355 }, { slot:'CB', x:340, y:360 }, { slot:'CB', x:500, y:355 },
    { slot:'WB', x:90, y:250 },  { slot:'CM', x:230, y:260 }, { slot:'CM', x:340, y:280 }, { slot:'CM', x:450, y:260 }, { slot:'WB', x:590, y:250 },
    { slot:'ST', x:260, y:110 }, { slot:'ST', x:420, y:110 },
  ],
  '4-4-2': [
    { slot:'GK', x:340, y:430 },
    { slot:'LB', x:120, y:340 }, { slot:'CB', x:260, y:355 }, { slot:'CB', x:420, y:355 }, { slot:'RB', x:560, y:340 },
    { slot:'LM', x:130, y:230 }, { slot:'CM', x:270, y:250 }, { slot:'CM', x:410, y:250 }, { slot:'RM', x:550, y:230 },
    { slot:'ST', x:260, y:110 }, { slot:'ST', x:420, y:110 },
  ],
  '5-4-1': [
    { slot:'GK', x:340, y:430 },
    { slot:'WB', x:90, y:340 }, { slot:'CB', x:220, y:360 }, { slot:'CB', x:340, y:365 }, { slot:'CB', x:460, y:360 }, { slot:'WB', x:590, y:340 },
    { slot:'LM', x:140, y:240 }, { slot:'CM', x:270, y:260 }, { slot:'CM', x:410, y:260 }, { slot:'RM', x:540, y:240 },
    { slot:'ST', x:340, y:100 },
  ],
  '5-3-2': [
    { slot:'GK', x:340, y:430 },
    { slot:'WB', x:80, y:330 }, { slot:'CB', x:215, y:360 }, { slot:'CB', x:340, y:365 }, { slot:'CB', x:465, y:360 }, { slot:'WB', x:600, y:330 },
    { slot:'CM', x:230, y:240 }, { slot:'CM', x:340, y:258 }, { slot:'CM', x:450, y:240 },
    { slot:'ST', x:265, y:105 }, { slot:'ST', x:415, y:105 },
  ],
  '4-1-4-1': [
    { slot:'GK', x:340, y:430 },
    { slot:'LB', x:120, y:345 }, { slot:'CB', x:260, y:358 }, { slot:'CB', x:420, y:358 }, { slot:'RB', x:560, y:345 },
    { slot:'DM', x:340, y:285 },
    { slot:'LM', x:120, y:185 }, { slot:'CM', x:270, y:200 }, { slot:'CM', x:410, y:200 }, { slot:'RM', x:560, y:185 },
    { slot:'ST', x:340, y:90 },
  ],
};

export const POS_TO_SLOTS = {
  GK:['GK'], CB:['CB'],
  RB:['RB','WB','RM'], LB:['LB','WB','LM'],
  WB:['WB','RB','LB'], RWB:['WB','RB','RM'], LWB:['WB','LB','LM'],
  CDM:['DM','CM'], DM:['DM','CM'],
  CM:['CM','DM','AM','LM','RM'],
  CAM:['AM','CM'], AM:['AM','CM'],
  LM:['LM','LW','CM'], RM:['RM','RW','CM'],
  LW:['LW','LM','ST'], RW:['RW','RM','ST'],
  ST:['ST','LW','RW','AM'], SS:['ST','LW','RW','AM'],
};

export const PLAYERS = [
  { id:'bounou',    name:'Yassine Bounou',     nameAr:'ياسين بونو',     pos:'GK',  age:34, height:192, foot:'R', clubId:'alhilal',    rating:7.6, mvEur:8_000_000,  minutes:1620, dataQ:'rating',    elig:'capped',     archetype:'Sweeper-Keeper',      nat:['MAR','CAN'] },
  { id:'munir',     name:'Munir Mohamedi',     nameAr:'منير محمدي',     pos:'GK',  age:35, height:189, foot:'R', clubId:'far',        rating:6.9, mvEur:600_000,    minutes:1530, dataQ:'heuristic', elig:'capped',     archetype:'Shot-Stopper',        nat:['MAR'] },
  { id:'hakimi',    name:'Achraf Hakimi',      nameAr:'أشرف حكيمي',    pos:'RB',  age:27, height:181, foot:'R', clubId:'psg',        rating:7.8, mvEur:75_000_000, minutes:1880, dataQ:'event',     elig:'capped',     archetype:'Inverted Fullback',   nat:['MAR','ESP'] },
  { id:'mazraoui',  name:'Noussair Mazraoui',  nameAr:'نصير مزراوي',   pos:'RB',  age:28, height:183, foot:'R', clubId:'manutd',     rating:7.2, mvEur:25_000_000, minutes:1690, dataQ:'event',     elig:'capped',     archetype:'Two-Way Fullback',    nat:['MAR','NED'] },
  { id:'saiss',     name:'Romain Saiss',       nameAr:'رومان السايس',  pos:'CB',  age:35, height:191, foot:'L', clubId:'alshabab',   rating:7.0, mvEur:2_500_000,  minutes:1740, dataQ:'rating',    elig:'capped',     archetype:'Aerial Stopper',      nat:['MAR','FRA'] },
  { id:'aguerd',    name:'Nayef Aguerd',       nameAr:'نايف أكرد',     pos:'CB',  age:30, height:188, foot:'L', clubId:'realsoc',    rating:7.5, mvEur:20_000_000, minutes:1810, dataQ:'event',     elig:'capped',     archetype:'Ball-Playing CB',     nat:['MAR'] },
  { id:'dari',      name:'Achraf Dari',        nameAr:'أشرف داري',     pos:'CB',  age:26, height:188, foot:'R', clubId:'frankfurt',  rating:7.1, mvEur:8_000_000,  minutes:1420, dataQ:'event',     elig:'capped',     archetype:'Aerial Stopper',      nat:['MAR'] },
  { id:'aznou',     name:'Adam Aznou',         nameAr:'آدم أزنو',      pos:'LB',  age:19, height:181, foot:'L', clubId:'bayern',     rating:7.0, mvEur:6_000_000,  minutes:780,  dataQ:'event',     elig:'eligible',   archetype:'Overlapping Fullback',nat:['MAR','ESP'] },
  { id:'salah_eddine',name:'Anass Salah-Eddine',nameAr:'أنس صلاح الدين',pos:'LB',age:23, height:179, foot:'L', clubId:'roma',       rating:7.0, mvEur:9_000_000,  minutes:1310, dataQ:'event',     elig:'switchable', archetype:'Two-Way Fullback',    nat:['MAR','NED'] },
  { id:'attiyat',   name:'Yahia Attiyat Allah',nameAr:'يحيى عطية الله',pos:'LB',  age:30, height:172, foot:'L', clubId:'wydad',      rating:6.8, mvEur:1_200_000,  minutes:1520, dataQ:'heuristic', elig:'capped',     archetype:'Overlapping Fullback',nat:['MAR'] },
  { id:'amrabat',   name:'Sofyan Amrabat',     nameAr:'سفيان أمرابط',  pos:'DM',  age:29, height:185, foot:'R', clubId:'fener',      rating:7.2, mvEur:15_000_000, minutes:1620, dataQ:'rating',    elig:'capped',     archetype:'Destroyer',           nat:['MAR','NED'] },
  { id:'ounahi',    name:'Azzedine Ounahi',    nameAr:'عز الدين أوناحي',pos:'CM', age:25, height:175, foot:'R', clubId:'girona',     rating:7.4, mvEur:18_000_000, minutes:1530, dataQ:'event',     elig:'capped',     archetype:'Deep-Lying Playmaker',nat:['MAR'] },
  { id:'saibari',   name:'Ismael Saibari',     nameAr:'إسماعيل صيباري',pos:'AM',  age:24, height:178, foot:'R', clubId:'psv',        rating:7.6, mvEur:22_000_000, minutes:1740, dataQ:'event',     elig:'capped',     archetype:'Progressive Carrier', nat:['MAR','ESP'] },
  { id:'khannouss', name:'Bilal El Khannouss', nameAr:'بلال الخنوس',   pos:'AM',  age:21, height:175, foot:'L', clubId:'leicester',  rating:7.2, mvEur:18_000_000, minutes:1480, dataQ:'event',     elig:'capped',     archetype:'Creative 10',         nat:['MAR','BEL'] },
  { id:'belahyane', name:'Reda Belahyane',     nameAr:'رضا بلحيان',    pos:'CM',  age:21, height:184, foot:'R', clubId:'lazio',      rating:7.0, mvEur:8_000_000,  minutes:1080, dataQ:'event',     elig:'switchable', archetype:'Box-to-Box',          nat:['MAR','FRA'] },
  { id:'el_aynaoui',name:'Neil El Aynaoui',    nameAr:'نيل العيناوي',  pos:'CM',  age:24, height:191, foot:'R', clubId:'lens',       rating:7.1, mvEur:12_000_000, minutes:1640, dataQ:'event',     elig:'switchable', archetype:'Box-to-Box',          nat:['MAR','FRA'] },
  { id:'nadir',     name:'Bilal Nadir',        nameAr:'بلال نادر',     pos:'AM',  age:21, height:174, foot:'R', clubId:'marseille',  rating:7.0, mvEur:7_000_000,  minutes:890,  dataQ:'event',     elig:'eligible',   archetype:'Creative 10',         nat:['MAR','FRA'] },
  { id:'ziyech',    name:'Hakim Ziyech',       nameAr:'حكيم زياش',     pos:'RW',  age:33, height:181, foot:'L', clubId:'alduhail',   rating:7.3, mvEur:4_000_000,  minutes:1520, dataQ:'rating',    elig:'capped',     archetype:'Set-Piece Wizard',    nat:['MAR','NED'] },
  { id:'diaz',      name:'Brahim Díaz',        nameAr:'إبراهيم دياز',  pos:'AM',  age:26, height:171, foot:'R', clubId:'realmadrid', rating:7.7, mvEur:55_000_000, minutes:1610, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','ESP'] },
  { id:'ben_seghir',name:'Eliesse Ben Seghir', nameAr:'إلياس بن صغير', pos:'RW',  age:21, height:172, foot:'L', clubId:'monaco',     rating:7.3, mvEur:30_000_000, minutes:1420, dataQ:'event',     elig:'switchable', archetype:'Inside Forward',      nat:['MAR','FRA'] },
  { id:'ezzalzouli',name:'Abde Ezzalzouli',    nameAr:'عبدالصمد الزلزولي',pos:'LW',age:24,height:172, foot:'R', clubId:'betis',     rating:7.2, mvEur:14_000_000, minutes:1390, dataQ:'event',     elig:'capped',     archetype:'Dribbling Winger',    nat:['MAR','ESP'] },
  { id:'akhomach',  name:'Ilias Akhomach',     nameAr:'إلياس أخوماش',  pos:'RW',  age:22, height:170, foot:'L', clubId:'villarreal', rating:7.0, mvEur:9_000_000,  minutes:1230, dataQ:'event',     elig:'capped',     archetype:'Dribbling Winger',    nat:['MAR','ESP'] },
  { id:'aboukhlal', name:'Zakaria Aboukhlal',  nameAr:'زكريا أبو خلال',pos:'RW',  age:26, height:182, foot:'L', clubId:'toulouse',   rating:7.1, mvEur:9_000_000,  minutes:1400, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','NED'] },
  { id:'tissoudali',name:'Tarik Tissoudali',   nameAr:'طارق تيسودالي', pos:'LW',  age:32, height:181, foot:'R', clubId:'gent',       rating:7.0, mvEur:3_500_000,  minutes:1240, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','NED'] },
  { id:'ennesyri',  name:'Youssef En-Nesyri',  nameAr:'يوسف النصيري',  pos:'ST',  age:28, height:189, foot:'R', clubId:'fener',      rating:7.5, mvEur:25_000_000, minutes:1720, dataQ:'rating',    elig:'capped',     archetype:'Target Forward',      nat:['MAR'] },
  { id:'kaabi',     name:'Ayoub El Kaabi',     nameAr:'أيوب الكعبي',   pos:'ST',  age:32, height:185, foot:'R', clubId:'olympiacos', rating:7.6, mvEur:8_000_000,  minutes:1690, dataQ:'event',     elig:'capped',     archetype:'Poacher',             nat:['MAR'] },
  { id:'cheddira',  name:'Walid Cheddira',     nameAr:'وليد شديرة',    pos:'ST',  age:27, height:189, foot:'R', clubId:'espanyol',   rating:6.9, mvEur:5_000_000,  minutes:1180, dataQ:'event',     elig:'capped',     archetype:'Target Forward',      nat:['MAR','ITA'] },
  { id:'rahimi',    name:'Soufiane Rahimi',    nameAr:'سفيان رحيمي',   pos:'ST',  age:29, height:179, foot:'R', clubId:'alain',      rating:7.4, mvEur:7_000_000,  minutes:1580, dataQ:'rating',    elig:'capped',     archetype:'Poacher',             nat:['MAR'] },
  { id:'jabrane',   name:'Yahya Jabrane',      nameAr:'يحيى جبران',    pos:'DM',  age:33, height:182, foot:'R', clubId:'wydad',      rating:6.9, mvEur:900_000,    minutes:1480, dataQ:'heuristic', elig:'capped',     archetype:'Destroyer',           nat:['MAR'] },
  { id:'mmaee',     name:'Samy Mmaee',         nameAr:'سامي مماي',     pos:'CB',  age:28, height:189, foot:'R', clubId:'rs_berkane', rating:6.8, mvEur:1_500_000,  minutes:1320, dataQ:'heuristic', elig:'switchable', archetype:'Aerial Stopper',      nat:['MAR','BEL'] },
];

const AVAILABILITY = {
  mazraoui:   { status:'doubtful',  returnDate:'2026-06-12' },
  aguerd:     { status:'injured',   returnDate:'2026-07-03' },
  ezzalzouli: { status:'injured',   returnDate:'2026-06-20' },
  nadir:      { status:'suspended', returnDate:'2026-06-06' },
};

PLAYERS.forEach(p => {
  p.club = CLUBS[p.clubId];
  p.bucket = BUCKETS[p.club?.league] || 'world';
  p.status = AVAILABILITY[p.id]?.status || 'available';
  p.returnDate = AVAILABILITY[p.id]?.returnDate;
});

export const FIXTURES = [
  { id:'f1', date:'2026-05-30', time:'21:00', status:'scheduled', competition:'CAF Champions League Final', home:CLUBS.wydad,    away:CLUBS.alain,     homePlayers:['attiyat','jabrane'], awayPlayers:['rahimi'] },
  { id:'f2', date:'2026-05-30', time:'18:30', status:'live',      competition:'LaLiga · MD 38',             home:CLUBS.realsoc,  away:CLUBS.realmadrid,homePlayers:['aguerd'],            awayPlayers:['diaz'],   score:[1,2] },
  { id:'f3', date:'2026-05-30', time:'17:00', status:'finished',  competition:'Premier League · MD 38',     home:CLUBS.manutd,   away:CLUBS.leicester, homePlayers:['mazraoui'],          awayPlayers:['khannouss'], score:[2,1] },
  { id:'f4', date:'2026-05-29', time:'21:00', status:'finished',  competition:'Ligue 1 · MD 34',            home:CLUBS.psg,      away:CLUBS.monaco,    homePlayers:['hakimi'],            awayPlayers:['ben_seghir'], score:[3,1] },
  { id:'f5', date:'2026-05-29', time:'20:00', status:'finished',  competition:'Süper Lig · MD 38',          home:CLUBS.fener,    away:CLUBS.olympiacos,homePlayers:['amrabat','ennesyri'],awayPlayers:['kaabi'], score:[2,2] },
  { id:'f6', date:'2026-06-02', time:'20:00', status:'scheduled', competition:'FIFA Friendly', home:{ id:'mar', name:'Morocco', shortName:'MAR', logo:'🇲🇦', color:'#C1121F', country:'MAR', leagueName:'International' }, away:{ id:'tun', name:'Tunisia', shortName:'TUN', logo:'🇹🇳', color:'#E70013', country:'TUN', leagueName:'International' }, homePlayers:['bounou','hakimi','aguerd','amrabat','ennesyri'], awayPlayers:[] },
  { id:'f7', date:'2026-06-06', time:'20:30', status:'scheduled', competition:'AFCON Qualifier', home:{ id:'mar', name:'Morocco', shortName:'MAR', logo:'🇲🇦', color:'#C1121F', country:'MAR', leagueName:'International' }, away:{ id:'mli', name:'Mali', shortName:'MLI', logo:'🇲🇱', color:'#14B53A', country:'MLI', leagueName:'International' }, homePlayers:['bounou','hakimi','aguerd','ounahi','ennesyri','diaz'], awayPlayers:[] },
  { id:'f8', date:'2026-06-01', time:'19:00', status:'scheduled', competition:'Botola Pro · MD 30', home:CLUBS.raja, away:CLUBS.far, homePlayers:[], awayPlayers:[] },
];

export const TRENDING = ['saibari','el_aynaoui','aznou','nadir','ben_seghir','khannouss']
  .map(id => PLAYERS.find(p => p.id === id))
  .filter(Boolean)
  .map(p => ({ ...p, ratingDelta: +(Math.random() * 0.6 + 0.2).toFixed(1) }));

export const COUNTRY_A2 = {
  MAR:'ma', ESP:'es', FRA:'fr', NED:'nl', BEL:'be', ITA:'it', ENG:'gb-eng', TUR:'tr',
  GER:'de', SAU:'sa', QAT:'qa', ARE:'ae', POR:'pt', GRE:'gr', CAN:'ca', USA:'us',
  TUN:'tn', MLI:'ml', ALG:'dz', EGY:'eg',
};

export function getRatingTone(rating) {
  if (rating == null || isNaN(rating)) return { fg:'#9EA89F', bg:'rgba(158,168,159,0.12)', solid:'#5C6760', label:'No data' };
  if (rating >= 8.0) return { fg:'#39B57A', bg:'rgba(0,122,61,0.16)',   solid:'#39B57A', label:'Elite' };
  if (rating >= 6.5) return { fg:'#E2C24A', bg:'rgba(212,175,55,0.14)', solid:'var(--color-gold)', label:'Good' };
  return { fg:'#E84856', bg:'rgba(193,18,31,0.14)', solid:'#E84856', label:'Below par' };
}

export function statusMeta(status) {
  return ({
    available: { color:'green', label:'Available', dot:'#39B57A', short:'OK' },
    doubtful:  { color:'gold',  label:'Doubtful',  dot:'var(--color-gold)', short:'?' },
    injured:   { color:'red',   label:'Injured',   dot:'#E84856', short:'INJ' },
    suspended: { color:'red',   label:'Suspended', dot:'#E84856', short:'SUS' },
  })[status] || { color:'gray', label:status, dot:'#5C6760', short:'' };
}

export function fmtMV(eur) {
  if (eur >= 1_000_000) return '€' + (eur / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'm';
  if (eur >= 1_000)     return '€' + Math.round(eur / 1_000) + 'k';
  return '€' + eur;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
}

export function fmtDateLong(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function hungarian(cost) {
  const n = cost.length;
  const INF = Infinity;
  const u = new Array(n+1).fill(0), v = new Array(n+1).fill(0);
  const p = new Array(n+1).fill(0), way = new Array(n+1).fill(0);
  for (let i = 1; i <= n; i++) {
    p[0] = i; let j0 = 0;
    const minv = new Array(n+1).fill(INF), used = new Array(n+1).fill(false);
    do {
      used[j0] = true; const i0 = p[j0]; let delta = INF, j1 = -1;
      for (let j = 1; j <= n; j++) {
        if (!used[j]) {
          const cur = cost[i0-1][j-1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
      }
      for (let j = 0; j <= n; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
  }
  const assignment = new Array(n).fill(-1);
  for (let j = 1; j <= n; j++) if (p[j] > 0) assignment[p[j]-1] = j-1;
  return assignment;
}

export function buildBestXI(formation, players) {
  const slots = FORMATIONS[formation];
  if (!slots) return [];
  const S = slots.length, pool = [...players], P = pool.length;
  const result = slots.map(s => ({ ...s, player: null, subs: [] }));
  const sortedAll = [...pool].sort((a, b) => b.rating - a.rating);
  if (P > 0) {
    const N = Math.max(S, P), BIG = 1e6;
    const cost = Array.from({length:N}, (_,i) => Array.from({length:N}, (_,j) => {
      if (i < S && j < P) { const elig = POS_TO_SLOTS[pool[j].pos]?.includes(slots[i].slot); return elig ? -pool[j].rating : BIG; }
      return 0;
    }));
    const assign = hungarian(cost);
    for (let i = 0; i < S; i++) { const j = assign[i]; if (j != null && j >= 0 && j < P && cost[i][j] < BIG) result[i].player = pool[j]; }
  }
  const startingIds = new Set(result.map(r => r.player?.id).filter(Boolean));
  result.forEach(rs => { rs.subs = sortedAll.filter(p => !startingIds.has(p.id) && POS_TO_SLOTS[p.pos]?.includes(rs.slot)).slice(0,9); });
  return result;
}

export function genRatingHistory(player, days = 180) {
  const base = player.rating; const result = [];
  const now = new Date('2026-05-28'); let mc = 0;
  const oppPool = ['vs Granada','vs Sevilla','vs Atlético','vs Valencia','vs Getafe','vs Mallorca'];
  const ntOpp   = ['vs Tunisia','vs Mali','vs Zambia','vs Gabon','vs Congo'];
  const contOpp = ['vs Inter','vs Dortmund','vs Porto'];
  for (let i = days-1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (Math.random() < 0.18) {
      mc++;
      const noise = (Math.sin(i*0.31)*0.4) + ((Math.random()-0.5)*0.9);
      const r = Math.max(4.5, Math.min(9.4, base + noise));
      const roll = Math.random();
      let competitionType, oppList, comp;
      if (roll < 0.12)      { competitionType='national';    oppList=ntOpp;   comp='Morocco · Intl'; }
      else if (roll < 0.17) { competitionType='continental'; oppList=contOpp; comp='UCL'; }
      else                  { competitionType='club';        oppList=oppPool; comp=player.club?.leagueName||'League'; }
      result.push({
        date: d.toISOString().slice(0,10), rating: Math.round(r*10)/10,
        matchLabel: oppList[mc % oppList.length], competition: comp, competitionType,
        dataQuality: player.dataQ, minutes: 60+Math.floor(Math.random()*35),
        goals: Math.random()<(player.pos==='ST'?0.4:0.15)?1:0,
        assists: Math.random()<0.18?1:0, yellow: Math.random()<0.12?1:0, red: Math.random()<0.02?1:0,
        result: ['W','W','D','L'][Math.floor(Math.random()*4)],
      });
    }
  }
  return result;
}

export function genMarketHistory(player) {
  const now = new Date('2026-05-28'); const points = []; const yrs = 6;
  let v = player.mvEur * 0.25;
  for (let i = 0; i < yrs*2; i++) {
    const d = new Date(now); d.setMonth(d.getMonth() - (yrs*2-i)*6);
    v = v * (1 + (Math.random()*0.35+0.05));
    if (i === yrs*2-1) v = player.mvEur;
    points.push({ date: d.toISOString().slice(0,10), valueEur: Math.round(v) });
  }
  return points;
}
