// Add to window for easy badge viewing
window.viewBadges = function() {
    if (!window.badgeSystem) {
        console.log('Badge system not initialized yet');
        return;
    }
    
    const badges = window.badgeSystem.getAllBadges();
    const unlocked = badges.filter(b => b.unlocked);
    const locked = badges.filter(b => !b.unlocked);
    
    console.log('%c🏆 YOUR BADGES', 'font-size: 20px; font-weight: bold; color: #D97741');
    console.log(`\nUnlocked: ${unlocked.length}/${badges.length}\n`);
    
    if (unlocked.length > 0) {
        console.log('%c✨ UNLOCKED BADGES:', 'font-size: 16px; font-weight: bold; color: #4CAF50');
        unlocked.forEach(badge => {
            console.log(`${badge.icon} ${badge.name} - ${badge.description} [${badge.rarity.toUpperCase()}]`);
        });
    }
    
    if (locked.length > 0) {
        console.log('\n%c🔒 LOCKED BADGES:', 'font-size: 16px; font-weight: bold; color: #999');
        locked.forEach(badge => {
            const progress = Math.round(badge.progress);
            console.log(`${badge.icon} ${badge.name} - ${badge.description} [${progress}% complete]`);
        });
    }
    
    console.log('\n💡 Tip: Badges unlock automatically as you use pyTron!');
};

console.log('%c💎 pyTron Badge System Loaded!', 'font-size: 14px; color: #D97741; font-weight: bold');
console.log('Type viewBadges() in console to see your badges!');
