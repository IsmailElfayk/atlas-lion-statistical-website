/**
 * verify-ratings.js — confirm every Moroccan player has up to 35 Rating docs.
 * Run after seed-now.js completes.
 *   cd backend && node seed/verify-ratings.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('../models/Club');
require('../models/League');
const connectDB = require('../config/db');
const Player    = require('../models/Player');
const Rating    = require('../models/Rating');

connectDB().then(async () => {
  const players = await Player.find({ isMoroccanNational: true })
    .populate('currentClub', 'name')
    .lean();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(` Moroccan players in DB: ${players.length}`);
  console.log(`${'═'.repeat(60)}`);

  let totalRatings = 0;
  let playersWithRatings = 0;
  let playersMissingPersonId = 0;

  const rows = [];
  for (const p of players) {
    const personId = p.externalIds?.apiFootball;
    if (!personId) { playersMissingPersonId++; continue; }

    const rCount = await Rating.countDocuments({ player: p._id });
    totalRatings += rCount;
    if (rCount > 0) playersWithRatings++;

    rows.push({
      name:     p.fullName,
      pos:      p.primaryPosition || '?',
      club:     p.currentClub?.name || '?',
      personId,
      ratings:  rCount,
    });
  }

  // Sort: most ratings first
  rows.sort((a, b) => b.ratings - a.ratings);

  // Print table
  console.log(
    'Name'.padEnd(30),
    'Pos'.padEnd(5),
    'FD-ID'.padEnd(8),
    'Ratings'.padEnd(8),
    'Club'
  );
  console.log('─'.repeat(80));
  for (const r of rows) {
    console.log(
      r.name.slice(0, 29).padEnd(30),
      r.pos.padEnd(5),
      String(r.personId).padEnd(8),
      String(r.ratings).padEnd(8),
      r.club.slice(0, 25)
    );
  }

  console.log(`\n${'─'.repeat(80)}`);
  console.log(` Players with nationality Morocco : ${players.length}`);
  console.log(` Players missing FD person ID     : ${playersMissingPersonId}`);
  console.log(` Players with ≥1 rating           : ${playersWithRatings}`);
  console.log(` Total Rating docs                : ${totalRatings}`);
  console.log(` Avg ratings per player (with any): ${playersWithRatings ? (totalRatings / playersWithRatings).toFixed(1) : 'N/A'}`);
  console.log(`${'═'.repeat(60)}\n`);

  // Show sample rating doc for first player with ratings
  const sample = await Rating.findOne({})
    .populate('player', 'fullName')
    .populate('match')
    .lean();
  if (sample) {
    console.log('Sample Rating document:');
    console.log(JSON.stringify({
      player:             sample.player?.fullName,
      matchDate:          sample.matchDate,
      competition:        sample.competition,
      homeTeam:           sample.homeTeam,
      awayTeam:           sample.awayTeam,
      score:              `${sample.homeScore ?? '?'}-${sample.awayScore ?? '?'}`,
      minutes:            sample.minutes,
      performanceScore:   sample.performanceScore,
      computedFromEvents: sample.computedFromEvents,
      dataQuality:        sample.dataQuality,
    }, null, 2));
  }

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
