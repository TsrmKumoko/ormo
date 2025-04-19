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

// 将所有牌合并成一个数组
function combineTiles(concealed, melded, winning) {
    return [...parseCode(concealed), ...parseCode(melded), ...parseCode(winning)];
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

// 主要判断函数
function isWinningHand(concealed, melded, winning) {
    // 合并所有牌
    const allTiles = combineTiles(concealed, melded, winning);
    
    // 计算每种牌的数量
    const tileCounts = countTiles(allTiles);
    
    // 检查是否有雀头
    if (!hasPair(tileCounts)) return false;
    
    // 计算副露中的面子数量
    const meldedTiles = parseCode(melded);
    const meldedSets = meldedTiles.length / 3; // 假设每个副露都是3张牌
    
    // 需要的总面子数是4（减去已有的副露）
    const setsNeeded = 4 - meldedSets;
    
    // 尝试每一种可能的雀头
    for (const tile in tileCounts) {
        if (tileCounts[tile] >= 2) {
            // 临时移除雀头
            tileCounts[tile] -= 2;
            
            // 检查剩余的牌是否可以组成所需数量的面子
            if (isValidHand({...tileCounts}, setsNeeded)) {
                return true;
            }
            
            // 恢复雀头（回溯）
            tileCounts[tile] += 2;
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