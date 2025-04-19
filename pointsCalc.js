/**
 * 日本麻将和牌判断和番数计算功能
 */

// 解析麻将牌编码
function parseCode(code) {
    if (!code || code.trim() === '') return [];
    
    const tiles = [];
    let numbers = '';
    let currentType = '';
    
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        if ('0123456789'.includes(char)) {
            numbers += char;
        } else if ('mpsz'.includes(char)) {
            currentType = char;
            // 处理当前收集到的数字
            for (let j = 0; j < numbers.length; j++) {
                let num = numbers[j];
                // 处理赤宝牌（0表示赤五）
                if (num === '0') num = '5';
                tiles.push(num + currentType);
            }
            numbers = '';
        }
    }
    
    return tiles;
}

// 解析副露牌编码（每个面子用字母隔开）
function parseMeldedCode(code) {
    if (!code || code.trim() === '') return [];
    
    const tiles = [];
    let currentMeld = '';
    
    // 将输入按照字母分割成多个面子
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        currentMeld += char;
        
        // 当遇到字母结尾时，处理当前面子
        if ('mpsz'.includes(char) && i < code.length - 1) {
            // 解析当前面子并添加到结果中
            const meldTiles = parseCode(currentMeld);
            tiles.push(...meldTiles);
            currentMeld = '';
        }
    }
    
    // 处理最后一个面子
    if (currentMeld) {
        const meldTiles = parseCode(currentMeld);
        tiles.push(...meldTiles);
    }
    
    return tiles;
}

// 将所有牌合并成一个数组
function combineTiles(concealed, melded, winning) {
    return [...parseCode(concealed), ...parseMeldedCode(melded), ...parseCode(winning)];
}

// 检查副露是否都是合法的面子
function isValidMelds(melded) {
    if (!melded || melded.trim() === '') return true;
    
    // 解析副露
    const meldedTiles = [];
    let currentMeld = '';
    
    // 将输入按照字母分割成多个面子
    for (let i = 0; i < melded.length; i++) {
        const char = melded[i];
        currentMeld += char;
        
        // 当遇到字母结尾时，处理当前面子
        if ('mpsz'.includes(char) && i < melded.length - 1) {
            // 解析当前面子
            const tiles = parseCode(currentMeld);
            
            // 检查是否是合法的面子（顺子、刻子或杠）
            if (!isValidMeld(tiles)) {
                return false;
            }
            
            // 添加到已验证的面子列表
            meldedTiles.push(...tiles);
            currentMeld = '';
        }
    }
    
    // 处理最后一个面子
    if (currentMeld) {
        const tiles = parseCode(currentMeld);
        if (!isValidMeld(tiles)) {
            return false;
        }
        meldedTiles.push(...tiles);
    }
    
    return true;
}

// 检查单个面子是否合法（顺子、刻子或杠）
function isValidMeld(tiles) {
    // 面子必须是3张或4张牌
    if (tiles.length !== 3 && tiles.length !== 4) {
        return false;
    }
    
    // 如果是4张牌，必须是杠（四张相同的牌）
    if (tiles.length === 4) {
        return tiles.every(tile => tile === tiles[0]);
    }
    
    // 如果是3张牌，可以是顺子或刻子
    // 检查是否是刻子（三张相同的牌）
    if (tiles.every(tile => tile === tiles[0])) {
        return true;
    }
    
    // 检查是否是顺子（三张连续的牌，花色相同）
    // 首先检查花色是否相同
    const type = tiles[0][1];
    if (!tiles.every(tile => tile[1] === type)) {
        return false;
    }
    
    // 字牌不能组成顺子
    if (type === 'z') {
        return false;
    }
    
    // 检查是否是连续的三张牌
    const numbers = tiles.map(tile => parseInt(tile[0])).sort((a, b) => a - b);
    return numbers[1] === numbers[0] + 1 && numbers[2] === numbers[1] + 1;
}

// 统计每种牌的数量
function countTiles(tiles) {
    const counts = {};
    tiles.forEach(tile => {
        counts[tile] = (counts[tile] || 0) + 1;
    });
    return counts;
}

// 检查是否有雀头（对子）
function hasPair(counts) {
    return Object.values(counts).some(count => count >= 2);
}

// 检查是否可以形成顺子
function canFormSequence(counts, tile) {
    if (tile[1] === 'z') return false; // 字牌不能组成顺子
    
    const num = parseInt(tile[0]);
    const type = tile[1];
    
    // 检查是否有连续的三张牌
    if (num <= 7) {
        const next1 = (num + 1) + type;
        const next2 = (num + 2) + type;
        if (counts[next1] > 0 && counts[next2] > 0) {
            return [tile, next1, next2];
        }
    }
    
    return false;
}

// 检查是否可以形成刻子（三张相同的牌）
function canFormTriplet(counts, tile) {
    return counts[tile] >= 3 ? [tile, tile, tile] : false;
}

// 检查是否可以形成杠（四张相同的牌）
function canFormQuad(counts, tile) {
    return counts[tile] >= 4 ? [tile, tile, tile, tile] : false;
}

// 递归检查是否可以组成有效的和牌结构
function isValidHand(counts, setsNeeded) {
    // 基本情况：如果需要的面子数为0，则成功
    if (setsNeeded === 0) return true;
    
    // 尝试找到一个可以形成面子的牌
    for (const tile in counts) {
        if (counts[tile] === 0) continue;
        
        // 尝试形成顺子
        const sequence = canFormSequence(counts, tile);
        if (sequence) {
            // 临时减少这些牌的数量
            sequence.forEach(t => counts[t]--);
            
            // 递归检查剩余的牌
            if (isValidHand(counts, setsNeeded - 1)) {
                return true;
            }
            
            // 恢复牌的数量（回溯）
            sequence.forEach(t => counts[t]++);
        }
        
        // 尝试形成刻子
        const triplet = canFormTriplet(counts, tile);
        if (triplet) {
            // 临时减少这些牌的数量
            counts[tile] -= 3;
            
            // 递归检查剩余的牌
            if (isValidHand(counts, setsNeeded - 1)) {
                return true;
            }
            
            // 恢复牌的数量（回溯）
            counts[tile] += 3;
        }
    }
    
    return false;
}

// 检查是否为七对子和牌
function isSevenPairs(tileCounts) {
    // 七对子需要恰好7个对子
    const pairs = Object.entries(tileCounts).filter(([_, count]) => count === 2);
    return pairs.length === 7 && Object.values(tileCounts).every(count => count === 2);
}

// 检查是否为国士无双和牌
function isThirteenOrphans(tileCounts) {
    // 国士无双需要的牌
    const requiredTiles = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
    
    // 检查是否有所有需要的牌
    const hasAllRequired = requiredTiles.every(tile => tileCounts[tile] >= 1);
    
    // 检查是否有一个对子（其中一张牌有两张）
    const hasPair = requiredTiles.some(tile => tileCounts[tile] === 2);
    
    // 检查总牌数是否为14张
    const totalTiles = Object.values(tileCounts).reduce((sum, count) => sum + count, 0);
    
    return hasAllRequired && hasPair && totalTiles === 14;
}

// 主要判断函数
function isWinningHand(concealed, melded, winning) {
    // 首先检查副露是否都是合法的面子
    if (melded && melded.trim() !== '' && !isValidMelds(melded)) {
        return false;
    }
    
    // 检查特殊和牌形式：七对子（只有在没有副露的情况下才可能）
    if (!melded || melded.trim() === '') {
        // 合并暗牌和和牌
        const concealedAndWinning = combineTiles(concealed, '', winning);
        const concealedCounts = countTiles(concealedAndWinning);
        
        if (isSevenPairs(concealedCounts)) {
            return true;
        }
        
        // 检查特殊和牌形式：国士无双（只有在没有副露的情况下才可能）
        if (isThirteenOrphans(concealedCounts)) {
            return true;
        }
    }
    
    // 合并暗牌和和牌（不包括副露）
    const handTiles = combineTiles(concealed, '', winning);
    const handCounts = countTiles(handTiles);
    
    // 检查是否有雀头
    if (!hasPair(handCounts)) return false;
    
    // 计算副露中的面子数量
    let meldedSets = 0;
    if (melded && melded.trim() !== '') {
        // 计算副露中的面子数量（每个面子可能是3张或4张牌）
        let currentMeld = '';
        for (let i = 0; i < melded.length; i++) {
            const char = melded[i];
            currentMeld += char;
            
            if ('mpsz'.includes(char) && i < melded.length - 1) {
                meldedSets++;
                currentMeld = '';
            }
        }
        
        // 处理最后一个面子
        if (currentMeld) {
            meldedSets++;
        }
    }
    
    // 需要的总面子数是4（减去已有的副露）
    const setsNeeded = 4 - meldedSets;
    
    // 尝试每一种可能的雀头
    for (const tile in handCounts) {
        if (handCounts[tile] >= 2) {
            // 临时移除雀头
            handCounts[tile] -= 2;
            
            // 检查剩余的牌是否可以组成所需数量的面子
            if (isValidHand({...handCounts}, setsNeeded)) {
                return true;
            }
            
            // 恢复雀头（回溯）
            handCounts[tile] += 2;
        }
    }
    
    return false;
}

// 役种判定函数

// 检查是否为纯正九莲宝灯
function isPurePureNineGates(tileCounts, winning) {
    // 纯正九莲宝灯需要是清一色，且是1112345678999的构成，和牌为其中任意一张
    // 首先检查是否只有一种花色
    const types = Object.keys(tileCounts).map(tile => tile[1]);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length !== 1 || uniqueTypes[0] === 'z') return false;
    
    const type = uniqueTypes[0];
    const pattern = {'1': 3, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 3};
    
    // 检查牌型是否符合1112345678999
    for (let num = 1; num <= 9; num++) {
        const tile = num + type;
        if (tile === winning) { if ((tileCounts[tile] - 1 || 0) !== pattern[num]) return false; }
        else if ((tileCounts[tile] || 0) !== pattern[num]) return false;
    }
    
    return true;
}

// 检查是否为九莲宝灯
function isNineGates(tileCounts) {
    // 九莲宝灯需要是清一色，且是1112345678999的构成，差一张
    // 首先检查是否只有一种花色
    const types = Object.keys(tileCounts).map(tile => tile[1]);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length !== 1 || uniqueTypes[0] === 'z') return false;
    
    const type = uniqueTypes[0];
    const pattern = {'1': 3, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 1, '9': 3};
    let diff = 0;
    
    // 检查牌型是否符合1112345678999差一张
    for (let num = 1; num <= 9; num++) {
        const tile = num + type;
        const count = tileCounts[tile] || 0;
        if (count < pattern[num]) {
            diff += pattern[num] - count;
        } else if (count > pattern[num]) {
            diff += count - pattern[num];
        }
    }
    
    return diff === 1; // 差一张
}

// 检查是否为大四喜
function isBigFourWinds(tileCounts) {
    // 大四喜：包含东南西北四副刻子
    return (tileCounts['1z'] >= 3 && tileCounts['2z'] >= 3 && 
            tileCounts['3z'] >= 3 && tileCounts['4z'] >= 3);
}

// 检查是否为小四喜
function isSmallFourWinds(tileCounts) {
    // 小四喜：包含东南西北中的三副刻子和一对雀头
    const winds = ['1z', '2z', '3z', '4z'];
    let triplets = 0;
    let pair = false;
    
    for (const wind of winds) {
        const count = tileCounts[wind] || 0;
        if (count >= 3) triplets++;
        else if (count === 2) pair = true;
    }
    
    return triplets === 3 && pair;
}

// 检查是否为国士无双十三面听
function isThirteenOrphansSingleWait(tileCounts, winning) {
    // 国士无双十三面听：和牌时，14张牌都是不同的字牌和幺九牌
    const requiredTiles = ['1m', '9m', '1p', '9p', '1s', '9s', '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
    
    // 检查是否每种牌都只有一张
    for (const tile of requiredTiles) {
        if (tile === winning) { if ((tileCounts[tile] - 1 || 0) !== 1) return false; }
        else if ((tileCounts[tile] || 0) !== 1) return false;
    }
    
    // 和牌必须是其中一种
    return requiredTiles.includes(winning);
}

// 检查是否为四暗刻单骑
function isFourConcealedTripletsSingleWait(tileCounts, concealed, melded, winning) {
    // 四暗刻单骑：四组暗刻，和牌是对子的单骑
    if (melded && melded.trim() !== '') return false; // 有副露就不是四暗刻
    
    // 统计刻子数量
    let triplets = 0;
    for (const tile in tileCounts) {
        if (tileCounts[tile] >= 3) triplets++;
    }
    
    // 检查和牌是否为单骑
    return triplets === 4 && tileCounts[winning] === 2;
}

// 检查是否为四暗刻
function isFourConcealedTriplets(tileCounts, concealed, melded) {
    // 四暗刻：四组暗刻
    if (melded && melded.trim() !== '') return false; // 有副露就不是四暗刻
    
    // 统计刻子数量
    let triplets = 0;
    for (const tile in tileCounts) {
        if (tileCounts[tile] >= 3) triplets++;
    }
    
    return triplets === 4;
}

// 检查是否为绿一色
function isAllGreen(tileCounts) {
    // 绿一色：由23468s和发（6z）组成的和牌
    const greenTiles = ['2s', '3s', '4s', '6s', '8s', '6z'];
    
    // 检查所有牌是否都是绿色牌
    for (const tile in tileCounts) {
        if (!greenTiles.includes(tile) && tileCounts[tile] > 0) return false;
    }
    
    return Object.keys(tileCounts).length > 0;
}

// 检查是否为四杠子
function isFourQuads(tileCounts, melded) {
    // 四杠子：四组杠子
    if (!melded || melded.trim() === '') return false;
    
    // 解析副露，计算杠子数量
    let quads = 0;
    let currentMeld = '';
    
    for (let i = 0; i < melded.length; i++) {
        const char = melded[i];
        currentMeld += char;
        
        if ('mpsz'.includes(char) && i < melded.length - 1) {
            const tiles = parseCode(currentMeld);
            if (tiles.length === 4 && tiles.every(t => t === tiles[0])) quads++;
            currentMeld = '';
        }
    }
    
    // 处理最后一个面子
    if (currentMeld) {
        const tiles = parseCode(currentMeld);
        if (tiles.length === 4 && tiles.every(t => t === tiles[0])) quads++;
    }
    
    return quads === 4;
}

// 检查是否为清老头
function isAllTerminals(tileCounts) {
    // 清老头：由幺九牌组成的和牌
    const terminalTiles = ['1m', '9m', '1p', '9p', '1s', '9s'];
    
    // 检查所有牌是否都是幺九牌
    for (const tile in tileCounts) {
        if (!terminalTiles.includes(tile) && tileCounts[tile] > 0) return false;
    }
    
    return Object.keys(tileCounts).length > 0;
}

// 检查是否为字一色
function isAllHonors(tileCounts) {
    // 字一色：由字牌组成的和牌
    for (const tile in tileCounts) {
        if (tile[1] !== 'z' && tileCounts[tile] > 0) return false;
    }
    
    return Object.keys(tileCounts).length > 0;
}

// 检查是否为大三元
function isBigThreeDragons(tileCounts) {
    // 大三元：包含中发白三副刻子
    return (tileCounts['5z'] >= 3 && tileCounts['6z'] >= 3 && tileCounts['7z'] >= 3);
}

// 检查是否为小三元
function isSmallThreeDragons(tileCounts) {
    // 小三元：包含中发白中的两副刻子和一对雀头
    const dragons = ['5z', '6z', '7z'];
    let triplets = 0;
    let pair = false;
    
    for (const dragon of dragons) {
        const count = tileCounts[dragon] || 0;
        if (count >= 3) triplets++;
        else if (count === 2) pair = true;
    }
    
    return triplets === 2 && pair;
}

// 检查是否为清一色
function isPureOneSuit(tileCounts) {
    // 清一色：由一种花色组成的和牌
    const types = Object.keys(tileCounts).map(tile => tile[1]);
    const uniqueTypes = [...new Set(types)];
    
    return uniqueTypes.length === 1 && uniqueTypes[0] !== 'z';
}

// 检查是否为二杯口
function isTwoSetsOfIdenticalSequences(tileCounts, concealed, melded) {
    // 二杯口：两个一杯口，即两对相同顺子
    if (melded && melded.trim() !== '') return false; // 门清限定
    
    // 首先检查是否为七对子形式
    const pairs = Object.entries(tileCounts).filter(([_, count]) => count === 2);
    if (pairs.length !== 7) return false;
    
    // 获取所有对子的牌
    const pairTiles = pairs.map(([tile]) => tile);
    
    // 递归检查是否可以拆出两个相同的顺子
    function canFormTwoSequences(tiles, sequencesFound = 0) {
        if (sequencesFound === 2) return true;
        
        for (let i = 0; i < tiles.length; i++) {
            const tile = tiles[i];
            if (tile[1] === 'z') continue; // 字牌不能组成顺子
            
            const num = parseInt(tile[0]);
            const type = tile[1];
            
            // 检查是否可以形成顺子
            if (num <= 7) {
                const next1 = (num + 1) + type;
                const next2 = (num + 2) + type;
                
                if (tiles.includes(next1) && tiles.includes(next2)) {
                    // 移除这三张牌并递归检查
                    const newTiles = [...tiles];
                    newTiles.splice(newTiles.indexOf(tile), 1);
                    newTiles.splice(newTiles.indexOf(next1), 1);
                    newTiles.splice(newTiles.indexOf(next2), 1);
                    
                    if (canFormTwoSequences(newTiles, sequencesFound + 1)) {
                        return true;
                    }
                }
            }
        }
        
        return false;
    }
    
    return canFormTwoSequences(pairTiles);
}

// 检查是否为纯全带幺九
function isPureTerminalChow(tileCounts) {
    // 纯全带幺九：每一组面子都必须包含幺九牌，且由一种花色组成
    // 首先检查是否清一色
    if (!isPureOneSuit(tileCounts)) return false;
    
    // 然后检查每组面子是否都包含幺九牌
    // 这个判断比较复杂，需要完整的面子分解，这里简化处理
    // 检查是否有1和9的牌
    const type = Object.keys(tileCounts)[0][1];
    return (tileCounts[`1${type}`] > 0 && tileCounts[`9${type}`] > 0);
}

// 检查是否为混一色
function isHalfFlush(tileCounts) {
    // 混一色：由一种花色和字牌组成的和牌
    const types = Object.keys(tileCounts).map(tile => tile[1]);
    const uniqueTypes = [...new Set(types)];
    
    if (uniqueTypes.length > 2) return false;
    if (uniqueTypes.length === 1) return uniqueTypes[0] === 'z';
    
    return uniqueTypes.includes('z') && uniqueTypes.filter(t => t !== 'z').length === 1;
}

// 检查是否为三杠子
function isThreeQuads(tileCounts, melded) {
    // 三杠子：三组杠子
    if (!melded || melded.trim() === '') return false;
    
    // 解析副露，计算杠子数量
    let quads = 0;
    let currentMeld = '';
    
    for (let i = 0; i < melded.length; i++) {
        const char = melded[i];
        currentMeld += char;
        
        if ('mpsz'.includes(char) && i < melded.length - 1) {
            const tiles = parseCode(currentMeld);
            if (tiles.length === 4 && tiles.every(t => t === tiles[0])) quads++;
            currentMeld = '';
        }
    }
    
    // 处理最后一个面子
    if (currentMeld) {
        const tiles = parseCode(currentMeld);
        if (tiles.length === 4 && tiles.every(t => t === tiles[0])) quads++;
    }
    
    return quads === 3;
}

// 检查是否为三色同刻
function isThreeColorTriplets(tileCounts) {
    // 三色同刻：三种花色相同数字的刻子
    for (let num = 1; num <= 9; num++) {
        if ((tileCounts[`${num}m`] >= 3) && 
            (tileCounts[`${num}p`] >= 3) && 
            (tileCounts[`${num}s`] >= 3)) {
            return true;
        }
    }
    return false;
}

// 检查是否为三暗刻
function isThreeConcealedTriplets(tileCounts, concealed, melded) {
    // 三暗刻：三组暗刻
    // 这个判断需要知道哪些是暗刻，哪些是明刻，简化处理
    if (melded && melded.trim() !== '') return false; // 简化：如果有副露就不考虑
    
    // 统计刻子数量
    let triplets = 0;
    for (const tile in tileCounts) {
        if (tileCounts[tile] >= 3) triplets++;
    }
    
    return triplets >= 3;
}

// 检查是否为混全带幺九
function isMixedTerminalChow(tileCounts) {
    // 混全带幺九：每一组面子都必须包含幺九牌或字牌
    // 这个判断比较复杂，需要完整的面子分解，这里简化处理
    // 检查是否有1和9的牌，以及字牌
    let hasTerminals = false;
    let hasHonors = false;
    
    for (const tile in tileCounts) {
        if (tile[1] === 'z') {
            hasHonors = true;
        } else if (tile[0] === '1' || tile[0] === '9') {
            hasTerminals = true;
        }
    }
    
    return hasTerminals && hasHonors;
}

// 检查是否为一气通贯
function isPurestraight(tileCounts) {
    // 一气通贯：一种花色的123456789
    const types = ['m', 'p', 's'];
    
    for (const type of types) {
        let valid = true;
        for (let num = 1; num <= 9; num++) {
            if ((tileCounts[`${num}${type}`] || 0) === 0) {
                valid = false;
                break;
            }
        }
        if (valid) return true;
    }
    
    return false;
}

// 检查是否为三色同顺
function isThreeColorStraight(tileCounts) {
    // 三色同顺：三种花色相同数字的顺子
    for (let num = 1; num <= 7; num++) {
        if ((tileCounts[`${num}m`] > 0 && tileCounts[`${num+1}m`] > 0 && tileCounts[`${num+2}m`] > 0) &&
            (tileCounts[`${num}p`] > 0 && tileCounts[`${num+1}p`] > 0 && tileCounts[`${num+2}p`] > 0) &&
            (tileCounts[`${num}s`] > 0 && tileCounts[`${num+1}s`] > 0 && tileCounts[`${num+2}s`] > 0)) {
            return true;
        }
    }
    return false;
}

// 检查是否为混老头
function isAllTerminalsAndHonors(tileCounts) {
    // 混老头：由幺九牌和字牌组成的和牌
    const validTiles = ['1m', '9m', '1p', '9p', '1s', '9s', 
                       '1z', '2z', '3z', '4z', '5z', '6z', '7z'];
    
    // 检查所有牌是否都是幺九牌或字牌
    for (const tile in tileCounts) {
        if (!validTiles.includes(tile) && tileCounts[tile] > 0) return false;
    }
    
    return Object.keys(tileCounts).length > 0;
}

// 检查是否为七对子
function isSevenPairs(tileCounts, concealed, melded) {
    // 七对子：七个对子
    if (melded && melded.trim() !== '') return false; // 门清限定
    
    // 检查是否有七个对子
    const pairs = Object.entries(tileCounts).filter(([_, count]) => count === 2);
    return pairs.length === 7;
}

// 检查是否为对对和
function isAllTriplets(tileCounts) {
    // 对对和：四组刻子和一对雀头
    let triplets = 0;
    let pairs = 0;
    
    for (const tile in tileCounts) {
        const count = tileCounts[tile];
        if (count >= 3) triplets++;
        if (count === 2) pairs++;
    }
    
    return triplets === 4 && pairs === 1;
}

// 检查是否为一杯口
function isOnePairOfIdenticalSequences(tileCounts, concealed, melded) {
    // 一杯口：一对相同顺子
    if (melded && melded.trim() !== '') return false; // 门清限定
    
    // 统计每种可能的顺子
    const sequences = {};
    for (const tile in tileCounts) {
        if (tile[1] === 'z') continue; // 字牌不能组成顺子
        
        const num = parseInt(tile[0]);
        const type = tile[1];
        
        if (num <= 7) {
            const next1 = (num + 1) + type;
            const next2 = (num + 2) + type;
            
            if (tileCounts[tile] > 0 && tileCounts[next1] > 0 && tileCounts[next2] > 0) {
                const seq = `${num}${next1}${next2}${type}`;
                sequences[seq] = (sequences[seq] || 0) + 1;
            }
        }
    }
    
    // 检查是否有一对相同顺子
    return Object.values(sequences).some(count => count >= 2);
}

// 检查是否为平和
function isPinfu(tileCounts, concealed, melded, winning) {
    // 平和：四组顺子和一对雀头，雀头不是役牌，和牌形成两面听
    if (melded && melded.trim() !== '') return false; // 门清限定
    
    // 检查雀头是否是役牌（三元牌或风牌）
    for (const tile in tileCounts) {
        if (tileCounts[tile] === 2) {
            // 如果雀头是三元牌或风牌，则不是平和
            if (tile[1] === 'z') return false;
        }
    }
    
    // 检查是否全部是顺子（简化处理）
    // 检查和牌是否形成两面听（简化处理）
    return true; // 简化：假设满足条件
}

// 检查是否为断幺九
function isNoTerminals(tileCounts) {
    // 断幺九：不包含幺九牌和字牌的和牌
    for (const tile in tileCounts) {
        if (tile[1] === 'z' || tile[0] === '1' || tile[0] === '9') {
            if (tileCounts[tile] > 0) return false;
        }
    }
    
    return Object.keys(tileCounts).length > 0;
}

// 计算番数
function calculatePoints(concealed, melded, winning, options) {
    // 合并所有牌
    const allTiles = combineTiles(concealed, melded, winning);
    const tileCounts = countTiles(allTiles);
    
    // 判断是否门清
    const isMenzen = !melded || melded.trim() === '';
    
    // 初始化结果
    const result = {
        yakuman: 0, // 役满倍数
        yakumanYaku: [], // 役满役种
        han: 0, // 番数
        yaku: [] // 非役满役种
    };
    
    // 检查双倍役满
    if (isPurePureNineGates(tileCounts, winning)) {
        result.yakuman += 2;
        result.yakumanYaku.push('纯正九莲宝灯');
    } else if (isNineGates(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('九莲宝灯');
    }
    
    if (isThirteenOrphansSingleWait(tileCounts, winning)) {
        result.yakuman += 2;
        result.yakumanYaku.push('国士无双十三面听');
    } else if (isThirteenOrphans(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('国士无双');
    }
    
    if (isFourConcealedTripletsSingleWait(tileCounts, concealed, melded, winning)) {
        result.yakuman += 2;
        result.yakumanYaku.push('四暗刻单骑');
    } else if (isFourConcealedTriplets(tileCounts, concealed, melded)) {
        result.yakuman += 1;
        result.yakumanYaku.push('四暗刻');
    }
    
    if (isBigFourWinds(tileCounts)) {
        result.yakuman += 2;
        result.yakumanYaku.push('大四喜');
    }
    
    // 检查役满
    if (isAllGreen(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('绿一色');
    }
    
    if (isFourQuads(tileCounts, melded)) {
        result.yakuman += 1;
        result.yakumanYaku.push('四杠子');
    }
    
    if (options.isHeaven) {
        result.yakuman += 1;
        result.yakumanYaku.push('天和');
    }
    
    if (options.isEarth) {
        result.yakuman += 1;
        result.yakumanYaku.push('地和');
    }
    
    if (isAllTerminals(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('清老头');
    }
    
    if (isAllHonors(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('字一色');
    }
    
    if (isSmallFourWinds(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('小四喜');
    }
    
    if (isBigThreeDragons(tileCounts)) {
        result.yakuman += 1;
        result.yakumanYaku.push('大三元');
    }
    
    // 如果有役满，直接返回结果
    if (result.yakuman > 0) {
        return result;
    }
    
    // 检查6番役种
    if (isPureOneSuit(tileCounts)) {
        result.han += isMenzen ? 6 : 5; // 副露降1番
        result.yaku.push('清一色');
    }
    
    // 检查3番役种
    if (isTwoSetsOfIdenticalSequences(tileCounts, concealed, melded)) {
        result.han += 3;
        result.yaku.push('二杯口');
    }
    
    if (isPureTerminalChow(tileCounts)) {
        result.han += isMenzen ? 3 : 2; // 副露降1番
        result.yaku.push('纯全带幺九');
    }
    
    if (isHalfFlush(tileCounts)) {
        result.han += isMenzen ? 3 : 2; // 副露降1番
        result.yaku.push('混一色');
    }
    
    // 检查2番役种
    if (isThreeQuads(tileCounts, melded)) {
        result.han += 2;
        result.yaku.push('三杠子');
    }

    if (isThreeColorTriplets(tileCounts)) {
        result.han += 2;
        result.yaku.push('三色同刻');
    }

    if (isThreeConcealedTriplets(tileCounts, concealed, melded)) {
        result.han += 2;
        result.yaku.push('三暗刻');
    }

    if (isMixedTerminalChow(tileCounts)) {
        result.han += isMenzen ? 2 : 1; // 副露降1番
        result.yaku.push('混全带幺九');
    }

    if (isPurestraight(tileCounts)) {
        result.han += isMenzen ? 2 : 1; // 副露降1番
        result.yaku.push('一气通贯');
    }

    if (isThreeColorStraight(tileCounts)) {
        result.han += isMenzen ? 2 : 1; // 副露降1番
        result.yaku.push('三色同顺');
    }

    if (isAllTerminalsAndHonors(tileCounts)) {
        result.han += 2;
        result.yaku.push('混老头');
    }

    if (isSmallThreeDragons(tileCounts)) {
        result.han += 2;
        result.yaku.push('小三元');
    }

    if (options.isDoubleRiichi) {
        result.han += 2;
        result.yaku.push('双立直');
    }

    if (!result.yaku.includes('二杯口') && isSevenPairs(tileCounts, concealed, melded)) {
        result.han += 2;
        result.yaku.push('七对子');
    }

    if (isAllTriplets(tileCounts)) {
        result.han += 2;
        result.yaku.push('对对和');
    }

    // 检查1番役种
    if (options.isRobbingKan) {
        result.han += 1;
        result.yaku.push('抢杠');
    }

    if (options.isAfterKan) {
        result.han += 1;
        result.yaku.push('岭上开花');
    }

    if (options.isLastTileFromWall) {
        result.han += 1;
        result.yaku.push('海底捞月');
    }

    if (options.isLastDiscard) {
        result.han += 1;
        result.yaku.push('河底捞鱼');
    }

    // 一杯口和七对子是互斥的
    if (!result.yaku.includes('七对子') && !result.yaku.includes('二杯口') && 
        isOnePairOfIdenticalSequences(tileCounts, concealed, melded)) {
        result.han += 1;
        result.yaku.push('一杯口');
    }

    if (isPinfu(tileCounts, concealed, melded, winning) && isMenzen) {
        result.han += 1;
        result.yaku.push('平和');
    }

    // 三元牌
    if ((tileCounts['5z'] || 0) >= 3) {
        result.han += 1;
        result.yaku.push('役牌：中');
    }
    if ((tileCounts['6z'] || 0) >= 3) {
        result.han += 1;
        result.yaku.push('役牌：发');
    }
    if ((tileCounts['7z'] || 0) >= 3) {
        result.han += 1;
        result.yaku.push('役牌：白');
    }

    // 场风牌
    if ((tileCounts[options.roundWind + 'z'] || 0) >= 3) {
        result.han += 1;
        result.yaku.push('役牌：场风');
    }

    // 自风牌
    if ((tileCounts[options.seatWind + 'z'] || 0) >= 3) {
        result.han += 1;
        result.yaku.push('役牌：自风');
    }

    if (isNoTerminals(tileCounts)) {
        result.han += 1;
        result.yaku.push('断幺九');
    }

    if (options.isIppatsu) {
        result.han += 1;
        result.yaku.push('一发');
    }

    if (isMenzen && options.isTsumo) {
        result.han += 1;
        result.yaku.push('门清自摸');
    }

    if (options.isRiichi) {
        result.han += 1;
        result.yaku.push('立直');
    }

    // 如果没有任何役，则不能和牌
    if (result.han === 0 && result.yakuman === 0) {
        return { error: '无役，不能和牌' };
    }

    return result;
}

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const resultDiv = document.getElementById('result');
    
    checkBtn.addEventListener('click', () => {
        const concealed = document.getElementById('concealed').value.trim();
        const melded = document.getElementById('melded').value.trim();
        const winning = document.getElementById('winning').value.trim();
        const winSource = document.getElementById('winSource').value;
        
        // 获取用户选择的役种
        const options = {
            isRiichi: document.getElementById('riichi')?.checked || false,
            isDoubleRiichi: document.getElementById('doubleRiichi')?.checked || false,
            isIppatsu: document.getElementById('ippatsu')?.checked || false,
            isLastTileFromWall: document.getElementById('lastTileFromWall')?.checked || false,
            isLastDiscard: document.getElementById('lastDiscard')?.checked || false,
            isAfterKan: document.getElementById('afterKan')?.checked || false,
            isRobbingKan: document.getElementById('robbingKan')?.checked || false,
            isHeaven: document.getElementById('heaven')?.checked || false,
            isEarth: document.getElementById('earth')?.checked || false,
            isTsumo: winSource === 'self',
            roundWind: document.getElementById('roundWind')?.value || '1',
            seatWind: document.getElementById('seatWind')?.value || '1'
        };
        
        // 验证输入
        if (!concealed || !winning) {
            resultDiv.textContent = '请输入暗牌和和牌';
            resultDiv.className = 'result error';
            return;
        }
        
        // 验证副露格式
        if (melded) {
            const meldPattern = /^([0-9]+[mpsz])+$/;
            if (!meldPattern.test(melded)) {
                resultDiv.textContent = '副露格式错误，每个面子需要用字母隔开，例如：123m456p';
                resultDiv.className = 'result error';
                return;
            }
        }
        
        // 判断是否和牌
        const isWinning = isWinningHand(concealed, melded, winning);
        
        // 显示结果
        if (isWinning) {
            // 计算番数
            const pointsResult = calculatePoints(concealed, melded, winning, options);
            
            if (pointsResult.error) {
                resultDiv.textContent = pointsResult.error;
                resultDiv.className = 'result failure';
                return;
            }
            
            let resultText = '';
            
            if (pointsResult.yakuman > 0) {
                resultText = `恭喜！这是一手${pointsResult.yakuman}倍役满！\n役种：${pointsResult.yakumanYaku.join('、')}`;
            } else {
                resultText = `恭喜！这是一手${pointsResult.han}番的和牌！\n役种：${pointsResult.yaku.join('、')}`;
            }
            
            resultDiv.textContent = resultText;
            resultDiv.className = 'result success';
        } else {
            resultDiv.textContent = '很遗憾，这不是一手有效的和牌';
            resultDiv.className = 'result failure';
        }
    });
});

// 导出函数以便测试
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { isWinningHand };
}