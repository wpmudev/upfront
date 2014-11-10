/*global module, require */
module.exports = function(grunt) {
	require('load-grunt-tasks')(grunt);
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.initConfig({
		sass: {
			options: {
				sourceMap: true
			},
			dist: {
				files: {
					'styles/editor-interface.css': 'styles/editor-interface.scss'
				}
			}
		},
		watch: {
			sass: {
				files: ['**/*.scss'],
				tasks: ['sass'],
				options: {
					spawn: false
				}
			}
		}
	});

	grunt.registerTask('default', ['sass']);
};
