/**
 * 日本麻将胡牌判断功能
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

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    const checkBtn = document.getElementById('checkBtn');
    const resultDiv = document.getElementById('result');
    
    checkBtn.addEventListener('click', () => {
        const concealed = document.getElementById('concealed').value.trim();
        const melded = document.getElementById('melded').value.trim();
        const winning = document.getElementById('winning').value.trim();
        const winSource = document.getElementById('winSource').value;
        
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
            resultDiv.textContent = '恭喜！这是一手有效的和牌';
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