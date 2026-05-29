require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const League = require('../models/League');
const Club = require('../models/Club');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Rating = require('../models/Rating');

const LEAGUES_DATA = [
  { name:'Premier League', country:'England', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'La Liga', country:'Spain', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'LaLiga', country:'Spain', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'Bundesliga', country:'Germany', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'Serie A', country:'Italy', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'Ligue 1', country:'France', tier:1, confederation:'UEFA', bucket:'big5', hasEventData:true, hasSofascoreRatings:true },
  { name:'Eredivisie', country:'Netherlands', tier:1, confederation:'UEFA', bucket:'other_europe', hasEventData:false, hasSofascoreRatings:true },
  { name:'Jupiler Pro League', country:'Belgium', tier:1, confederation:'UEFA', bucket:'other_europe', hasEventData:false, hasSofascoreRatings:true },
  { name:'Süper Lig', country:'Turkey', tier:1, confederation:'UEFA', bucket:'other_europe', hasEventData:false, hasSofascoreRatings:true },
  { name:'Super League Greece', country:'Greece', tier:1, confederation:'UEFA', bucket:'other_europe', hasEventData:false, hasSofascoreRatings:true },
  { name:'Botola Pro', country:'Morocco', tier:1, confederation:'CAF', bucket:'botola', hasEventData:false, hasSofascoreRatings:false },
  { name:'Saudi Pro League', country:'Saudi Arabia', tier:1, confederation:'AFC', bucket:'mena', hasEventData:false, hasSofascoreRatings:true },
  { name:'Qatar Stars League', country:'Qatar', tier:1, confederation:'AFC', bucket:'mena', hasEventData:false, hasSofascoreRatings:true },
  { name:'UAE Pro League', country:'UAE', tier:1, confederation:'AFC', bucket:'mena', hasEventData:false, hasSofascoreRatings:true },
  { name:'International', country:'International', tier:0, confederation:'UEFA', bucket:'world', hasEventData:false, hasSofascoreRatings:true },
];

const CLUBS_DATA = [
  { name:'Al-Hilal', shortName:'HIL', country:'Saudi Arabia', color:'#0050B5', leagueName:'Saudi Pro League' },
  { name:'Al-Duhail', shortName:'DUH', country:'Qatar', color:'#7B0828', leagueName:'Qatar Stars League' },
  { name:'Al-Shabab', shortName:'SHB', country:'Saudi Arabia', color:'#FFFFFF', leagueName:'Saudi Pro League' },
  { name:'Al-Ain', shortName:'AIN', country:'UAE', color:'#7B1538', leagueName:'UAE Pro League' },
  { name:'Paris Saint-Germain', shortName:'PSG', country:'France', color:'#004170', leagueName:'Ligue 1' },
  { name:'Manchester United', shortName:'MUN', country:'England', color:'#DA020E', leagueName:'Premier League' },
  { name:'Fenerbahçe', shortName:'FEN', country:'Turkey', color:'#FFED00', leagueName:'Süper Lig' },
  { name:'Real Sociedad', shortName:'RSO', country:'Spain', color:'#003D7C', leagueName:'LaLiga' },
  { name:'Marseille', shortName:'OM', country:'France', color:'#009DDC', leagueName:'Ligue 1' },
  { name:'Girona', shortName:'GIR', country:'Spain', color:'#CE1126', leagueName:'LaLiga' },
  { name:'Leicester City', shortName:'LEI', country:'England', color:'#003090', leagueName:'Premier League' },
  { name:'Real Madrid', shortName:'RMA', country:'Spain', color:'#FEBE10', leagueName:'LaLiga' },
  { name:'AS Monaco', shortName:'ASM', country:'France', color:'#CD1119', leagueName:'Ligue 1' },
  { name:'Real Betis', shortName:'BET', country:'Spain', color:'#0BB363', leagueName:'LaLiga' },
  { name:'Villarreal', shortName:'VIL', country:'Spain', color:'#FFE667', leagueName:'LaLiga' },
  { name:'Lazio', shortName:'LAZ', country:'Italy', color:'#87CEEB', leagueName:'Serie A' },
  { name:'Eintracht Frankfurt', shortName:'SGE', country:'Germany', color:'#E1000F', leagueName:'Bundesliga' },
  { name:'Bayern München', shortName:'BAY', country:'Germany', color:'#DC052D', leagueName:'Bundesliga' },
  { name:'PSV Eindhoven', shortName:'PSV', country:'Netherlands', color:'#ED1C24', leagueName:'Eredivisie' },
  { name:'AS Roma', shortName:'ROM', country:'Italy', color:'#8E1F2F', leagueName:'Serie A' },
  { name:'Olympiacos', shortName:'OLY', country:'Greece', color:'#E60026', leagueName:'Super League Greece' },
  { name:'Espanyol', shortName:'ESP', country:'Spain', color:'#005EB8', leagueName:'LaLiga' },
  { name:'Toulouse', shortName:'TFC', country:'France', color:'#581F87', leagueName:'Ligue 1' },
  { name:'RC Lens', shortName:'RCL', country:'France', color:'#FFE800', leagueName:'Ligue 1' },
  { name:'KAA Gent', shortName:'GNT', country:'Belgium', color:'#005EB8', leagueName:'Jupiler Pro League' },
  { name:'Wydad AC', shortName:'WAC', country:'Morocco', color:'#C1121F', leagueName:'Botola Pro' },
  { name:'Raja CA', shortName:'RCA', country:'Morocco', color:'#007A3D', leagueName:'Botola Pro' },
  { name:'AS FAR', shortName:'FAR', country:'Morocco', color:'#A52A2A', leagueName:'Botola Pro' },
  { name:'RS Berkane', shortName:'RSB', country:'Morocco', color:'#FF6600', leagueName:'Botola Pro' },
  { name:'Morocco NT', shortName:'MAR', country:'Morocco', color:'#C1121F', leagueName:'International' },
];

const PLAYERS_DATA = [
  { slug:'bounou',      fullName:'Yassine Bounou',         fullNameAr:'ياسين بونو',         primaryPosition:'GK',  age:34, height:192, preferredFoot:'Right', clubName:'Al-Hilal',           rating:7.6, mvEur:8000000,   minutes:1620, dataQ:'rating',    elig:'capped',     archetype:'Sweeper-Keeper',      nat:['MAR','CAN'], eligPos:['GK'] },
  { slug:'munir',       fullName:'Munir Mohamedi',         fullNameAr:'منير محمدي',         primaryPosition:'GK',  age:35, height:189, preferredFoot:'Right', clubName:'AS FAR',             rating:6.9, mvEur:600000,    minutes:1530, dataQ:'heuristic', elig:'capped',     archetype:'Shot-Stopper',        nat:['MAR'],        eligPos:['GK'] },
  { slug:'hakimi',      fullName:'Achraf Hakimi',          fullNameAr:'أشرف حكيمي',         primaryPosition:'RB',  age:27, height:181, preferredFoot:'Right', clubName:'Paris Saint-Germain', rating:7.8, mvEur:75000000,  minutes:1880, dataQ:'event',     elig:'capped',     archetype:'Inverted Fullback',   nat:['MAR','ESP'],  eligPos:['RB','WB','RM'] },
  { slug:'mazraoui',    fullName:'Noussair Mazraoui',      fullNameAr:'نصير مزراوي',        primaryPosition:'RB',  age:28, height:183, preferredFoot:'Right', clubName:'Manchester United',   rating:7.2, mvEur:25000000,  minutes:1690, dataQ:'event',     elig:'capped',     archetype:'Two-Way Fullback',    nat:['MAR','NED'],  eligPos:['RB','WB','RM'] },
  { slug:'saiss',       fullName:'Romain Saiss',           fullNameAr:'رومان السايس',       primaryPosition:'CB',  age:35, height:191, preferredFoot:'Left',  clubName:'Al-Shabab',          rating:7.0, mvEur:2500000,   minutes:1740, dataQ:'rating',    elig:'capped',     archetype:'Aerial Stopper',      nat:['MAR','FRA'],  eligPos:['CB'] },
  { slug:'aguerd',      fullName:'Nayef Aguerd',           fullNameAr:'نايف أكرد',          primaryPosition:'CB',  age:30, height:188, preferredFoot:'Left',  clubName:'Real Sociedad',       rating:7.5, mvEur:20000000,  minutes:1810, dataQ:'event',     elig:'capped',     archetype:'Ball-Playing CB',     nat:['MAR'],        eligPos:['CB'] },
  { slug:'dari',        fullName:'Achraf Dari',            fullNameAr:'أشرف داري',          primaryPosition:'CB',  age:26, height:188, preferredFoot:'Right', clubName:'Eintracht Frankfurt', rating:7.1, mvEur:8000000,   minutes:1420, dataQ:'event',     elig:'capped',     archetype:'Aerial Stopper',      nat:['MAR'],        eligPos:['CB'] },
  { slug:'aznou',       fullName:'Adam Aznou',             fullNameAr:'آدم أزنو',           primaryPosition:'LB',  age:19, height:181, preferredFoot:'Left',  clubName:'Bayern München',      rating:7.0, mvEur:6000000,   minutes:780,  dataQ:'event',     elig:'eligible',   archetype:'Overlapping Fullback',nat:['MAR','ESP'],  eligPos:['LB','WB','LM'] },
  { slug:'salah_eddine',fullName:'Anass Salah-Eddine',     fullNameAr:'أنس صلاح الدين',     primaryPosition:'LB',  age:23, height:179, preferredFoot:'Left',  clubName:'AS Roma',             rating:7.0, mvEur:9000000,   minutes:1310, dataQ:'event',     elig:'switchable', archetype:'Two-Way Fullback',    nat:['MAR','NED'],  eligPos:['LB','WB','LM'] },
  { slug:'attiyat',     fullName:'Yahia Attiyat Allah',    fullNameAr:'يحيى عطية الله',     primaryPosition:'LB',  age:30, height:172, preferredFoot:'Left',  clubName:'Wydad AC',            rating:6.8, mvEur:1200000,   minutes:1520, dataQ:'heuristic', elig:'capped',     archetype:'Overlapping Fullback',nat:['MAR'],        eligPos:['LB','WB','LM'] },
  { slug:'amrabat',     fullName:'Sofyan Amrabat',         fullNameAr:'سفيان أمرابط',       primaryPosition:'CDM', age:29, height:185, preferredFoot:'Right', clubName:'Fenerbahçe',          rating:7.2, mvEur:15000000,  minutes:1620, dataQ:'rating',    elig:'capped',     archetype:'Destroyer',           nat:['MAR','NED'],  eligPos:['CDM','CM','DM'] },
  { slug:'ounahi',      fullName:'Azzedine Ounahi',        fullNameAr:'عز الدين أوناحي',    primaryPosition:'CM',  age:25, height:175, preferredFoot:'Right', clubName:'Girona',              rating:7.4, mvEur:18000000,  minutes:1530, dataQ:'event',     elig:'capped',     archetype:'Deep-Lying Playmaker',nat:['MAR'],        eligPos:['CM','CDM','DM','AM'] },
  { slug:'saibari',     fullName:'Ismael Saibari',         fullNameAr:'إسماعيل صيباري',     primaryPosition:'CAM', age:24, height:178, preferredFoot:'Right', clubName:'PSV Eindhoven',       rating:7.6, mvEur:22000000,  minutes:1740, dataQ:'event',     elig:'capped',     archetype:'Progressive Carrier', nat:['MAR','ESP'],  eligPos:['CAM','CM','AM'] },
  { slug:'khannouss',   fullName:'Bilal El Khannouss',     fullNameAr:'بلال الخنوس',        primaryPosition:'CAM', age:21, height:175, preferredFoot:'Left',  clubName:'Leicester City',      rating:7.2, mvEur:18000000,  minutes:1480, dataQ:'event',     elig:'capped',     archetype:'Creative 10',         nat:['MAR','BEL'],  eligPos:['CAM','CM','AM'] },
  { slug:'belahyane',   fullName:'Reda Belahyane',         fullNameAr:'رضا بلحيان',         primaryPosition:'CM',  age:21, height:184, preferredFoot:'Right', clubName:'Lazio',               rating:7.0, mvEur:8000000,   minutes:1080, dataQ:'event',     elig:'switchable', archetype:'Box-to-Box',          nat:['MAR','FRA'],  eligPos:['CM','CDM','AM'] },
  { slug:'el_aynaoui',  fullName:'Neil El Aynaoui',        fullNameAr:'نيل العيناوي',       primaryPosition:'CM',  age:24, height:191, preferredFoot:'Right', clubName:'RC Lens',             rating:7.1, mvEur:12000000,  minutes:1640, dataQ:'event',     elig:'switchable', archetype:'Box-to-Box',          nat:['MAR','FRA'],  eligPos:['CM','CDM','AM'] },
  { slug:'nadir',       fullName:'Bilal Nadir',            fullNameAr:'بلال نادر',          primaryPosition:'CAM', age:21, height:174, preferredFoot:'Right', clubName:'Marseille',           rating:7.0, mvEur:7000000,   minutes:890,  dataQ:'event',     elig:'eligible',   archetype:'Creative 10',         nat:['MAR','FRA'],  eligPos:['CAM','AM','CM'] },
  { slug:'ziyech',      fullName:'Hakim Ziyech',           fullNameAr:'حكيم زياش',          primaryPosition:'RW',  age:33, height:181, preferredFoot:'Left',  clubName:'Al-Duhail',           rating:7.3, mvEur:4000000,   minutes:1520, dataQ:'rating',    elig:'capped',     archetype:'Set-Piece Wizard',    nat:['MAR','NED'],  eligPos:['RW','RM','AM'] },
  { slug:'diaz',        fullName:'Brahim Díaz',            fullNameAr:'إبراهيم دياز',       primaryPosition:'CAM', age:26, height:171, preferredFoot:'Right', clubName:'Real Madrid',         rating:7.7, mvEur:55000000,  minutes:1610, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','ESP'],  eligPos:['CAM','AM','LW','RW'] },
  { slug:'ben_seghir',  fullName:'Eliesse Ben Seghir',     fullNameAr:'إلياس بن صغير',      primaryPosition:'RW',  age:21, height:172, preferredFoot:'Left',  clubName:'AS Monaco',           rating:7.3, mvEur:30000000,  minutes:1420, dataQ:'event',     elig:'switchable', archetype:'Inside Forward',      nat:['MAR','FRA'],  eligPos:['RW','RM','AM'] },
  { slug:'ezzalzouli',  fullName:'Abde Ezzalzouli',        fullNameAr:'عبدالصمد الزلزولي',  primaryPosition:'LW',  age:24, height:172, preferredFoot:'Right', clubName:'Real Betis',          rating:7.2, mvEur:14000000,  minutes:1390, dataQ:'event',     elig:'capped',     archetype:'Dribbling Winger',    nat:['MAR','ESP'],  eligPos:['LW','LM','AM'] },
  { slug:'akhomach',    fullName:'Ilias Akhomach',         fullNameAr:'إلياس أخوماش',       primaryPosition:'RW',  age:22, height:170, preferredFoot:'Left',  clubName:'Villarreal',          rating:7.0, mvEur:9000000,   minutes:1230, dataQ:'event',     elig:'capped',     archetype:'Dribbling Winger',    nat:['MAR','ESP'],  eligPos:['RW','RM','AM'] },
  { slug:'aboukhlal',   fullName:'Zakaria Aboukhlal',      fullNameAr:'زكريا أبو خلال',     primaryPosition:'RW',  age:26, height:182, preferredFoot:'Left',  clubName:'Toulouse',            rating:7.1, mvEur:9000000,   minutes:1400, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','NED'],  eligPos:['RW','RM','AM'] },
  { slug:'tissoudali',  fullName:'Tarik Tissoudali',       fullNameAr:'طارق تيسودالي',      primaryPosition:'LW',  age:32, height:181, preferredFoot:'Right', clubName:'KAA Gent',            rating:7.0, mvEur:3500000,   minutes:1240, dataQ:'event',     elig:'capped',     archetype:'Inside Forward',      nat:['MAR','NED'],  eligPos:['LW','LM','AM'] },
  { slug:'ennesyri',    fullName:'Youssef En-Nesyri',      fullNameAr:'يوسف النصيري',       primaryPosition:'ST',  age:28, height:189, preferredFoot:'Right', clubName:'Fenerbahçe',          rating:7.5, mvEur:25000000,  minutes:1720, dataQ:'rating',    elig:'capped',     archetype:'Target Forward',      nat:['MAR'],        eligPos:['ST','LW','RW'] },
  { slug:'kaabi',       fullName:'Ayoub El Kaabi',         fullNameAr:'أيوب الكعبي',        primaryPosition:'ST',  age:32, height:185, preferredFoot:'Right', clubName:'Olympiacos',          rating:7.6, mvEur:8000000,   minutes:1690, dataQ:'event',     elig:'capped',     archetype:'Poacher',             nat:['MAR'],        eligPos:['ST','LW','RW'] },
  { slug:'cheddira',    fullName:'Walid Cheddira',         fullNameAr:'وليد شديرة',         primaryPosition:'ST',  age:27, height:189, preferredFoot:'Right', clubName:'Espanyol',            rating:6.9, mvEur:5000000,   minutes:1180, dataQ:'event',     elig:'capped',     archetype:'Target Forward',      nat:['MAR','ITA'],  eligPos:['ST','LW','RW'] },
  { slug:'rahimi',      fullName:'Soufiane Rahimi',        fullNameAr:'سفيان رحيمي',        primaryPosition:'ST',  age:29, height:179, preferredFoot:'Right', clubName:'Al-Ain',              rating:7.4, mvEur:7000000,   minutes:1580, dataQ:'rating',    elig:'capped',     archetype:'Poacher',             nat:['MAR'],        eligPos:['ST','LW','RW'] },
  { slug:'jabrane',     fullName:'Yahya Jabrane',          fullNameAr:'يحيى جبران',         primaryPosition:'CDM', age:33, height:182, preferredFoot:'Right', clubName:'Wydad AC',            rating:6.9, mvEur:900000,    minutes:1480, dataQ:'heuristic', elig:'capped',     archetype:'Destroyer',           nat:['MAR'],        eligPos:['CDM','CM','DM'] },
  { slug:'mmaee',       fullName:'Samy Mmaee',             fullNameAr:'سامي مماي',          primaryPosition:'CB',  age:28, height:189, preferredFoot:'Right', clubName:'RS Berkane',          rating:6.8, mvEur:1500000,   minutes:1320, dataQ:'heuristic', elig:'switchable', archetype:'Aerial Stopper',      nat:['MAR','BEL'],  eligPos:['CB'] },
];

const AVAILABILITY = {
  mazraoui:   { status:'doubtful',  returnDate: new Date('2026-06-12') },
  aguerd:     { status:'injured',   returnDate: new Date('2026-07-03') },
  ezzalzouli: { status:'injured',   returnDate: new Date('2026-06-20') },
  nadir:      { status:'suspended', returnDate: new Date('2026-06-06') },
};

function genRatings(baseRating, days, dataQ) {
  const ratings = [];
  const now = new Date('2026-05-28');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (Math.random() < 0.18) {
      const noise = Math.sin(i * 0.31) * 0.4 + (Math.random() - 0.5) * 0.9;
      const r = Math.max(4.5, Math.min(9.4, baseRating + noise));
      const score = Math.round(r * 10) / 10;
      ratings.push({
        date: d,
        minutes: 60 + Math.floor(Math.random() * 35),
        sofascoreRating: dataQ !== 'event' ? score : null,
        normalisedCustom: dataQ === 'event' ? score : null,
        dataQuality: dataQ,
      });
    }
  }
  return ratings;
}

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/atlas-lions';
  await mongoose.connect(MONGODB_URI);
  console.log('[Seed] Connected to MongoDB');

  // Clear
  await Promise.all([League, Club, Player, Match, Rating].map(M => M.deleteMany({})));
  console.log('[Seed] Cleared existing data');

  // Leagues
  const leagues = await League.insertMany(LEAGUES_DATA);
  const leagueMap = {};
  leagues.forEach(l => { leagueMap[l.name] = l; });
  console.log(`[Seed] ${leagues.length} leagues`);

  // Clubs
  const clubsWithLeague = CLUBS_DATA.map(c => ({
    ...c,
    league: leagueMap[c.leagueName]?._id || leagueMap['International']?._id,
  }));
  const clubs = await Club.insertMany(clubsWithLeague);
  const clubMap = {};
  clubs.forEach(c => { clubMap[c.name] = c; });
  console.log(`[Seed] ${clubs.length} clubs`);

  // Players
  const now = new Date('2026-05-28');
  const playersData = PLAYERS_DATA.map(p => {
    const av = AVAILABILITY[p.slug];
    return {
      slug: p.slug,
      fullName: p.fullName,
      fullNameAr: p.fullNameAr,
      dob: new Date(now.getFullYear() - p.age, 5, 15),
      age: p.age,
      height: p.height,
      preferredFoot: p.preferredFoot,
      primaryPosition: p.primaryPosition,
      eligiblePositions: p.eligPos,
      moroccoEligibility: p.elig,
      nationalities: p.nat,
      currentClub: clubMap[p.clubName]?._id,
      marketValueEur: p.mvEur,
      marketValueUpdatedAt: new Date('2026-05-11'),
      archetypeLabel: p.archetype,
      minutesCurrent: p.minutes,
      status: av?.status || 'available',
      returnDate: av?.returnDate,
    };
  });
  const players = await Player.insertMany(playersData);
  const playerMap = {};
  players.forEach((p, i) => { playerMap[p.slug] = { ...p.toObject(), baseRating: PLAYERS_DATA[i].rating, dataQ: PLAYERS_DATA[i].dataQ }; });
  console.log(`[Seed] ${players.length} players`);

  // Matches
  const matchDates = [];
  for (let i = 90; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (i % 7 === 0 || i % 7 === 3) matchDates.push({ date: d, status: i > 0 ? 'finished' : 'scheduled' });
  }
  // Add upcoming
  for (let i = 1; i <= 14; i++) {
    const d = new Date(now); d.setDate(d.getDate() + i);
    if (i % 4 === 0) matchDates.push({ date: d, status: 'scheduled' });
  }

  const allLeagues = leagues.filter(l => l.bucket !== 'world');
  const allClubs = clubs.filter(c => c.name !== 'Morocco NT');
  const matchesData = matchDates.slice(0, 20).map((md, i) => {
    const league = allLeagues[i % allLeagues.length];
    const c1 = allClubs[i % allClubs.length];
    const c2 = allClubs[(i + 3) % allClubs.length];
    const homeScore = md.status === 'finished' ? Math.floor(Math.random() * 4) : undefined;
    const awayScore = md.status === 'finished' ? Math.floor(Math.random() * 3) : undefined;
    return {
      league: league._id,
      season: '2025-26',
      kickoffUtc: md.date,
      homeClub: c1._id,
      awayClub: c2._id,
      homeScore,
      awayScore,
      status: md.status,
      competition: league.name + ' · Round ' + (i + 1),
      moroccansPlaying: players.slice(i % players.length, (i % players.length) + 3).map(p => p._id),
    };
  });

  // Add specific fixtures from the design
  const designFixtures = [
    { date: new Date('2026-05-30T21:00:00Z'), competition: 'CAF Champions League Final', status: 'scheduled', homeClubName: 'Wydad AC', awayClubName: 'Al-Ain' },
    { date: new Date('2026-06-02T20:00:00Z'), competition: 'FIFA Friendly', status: 'scheduled', homeClubName: 'Morocco NT', awayClubName: 'Morocco NT' },
    { date: new Date('2026-06-06T20:30:00Z'), competition: 'AFCON Qualifier', status: 'scheduled', homeClubName: 'Morocco NT', awayClubName: 'Morocco NT' },
    { date: new Date('2026-06-10T19:00:00Z'), competition: 'Botola Pro · MD 30', status: 'scheduled', homeClubName: 'Raja CA', awayClubName: 'AS FAR' },
  ];
  designFixtures.forEach(f => {
    const intl = leagueMap['International'];
    matchesData.push({
      league: intl?._id,
      season: '2025-26',
      kickoffUtc: f.date,
      homeClub: clubMap[f.homeClubName]?._id || allClubs[0]._id,
      awayClub: clubMap[f.awayClubName]?._id || allClubs[1]._id,
      status: f.status,
      competition: f.competition,
      moroccansPlaying: players.slice(0, 5).map(p => p._id),
    });
  });

  const matches = await Match.insertMany(matchesData);
  console.log(`[Seed] ${matches.length} matches`);

  // Ratings — one per player per finished match they "played"
  const finishedMatches = matches.filter(m => m.status === 'finished');
  const ratingDocs = [];
  for (const p of players) {
    const pd = playerMap[p.slug];
    const ratingHistory = genRatings(pd.baseRating, 90, pd.dataQ);
    ratingHistory.forEach((r, idx) => {
      const match = finishedMatches[idx % finishedMatches.length];
      if (!match) return;
      ratingDocs.push({
        player: p._id,
        match: match._id,
        matchDate: r.date,
        minutes: r.minutes,
        sofascoreRating: r.sofascoreRating,
        normalisedCustom: r.normalisedCustom,
        dataQuality: r.dataQuality,
      });
    });
  }
  // Deduplicate player+match combos
  const seen = new Set();
  const uniqueRatings = ratingDocs.filter(r => {
    const key = `${r.player}-${r.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await Rating.insertMany(uniqueRatings);
  console.log(`[Seed] ${uniqueRatings.length} ratings`);

  console.log('[Seed] Done!');
  process.exit(0);
}

seed().catch(err => { console.error('[Seed] Error:', err); process.exit(1); });
