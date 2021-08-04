/*
 * grunt-compress-sfresources
 * https://github.com/oblongmana/grunt-compress-sfresources
 *
 * Copyright (c) 2014 James Hill
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var _ = require('lodash');
  var compress = require('grunt-contrib-compress/tasks/lib/compress.js');

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('compress_sfresources', 'Compresses Salesforce StaticResource bundle folders (created using MavensMate) into corresponding src/staticresource zip files', function() {
    //Put into async mode
    var done = this.async();
    // setTimeout(function(){grunt.log.writeln('Done waiting');done();},5000);
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      punctuation: '.',
      separator: ', ',
      // resourceBundlesDir: 'resource-bundles',
      resourceBundlesDir: 'test/fixtures',
      outputDir: 'src/staticresources'
    });

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        return grunt.file.read(filepath);
      }).join(grunt.util.normalizelf(options.separator));

      // Handle options.
      src += options.punctuation;

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      grunt.log.writeln('File "' + f.dest + '" created.');
    });


    //Create a files expression chasing down the resources we want to zip
    var allResourcesConfig = {
          expand: true,
          cwd: options.resourceBundlesDir,
          src: '*'
        };

    //Define a class representing a Compression to be done, and a queue to hold them
    var compressions = [];
    function Compression(config,archive,mode) {
      return {
        config: config,
        archive: archive,
        mode:mode
      };
    }

    //Go over all the resources to be compressed, creating Compression records for them
    grunt.task.normalizeMultiTaskFiles(allResourcesConfig).forEach(function(f){
      if(grunt.file.isDir(f.src[0])) {
        var currResourceConfig = {
          expand: true,
          cwd: f.src[0],
          src: '**'
        };
        compressions.push(new Compression(currResourceConfig,options.outputDir + '/'+f.dest+'.zip','zip'));
      }
    });

    //Execute all the compressions, but wait till they're all done before indicating we're finished
    var expectedCompressionsCount = compressions.length;
    var completedCompressionsCount = 0;
    var compressionComplete = function(opt_success) {
      if(opt_success === false){
        //If opt_success explicitly set to false, then immediately call done with false
        done(false);
      }
      completedCompressionsCount++;
      if(completedCompressionsCount === expectedCompressionsCount){
        //Indicate complete
        done();
      }
    };
    var firstRun = true;
    _.forEach(compressions,function(compression){
      var currCompress = compress(grunt);
      currCompress.options.archive = compression.archive;
      currCompress.options.mode = compression.mode;
      currCompress.tar(grunt.task.normalizeMultiTaskFiles(compression.config),compressionComplete);
      firstRun = false;
    });

  });

};
