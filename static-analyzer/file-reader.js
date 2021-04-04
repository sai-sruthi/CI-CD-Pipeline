const fs = require('fs');
const path = require('path');

class FileReader {
    /**
     * return list of absolute path to js files in a directory with recursive search
     * @param {string} directory 
     * @param {Array} files 
     */
    loadFiles(directory, files, extension) {
        const entries = fs.readdirSync(directory, {withFileTypes: true});
        entries.forEach((entry) => {
            const absolutePath = path.resolve(directory, entry.name);
            if(entry.isFile() && (path.extname(absolutePath) === extension)) {
                files.push(absolutePath);
            }
            else if(entry.isDirectory()) {
                return this.loadFiles(absolutePath, files, extension);
            }
        });
    }    
}

module.exports = new FileReader();