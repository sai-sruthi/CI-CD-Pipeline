class DirectoryAnalysis {
    constructor() {
        this.fileAnalysis = []; // collection of file analysis objects
    }
    
    /**
     * report if directory has any threshold violations
     * @returns boolean
     */
    hasViolations() {
        return this.fileAnalysis.some((fileAnalyis) => {
            const builders = Object.values(fileAnalyis);
            return builders.some((builder) => {
                return builder.hasViolations();
            });
        });
    }
}

module.exports = DirectoryAnalysis;