const normalizeSlug = slug => {
    let newStr = slug;

    // parse url hex encoded chars
    let hexPattern = /%[a-fA-F0-9]{2}/g;
    newStr = newStr.replaceAll(hexPattern, match => {
        let decimalCode = parseInt(match.substring(1, 3), 16);
        return String.fromCharCode(decimalCode);
    });

    // replace diacritics and special characters
    let extendedChars = 'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;';
    var baseASCII = 'AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------';
    for (let i = 0; i < newStr.length; i++) {
        for (let j = 0; j < extendedChars.length; j++) {
            if (newStr[i] === extended[j]) {
                newStr = newStr.slice(0, i) + baseASCII[j] + newStr.slice(i + 1);
                break;
            }
        }
    }

    // terminate string at newline or return
    newStr = newStr.replace(/(\n|\r)+?.*/g, '');
    // replace spaces and tabs with dashes
    newStr = newStr.replace(/\ +/g, '-');
    // remove duplicate dashes
    newStr = newStr.replace(/-{2,}/g, '-');

    // replace digits with numerical
    let numberStrings = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    numberStrings.forEach((numString, index) => {
        let numPattern = new RegExp(`${numString}`, 'gi');
        newStr = newStr.replace(numPattern, index);
    });

    newStr = newStr.toLowerCase();

    return {
        literal: slug,
        normalized: newStr
    }
}

module.exports = normalizeSlug;