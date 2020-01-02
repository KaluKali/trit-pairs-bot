module.exports = function levenshtein(s1, s2, costs) {
    var i, j, m, n, flip, ch, chl, ii, ii2, cost, cutHalf;
    m = s1.length;
    n = s2.length;
    costs = costs || {};
    var cr = costs.replace || 1;
    var cri = costs.replaceCase || costs.replace || 1;
    var ci = costs.insert || 1;
    var cd = costs.remove || 1;

    cutHalf = flip = Math.max(m, n);

    var minCost = Math.min(cd, ci, cr);
    var minD = Math.max(minCost, (m - n) * cd);
    var minI = Math.max(minCost, (n - m) * ci);
    var buf = new Array((cutHalf * 2) - 1);

    for (i = 0; i <= n; ++i) {
        buf[i] = i * minD;
    }

    for (i = 0; i < m; ++i, flip = cutHalf - flip) {
        ch = s1[i];
        chl = ch.toLowerCase();

        buf[flip] = (i + 1) * minI;

        ii = flip;
        ii2 = cutHalf - flip;

        for (j = 0; j < n; ++j, ++ii, ++ii2) {
            cost = (ch === s2[j] ? 0 : (chl === s2[j].toLowerCase()) ? cri : cr);
            buf[ii + 1] = Math.min(buf[ii2 + 1] + cd, buf[ii] + ci, buf[ii2] + cost);
        }
    }
    return buf[n + cutHalf - flip];
}