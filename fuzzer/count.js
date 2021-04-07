var fs = require('fs');
var path = require('path');

(async ()=>{
  try {
    const saves = await fs.promises.readdir( '/bakerx' );
    if ( saves.includes('count.json') ) {
      var countstr = fs.readFileSync('/bakerx/count.json');
      var dict = JSON.parse(countstr);
      const files = await fs.promises.readdir( process.argv.slice(2)[0] );
      for( const file of files ) {
        const current_path = path.join( process.argv.slice(2)[0], file );

        // Check if it's a txt file
        if ( file.includes('.txt') ) {
          var filestring = fs.readFileSync(current_path);
          // if it's a txt file, parse it for not containing "Failure: 0"
          // if it doesn't contain "Failure: 1", add file to map with a failure
          if ( !filestring.includes('Failures: 0') || !filestring.includes('Errors: 0') ) {
            dict[file]++;
          }
        }
      }
      //dict['test']++;
      fs.writeFile('/bakerx/count.json', JSON.stringify(dict), err => {
        if (err) {
          console.log('Error writing file', err);
        }
      })
    }
    else {
      const files = await fs.promises.readdir( process.argv.slice(2)[0] );
      var dict = {};
      for( const file of files ) {
        const current_path = path.join( process.argv.slice(2)[0], file );

        // Check if it's a txt file
        if ( file.includes('.txt') ) {
          var filestring = fs.readFileSync(current_path);
          // if it's a txt file, parse it for not containing "Failure: 0"
          // if it doesn't contain "Failure: 1", add file to map with a failure
          if ( !filestring.includes('Failures: 0') || !filestring.includes('Errors: 0') ) {
            dict[file] = 1;
          }
          else {
            dict[file] = 0;
          }
        }
      }
      //dict['test'] = 1;
      fs.writeFile('/bakerx/count.json', JSON.stringify(dict), err => {
        if (err) {
          console.log('Error writing file', err);
        }
      });
    }
  }
  catch( e ) {
      // Catch anything bad that happens
      console.error( "Error: ", e );
  }

})();