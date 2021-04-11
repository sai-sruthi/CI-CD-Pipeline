const fs = require('fs');
const path = require('path');

const blackListDirectories = ['node_modules'];

class FileReader {
    /**
     * return list of absolute path to js files in a directory with recursive search
     * @param {string} directory 
     * @param {Array} files 
     */
    loadFiles(directory, files, extension) {
        const absoluteDirectory = path.resolve(process.env.INIT_CWD, directory);
        const entries = fs.readdirSync(absoluteDirectory, {withFileTypes: true});
        entries.forEach((entry) => {
            const absolutePath = path.resolve(absoluteDirectory, entry.name);
            if(entry.isFile() && (path.extname(absolutePath) === extension)) {
                files.push(absolutePath);
            }
            else if(entry.isDirectory() && !blackListDirectories.includes(entry.name)) {
                return this.loadFiles(absolutePath, files, extension);
            }
        });
    }    
}

module.exports = new FileReader();