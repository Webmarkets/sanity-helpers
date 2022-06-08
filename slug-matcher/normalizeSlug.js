const normalizeSlug = slug => {
    let newStr = slug;

    // parse url hex encoded chars
    let hexPattern = /%[a-fA-F0-9]{2}/g;
    newStr = newStr.replaceAll(hexPattern, match => {
        let decimalCode = parseInt(match.substring(1, 3), 16);
        // only parse renderable chars
        if (decimalCode > 31 && decimalCode < 127) {
            return String.fromCharCode(decimalCode);
        } else {
            return '';
        }
    });

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